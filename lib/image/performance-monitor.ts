/**
 * Image-specific performance monitoring service
 * Tracks upload, processing, serving, and cleanup performance
 */

import { performanceMonitor, PerformanceMetric } from '../performance/monitoring';
import { promises as fs } from 'fs';
import path from 'path';
import { IMAGE_CONFIG } from './config';

export interface ImagePerformanceMetrics {
  upload: {
    totalUploads: number;
    averageUploadTime: number;
    averageFileSize: number;
    successRate: number;
  };
  processing: {
    averageProcessingTime: number;
    webpConversionTime: number;
    thumbnailGenerationTime: number;
    compressionRatio: number;
  };
  serving: {
    averageServeTime: number;
    cacheHitRate: number;
    formatDistribution: Record<string, number>;
    thumbnailUsage: Record<string, number>;
  };
  storage: {
    totalFiles: number;
    totalSize: number;
    orphanedFiles: number;
    diskUsagePercent: number;
  };
}

export interface ImageOptimizationRecommendation {
  type: 'compression' | 'caching' | 'cleanup' | 'format' | 'thumbnail';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  estimatedImpact: string;
}

class ImagePerformanceMonitor {
  private readonly baseUploadPath: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.baseUploadPath = path.join(process.cwd(), IMAGE_CONFIG.directories.base);
    this.startPeriodicCleanup();
  }

  /**
   * Record image upload performance
   */
  recordUpload(
    fileSize: number,
    processingTime: number,
    success: boolean,
    establishmentId: string,
    format: string
  ): void {
    performanceMonitor.recordMetric('image_upload_duration', processingTime, {
      establishment_id: establishmentId,
      format,
      success: success.toString(),
      file_size_mb: (fileSize / (1024 * 1024)).toFixed(2),
    });

    performanceMonitor.recordMetric('image_upload_file_size', fileSize, {
      establishment_id: establishmentId,
      format,
    });

    if (!success) {
      performanceMonitor.recordMetric('image_upload_error', 1, {
        establishment_id: establishmentId,
        format,
      });
    }
  }

  /**
   * Record image processing performance
   */
  recordProcessing(
    originalSize: number,
    processedSize: number,
    processingTime: number,
    thumbnailCount: number,
    format: string
  ): void {
    const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;

    performanceMonitor.recordMetric('image_processing_duration', processingTime, {
      format,
      thumbnail_count: thumbnailCount.toString(),
    });

    performanceMonitor.recordMetric('image_compression_ratio', compressionRatio, {
      format,
    });

    performanceMonitor.recordMetric('image_size_reduction', originalSize - processedSize, {
      format,
      original_size_mb: (originalSize / (1024 * 1024)).toFixed(2),
    });
  }

  /**
   * Record WebP conversion performance
   */
  recordWebPConversion(
    conversionTime: number,
    originalFormat: string,
    originalSize: number,
    webpSize: number,
    success: boolean
  ): void {
    performanceMonitor.recordMetric('webp_conversion_duration', conversionTime, {
      original_format: originalFormat,
      success: success.toString(),
    });

    if (success) {
      const compressionRatio = originalSize > 0 ? webpSize / originalSize : 1;
      performanceMonitor.recordMetric('webp_compression_ratio', compressionRatio, {
        original_format: originalFormat,
      });
    }
  }

  /**
   * Record thumbnail generation performance
   */
  recordThumbnailGeneration(
    thumbnailSize: string,
    generationTime: number,
    fileSize: number,
    success: boolean
  ): void {
    performanceMonitor.recordMetric('thumbnail_generation_duration', generationTime, {
      size: thumbnailSize,
      success: success.toString(),
    });

    if (success) {
      performanceMonitor.recordMetric('thumbnail_file_size', fileSize, {
        size: thumbnailSize,
      });
    }
  }

  /**
   * Record image serving performance
   */
  recordServing(
    serveTime: number,
    format: string,
    size: string | null,
    cacheHit: boolean,
    userAgent?: string
  ): void {
    performanceMonitor.recordMetric('image_serve_duration', serveTime, {
      format,
      size: size || 'original',
      cache_hit: cacheHit.toString(),
      user_agent: userAgent || 'unknown',
    });

    performanceMonitor.recordMetric('image_format_served', 1, {
      format,
    });

    if (size) {
      performanceMonitor.recordMetric('thumbnail_served', 1, {
        size,
      });
    }
  }

  /**
   * Record cleanup operation performance
   */
  recordCleanup(
    filesRemoved: number,
    spaceFreed: number,
    cleanupTime: number,
    type: 'orphaned' | 'expired' | 'manual'
  ): void {
    performanceMonitor.recordMetric('cleanup_duration', cleanupTime, {
      type,
      files_removed: filesRemoved.toString(),
    });

    performanceMonitor.recordMetric('cleanup_space_freed', spaceFreed, {
      type,
      space_freed_mb: (spaceFreed / (1024 * 1024)).toFixed(2),
    });
  }

  /**
   * Get comprehensive image performance metrics
   */
  async getImageMetrics(timeRangeHours: number = 24): Promise<ImagePerformanceMetrics> {
    const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    // Upload metrics
    const uploadMetrics = performanceMonitor.getMetrics('image_upload_duration', startTime);
    const uploadErrors = performanceMonitor.getMetrics('image_upload_error', startTime);
    const fileSizeMetrics = performanceMonitor.getMetrics('image_upload_file_size', startTime);

    const totalUploads = uploadMetrics.length;
    const averageUploadTime = totalUploads > 0 
      ? uploadMetrics.reduce((sum, m) => sum + m.value, 0) / totalUploads 
      : 0;
    const averageFileSize = fileSizeMetrics.length > 0
      ? fileSizeMetrics.reduce((sum, m) => sum + m.value, 0) / fileSizeMetrics.length
      : 0;
    const successRate = totalUploads > 0 
      ? ((totalUploads - uploadErrors.length) / totalUploads) * 100 
      : 100;

    // Processing metrics
    const processingMetrics = performanceMonitor.getMetrics('image_processing_duration', startTime);
    const webpMetrics = performanceMonitor.getMetrics('webp_conversion_duration', startTime);
    const thumbnailMetrics = performanceMonitor.getMetrics('thumbnail_generation_duration', startTime);
    const compressionMetrics = performanceMonitor.getMetrics('image_compression_ratio', startTime);

    const averageProcessingTime = processingMetrics.length > 0
      ? processingMetrics.reduce((sum, m) => sum + m.value, 0) / processingMetrics.length
      : 0;
    const webpConversionTime = webpMetrics.length > 0
      ? webpMetrics.reduce((sum, m) => sum + m.value, 0) / webpMetrics.length
      : 0;
    const thumbnailGenerationTime = thumbnailMetrics.length > 0
      ? thumbnailMetrics.reduce((sum, m) => sum + m.value, 0) / thumbnailMetrics.length
      : 0;
    const compressionRatio = compressionMetrics.length > 0
      ? compressionMetrics.reduce((sum, m) => sum + m.value, 0) / compressionMetrics.length
      : 1;

    // Serving metrics
    const servingMetrics = performanceMonitor.getMetrics('image_serve_duration', startTime);
    const formatMetrics = performanceMonitor.getMetrics('image_format_served', startTime);
    const thumbnailServedMetrics = performanceMonitor.getMetrics('thumbnail_served', startTime);

    const averageServeTime = servingMetrics.length > 0
      ? servingMetrics.reduce((sum, m) => sum + m.value, 0) / servingMetrics.length
      : 0;

    const cacheHits = servingMetrics.filter(m => m.tags?.cache_hit === 'true').length;
    const cacheHitRate = servingMetrics.length > 0 ? (cacheHits / servingMetrics.length) * 100 : 0;

    // Format distribution
    const formatDistribution: Record<string, number> = {};
    formatMetrics.forEach(m => {
      const format = m.tags?.format || 'unknown';
      formatDistribution[format] = (formatDistribution[format] || 0) + 1;
    });

    // Thumbnail usage
    const thumbnailUsage: Record<string, number> = {};
    thumbnailServedMetrics.forEach(m => {
      const size = m.tags?.size || 'unknown';
      thumbnailUsage[size] = (thumbnailUsage[size] || 0) + 1;
    });

    // Storage metrics
    const storageStats = await this.getStorageStats();

    return {
      upload: {
        totalUploads,
        averageUploadTime,
        averageFileSize,
        successRate,
      },
      processing: {
        averageProcessingTime,
        webpConversionTime,
        thumbnailGenerationTime,
        compressionRatio,
      },
      serving: {
        averageServeTime,
        cacheHitRate,
        formatDistribution,
        thumbnailUsage,
      },
      storage: storageStats,
    };
  }

  /**
   * Get storage statistics
   */
  private async getStorageStats(): Promise<ImagePerformanceMetrics['storage']> {
    try {
      const stats = await this.calculateDirectoryStats(this.baseUploadPath);
      const orphanedFiles = await this.findOrphanedFiles();
      
      // Get disk usage (simplified - in production you'd use statvfs or similar)
      const diskUsagePercent = 0; // Placeholder - would need platform-specific implementation

      return {
        totalFiles: stats.fileCount,
        totalSize: stats.totalSize,
        orphanedFiles: orphanedFiles.length,
        diskUsagePercent,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        orphanedFiles: 0,
        diskUsagePercent: 0,
      };
    }
  }

  /**
   * Calculate directory statistics recursively
   */
  private async calculateDirectoryStats(dirPath: string): Promise<{ fileCount: number; totalSize: number }> {
    let fileCount = 0;
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subStats = await this.calculateDirectoryStats(fullPath);
          fileCount += subStats.fileCount;
          totalSize += subStats.totalSize;
        } else if (entry.isFile()) {
          const stat = await fs.stat(fullPath);
          fileCount++;
          totalSize += stat.size;
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      console.warn(`Cannot access directory ${dirPath}:`, error);
    }

    return { fileCount, totalSize };
  }

  /**
   * Find orphaned files (files not referenced in database)
   */
  private async findOrphanedFiles(): Promise<string[]> {
    // This is a simplified implementation
    // In a real system, you'd query the database to find referenced files
    // and compare with files on disk
    const orphanedFiles: string[] = [];

    try {
      // For now, just return empty array
      // Real implementation would:
      // 1. Get all image URLs from database
      // 2. List all files on disk
      // 3. Find files on disk not referenced in database
      // 4. Consider files older than X days as potentially orphaned
    } catch (error) {
      console.error('Error finding orphaned files:', error);
    }

    return orphanedFiles;
  }

  /**
   * Generate performance optimization recommendations
   */
  async generateRecommendations(): Promise<ImageOptimizationRecommendation[]> {
    const recommendations: ImageOptimizationRecommendation[] = [];
    const metrics = await this.getImageMetrics(24);

    // Check compression ratio
    if (metrics.processing.compressionRatio > 0.8) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        message: 'Image compression ratio is high, indicating poor compression efficiency',
        action: 'Consider adjusting WebP quality settings or using more aggressive compression',
        estimatedImpact: 'Could reduce storage by 20-40% and improve loading times',
      });
    }

    // Check cache hit rate
    if (metrics.serving.cacheHitRate < 70) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        message: 'Low cache hit rate detected',
        action: 'Review cache headers and CDN configuration',
        estimatedImpact: 'Could improve serving performance by 50-80%',
      });
    }

    // Check orphaned files
    if (metrics.storage.orphanedFiles > 100) {
      recommendations.push({
        type: 'cleanup',
        priority: 'medium',
        message: `${metrics.storage.orphanedFiles} orphaned files detected`,
        action: 'Run cleanup process to remove unused files',
        estimatedImpact: `Could free up significant disk space`,
      });
    }

    // Check format distribution
    const webpUsage = metrics.serving.formatDistribution.webp || 0;
    const totalServed = Object.values(metrics.serving.formatDistribution).reduce((a, b) => a + b, 0);
    const webpPercentage = totalServed > 0 ? (webpUsage / totalServed) * 100 : 0;

    if (webpPercentage < 60) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        message: 'Low WebP usage detected - many clients receiving JPEG fallbacks',
        action: 'Review browser detection logic and WebP support',
        estimatedImpact: 'Could reduce bandwidth usage by 25-35%',
      });
    }

    // Check thumbnail usage
    const thumbnailTotal = Object.values(metrics.serving.thumbnailUsage).reduce((a, b) => a + b, 0);
    if (thumbnailTotal === 0) {
      recommendations.push({
        type: 'thumbnail',
        priority: 'low',
        message: 'No thumbnail usage detected',
        action: 'Ensure thumbnails are being served for appropriate contexts',
        estimatedImpact: 'Could improve page load times significantly',
      });
    }

    // Check upload performance
    if (metrics.upload.averageUploadTime > 5000) {
      recommendations.push({
        type: 'compression',
        priority: 'high',
        message: 'Slow upload processing detected',
        action: 'Review image processing pipeline and consider parallel processing',
        estimatedImpact: 'Could reduce upload times by 30-50%',
      });
    }

    return recommendations;
  }

  /**
   * Perform automated cleanup of orphaned files
   */
  async performAutomatedCleanup(): Promise<{ filesRemoved: number; spaceFreed: number }> {
    const startTime = performance.now();
    let filesRemoved = 0;
    let spaceFreed = 0;

    try {
      const orphanedFiles = await this.findOrphanedFiles();

      for (const filePath of orphanedFiles) {
        try {
          const stat = await fs.stat(filePath);
          await fs.unlink(filePath);
          filesRemoved++;
          spaceFreed += stat.size;
        } catch (error) {
          console.warn(`Failed to remove orphaned file ${filePath}:`, error);
        }
      }

      const cleanupTime = performance.now() - startTime;
      this.recordCleanup(filesRemoved, spaceFreed, cleanupTime, 'orphaned');

      console.log(`Automated cleanup completed: ${filesRemoved} files removed, ${(spaceFreed / (1024 * 1024)).toFixed(2)} MB freed`);
    } catch (error) {
      console.error('Automated cleanup failed:', error);
    }

    return { filesRemoved, spaceFreed };
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 6 hours
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performAutomatedCleanup();
      } catch (error) {
        console.error('Periodic cleanup error:', error);
      }
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(): Promise<{
    metrics: ImagePerformanceMetrics;
    recommendations: ImageOptimizationRecommendation[];
    alerts: any[];
    healthStatus: 'healthy' | 'warning' | 'error';
  }> {
    const metrics = await this.getImageMetrics(24);
    const recommendations = await this.generateRecommendations();
    const alerts = performanceMonitor.getAlerts(10);

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (metrics.upload.successRate < 95 || metrics.serving.cacheHitRate < 50) {
      healthStatus = 'error';
    } else if (metrics.upload.successRate < 98 || metrics.serving.cacheHitRate < 70) {
      healthStatus = 'warning';
    }

    return {
      metrics,
      recommendations,
      alerts,
      healthStatus,
    };
  }
}

// Singleton instance
export const imagePerformanceMonitor = new ImagePerformanceMonitor();

// Convenience functions
export const recordImageUpload = imagePerformanceMonitor.recordUpload.bind(imagePerformanceMonitor);
export const recordImageProcessing = imagePerformanceMonitor.recordProcessing.bind(imagePerformanceMonitor);
export const recordImageServing = imagePerformanceMonitor.recordServing.bind(imagePerformanceMonitor);
export const recordWebPConversion = imagePerformanceMonitor.recordWebPConversion.bind(imagePerformanceMonitor);
export const recordThumbnailGeneration = imagePerformanceMonitor.recordThumbnailGeneration.bind(imagePerformanceMonitor);