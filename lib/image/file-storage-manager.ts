/**
 * File Storage Manager Service
 * Handles file storage, organization, and cleanup operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { 
  generateFullDirectoryStructure, 
  ensureDirectoryExists, 
  setFilePermissions,
  cleanupEmptyDirectories 
} from './directory-manager';
import { IMAGE_CONFIG } from './config';
import { ThumbnailSize } from './types';

export interface FileStorageOptions {
  establishmentId: string;
  preserveOriginal?: boolean;
  generateFallback?: boolean;
}

export interface StoredFileInfo {
  id: string;
  originalPath?: string;
  webpPath: string;
  jpegPath?: string;
  thumbnailPaths: Record<ThumbnailSize, string>;
  metadata: {
    originalFilename: string;
    fileSize: number;
    storedAt: Date;
  };
}

export interface OrphanedFile {
  path: string;
  type: 'original' | 'webp' | 'jpeg' | 'thumbnail';
  size: number;
  lastModified: Date;
}

export class FileStorageManager {
  /**
   * Store image file to the file system
   */
  async storeImage(
    buffer: Buffer, 
    filename: string, 
    options: FileStorageOptions
  ): Promise<string> {
    const { establishmentId } = options;
    const date = new Date();
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    // Ensure directories exist
    await ensureDirectoryExists(directories.webp);
    
    // Generate unique filename
    const id = randomUUID();
    const ext = path.extname(filename);
    const storedFilename = `${id}${ext}`;
    const filePath = path.join(directories.webp, storedFilename);
    
    // Write file
    await fs.writeFile(filePath, buffer);
    
    // Set proper permissions
    await setFilePermissions(filePath);
    
    return filePath;
  }

  /**
   * Store WebP image
   */
  async storeWebPImage(
    buffer: Buffer,
    filename: string,
    options: FileStorageOptions
  ): Promise<string> {
    const { establishmentId } = options;
    const date = new Date();
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    await ensureDirectoryExists(directories.webp);
    
    const id = randomUUID();
    const webpFilename = `${id}.webp`;
    const filePath = path.join(directories.webp, webpFilename);
    
    await fs.writeFile(filePath, buffer);
    await setFilePermissions(filePath);
    
    return filePath;
  }

  /**
   * Store JPEG fallback image
   */
  async storeJPEGImage(
    buffer: Buffer,
    filename: string,
    options: FileStorageOptions
  ): Promise<string> {
    const { establishmentId } = options;
    const date = new Date();
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    await ensureDirectoryExists(directories.jpeg);
    
    const id = path.parse(filename).name; // Use same ID as WebP
    const jpegFilename = `${id}.jpg`;
    const filePath = path.join(directories.jpeg, jpegFilename);
    
    await fs.writeFile(filePath, buffer);
    await setFilePermissions(filePath);
    
    return filePath;
  }

  /**
   * Store original image if preservation is enabled
   */
  async storeOriginalImage(
    buffer: Buffer,
    originalFilename: string,
    options: FileStorageOptions
  ): Promise<string | null> {
    if (!options.preserveOriginal) {
      return null;
    }

    const { establishmentId } = options;
    const date = new Date();
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    await ensureDirectoryExists(directories.originals);
    
    const id = randomUUID();
    const ext = path.extname(originalFilename);
    const storedFilename = `${id}${ext}`;
    const filePath = path.join(directories.originals, storedFilename);
    
    await fs.writeFile(filePath, buffer);
    await setFilePermissions(filePath);
    
    return filePath;
  }

  /**
   * Store thumbnail images
   */
  async storeThumbnails(
    thumbnailBuffers: Record<ThumbnailSize, Buffer>,
    baseFilename: string,
    options: FileStorageOptions
  ): Promise<Record<ThumbnailSize, string>> {
    const { establishmentId } = options;
    const date = new Date();
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    const thumbnailPaths: Record<ThumbnailSize, string> = {} as Record<ThumbnailSize, string>;
    const id = path.parse(baseFilename).name;
    
    // Store each thumbnail size
    for (const [size, buffer] of Object.entries(thumbnailBuffers) as [ThumbnailSize, Buffer][]) {
      const thumbnailDir = directories.thumbnails[size];
      await ensureDirectoryExists(thumbnailDir);
      
      const thumbnailFilename = `${id}_${IMAGE_CONFIG.thumbnailSizes[size].width}x${IMAGE_CONFIG.thumbnailSizes[size].height}.webp`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
      
      await fs.writeFile(thumbnailPath, buffer);
      await setFilePermissions(thumbnailPath);
      
      thumbnailPaths[size] = thumbnailPath;
    }
    
    return thumbnailPaths;
  }

  /**
   * Delete image and all associated files
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      // Get the base filename and directory structure
      const parsedPath = path.parse(imagePath);
      const baseId = parsedPath.name.split('_')[0]; // Remove size suffix if present
      const establishmentId = this.extractEstablishmentIdFromPath(imagePath);
      
      if (!establishmentId) {
        throw new Error('Cannot determine establishment ID from path');
      }

      const date = this.extractDateFromPath(imagePath);
      const directories = generateFullDirectoryStructure(establishmentId, date);
      
      // Delete all associated files
      const filesToDelete = [
        // Original file
        path.join(directories.originals, `${baseId}.*`),
        // WebP file
        path.join(directories.webp, `${baseId}.webp`),
        // JPEG fallback
        path.join(directories.jpeg, `${baseId}.jpg`),
        // All thumbnails
        ...Object.values(directories.thumbnails).map(dir => 
          path.join(dir, `${baseId}_*.webp`)
        )
      ];
      
      // Delete files using glob patterns
      for (const pattern of filesToDelete) {
        await this.deleteFilesByPattern(pattern);
      }
      
      // Clean up empty directories
      await this.cleanupEmptyDirectoriesForEstablishment(establishmentId, date);
      
    } catch (error) {
      throw new Error(`Failed to delete image ${imagePath}: ${error}`);
    }
  }

  /**
   * Delete files matching a pattern
   */
  private async deleteFilesByPattern(pattern: string): Promise<void> {
    const dir = path.dirname(pattern);
    const filename = path.basename(pattern);
    
    try {
      const files = await fs.readdir(dir);
      const matchingFiles = files.filter(file => {
        if (filename.includes('*')) {
          const regex = new RegExp(filename.replace(/\*/g, '.*'));
          return regex.test(file);
        }
        return file === filename;
      });
      
      for (const file of matchingFiles) {
        const filePath = path.join(dir, file);
        await fs.unlink(filePath);
      }
    } catch (error) {
      // Ignore errors for non-existent directories or files
    }
  }

  /**
   * Extract establishment ID from file path
   */
  private extractEstablishmentIdFromPath(filePath: string): string | null {
    const parts = filePath.split(path.sep);
    const baseIndex = parts.findIndex(part => part === 'images');
    
    if (baseIndex !== -1 && baseIndex + 1 < parts.length) {
      return parts[baseIndex + 1];
    }
    
    return null;
  }

  /**
   * Extract date from file path
   */
  private extractDateFromPath(filePath: string): Date {
    const parts = filePath.split(path.sep);
    const baseIndex = parts.findIndex(part => part === 'images');
    
    if (baseIndex !== -1 && baseIndex + 3 < parts.length) {
      const year = parseInt(parts[baseIndex + 2]);
      const month = parseInt(parts[baseIndex + 3]) - 1; // Month is 0-indexed
      
      if (!isNaN(year) && !isNaN(month)) {
        return new Date(year, month, 1);
      }
    }
    
    return new Date(); // Fallback to current date
  }

  /**
   * Generate image path for establishment
   */
  getImagePath(establishmentId: string, filename: string, date: Date = new Date()): string {
    const directories = generateFullDirectoryStructure(establishmentId, date);
    return path.join(directories.webp, filename);
  }

  /**
   * Generate URL for stored image
   */
  generateImageUrl(filePath: string): string {
    // Convert absolute path to relative URL
    const relativePath = path.relative(process.cwd(), filePath);
    return `/api/images/${path.basename(filePath)}`;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Clean up empty directories for establishment
   */
  private async cleanupEmptyDirectoriesForEstablishment(
    establishmentId: string, 
    date: Date
  ): Promise<void> {
    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    // Clean up thumbnail directories first
    for (const thumbnailDir of Object.values(directories.thumbnails)) {
      await cleanupEmptyDirectories(thumbnailDir);
    }
    
    // Clean up main directories
    await cleanupEmptyDirectories(directories.jpeg);
    await cleanupEmptyDirectories(directories.webp);
    await cleanupEmptyDirectories(directories.originals);
    await cleanupEmptyDirectories(directories.base);
  }

  /**
   * Find orphaned files (files not referenced in database)
   */
  async findOrphanedFiles(establishmentId?: string): Promise<OrphanedFile[]> {
    const orphanedFiles: OrphanedFile[] = [];
    const baseDir = establishmentId 
      ? path.join(IMAGE_CONFIG.directories.base, establishmentId)
      : IMAGE_CONFIG.directories.base;
    
    try {
      await this.scanDirectoryForOrphans(baseDir, orphanedFiles);
    } catch (error) {
      console.warn(`Failed to scan for orphaned files in ${baseDir}:`, error);
    }
    
    return orphanedFiles;
  }

  /**
   * Recursively scan directory for orphaned files
   */
  private async scanDirectoryForOrphans(
    dirPath: string, 
    orphanedFiles: OrphanedFile[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectoryForOrphans(fullPath, orphanedFiles);
        } else if (entry.isFile()) {
          // Check if file is an image file
          const ext = path.extname(entry.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const stats = await fs.stat(fullPath);
            
            // Determine file type based on directory structure
            let fileType: OrphanedFile['type'] = 'webp';
            if (fullPath.includes('/originals/')) fileType = 'original';
            else if (fullPath.includes('/jpeg/')) fileType = 'jpeg';
            else if (fullPath.includes('/thumbnails/')) fileType = 'thumbnail';
            
            orphanedFiles.push({
              path: fullPath,
              type: fileType,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles(orphanedFiles: OrphanedFile[]): Promise<number> {
    let deletedCount = 0;
    
    for (const file of orphanedFiles) {
      try {
        await fs.unlink(file.path);
        deletedCount++;
        
        // Clean up empty parent directories
        const parentDir = path.dirname(file.path);
        await cleanupEmptyDirectories(parentDir);
      } catch (error) {
        console.warn(`Failed to delete orphaned file ${file.path}:`, error);
      }
    }
    
    return deletedCount;
  }

  /**
   * Rollback file operations (delete files that were created during a failed operation)
   */
  async rollbackFileOperations(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (await this.fileExists(filePath)) {
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.warn(`Failed to rollback file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get storage statistics for establishment
   */
  async getStorageStats(establishmentId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: { original: 0, webp: 0, jpeg: 0, thumbnail: 0 },
      sizeByType: { original: 0, webp: 0, jpeg: 0, thumbnail: 0 }
    };
    
    const baseDir = path.join(IMAGE_CONFIG.directories.base, establishmentId);
    
    try {
      await this.calculateDirectoryStats(baseDir, stats);
    } catch (error) {
      console.warn(`Failed to calculate storage stats for ${establishmentId}:`, error);
    }
    
    return stats;
  }

  /**
   * Calculate directory statistics recursively
   */
  private async calculateDirectoryStats(
    dirPath: string, 
    stats: any
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.calculateDirectoryStats(fullPath, stats);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const fileStats = await fs.stat(fullPath);
            const size = fileStats.size;
            
            stats.totalFiles++;
            stats.totalSize += size;
            
            // Determine file type
            let fileType = 'webp';
            if (fullPath.includes('/originals/')) fileType = 'original';
            else if (fullPath.includes('/jpeg/')) fileType = 'jpeg';
            else if (fullPath.includes('/thumbnails/')) fileType = 'thumbnail';
            
            stats.filesByType[fileType]++;
            stats.sizeByType[fileType] += size;
          }
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
  }

  /**
   * Complete cleanup operation with rollback support
   * Removes all files associated with an image and handles failures gracefully
   */
  async completeCleanup(
    imageId: string, 
    establishmentId: string, 
    date: Date = new Date()
  ): Promise<{ success: boolean; deletedFiles: string[]; errors: string[] }> {
    const result = {
      success: true,
      deletedFiles: [] as string[],
      errors: [] as string[]
    };

    const directories = generateFullDirectoryStructure(establishmentId, date);
    
    // List all potential files to delete
    const filesToDelete = [
      path.join(directories.originals, `${imageId}.*`),
      path.join(directories.webp, `${imageId}.webp`),
      path.join(directories.jpeg, `${imageId}.jpg`),
      ...Object.values(directories.thumbnails).map(dir => 
        path.join(dir, `${imageId}_*.webp`)
      )
    ];

    // Track files that were successfully deleted for potential rollback
    const deletedFiles: string[] = [];

    try {
      // Delete each file pattern
      for (const pattern of filesToDelete) {
        try {
          const deleted = await this.deleteFilesByPatternWithTracking(pattern);
          deletedFiles.push(...deleted);
          result.deletedFiles.push(...deleted);
        } catch (error) {
          result.errors.push(`Failed to delete ${pattern}: ${error}`);
          result.success = false;
        }
      }

      // Clean up empty directories if all deletions were successful
      if (result.success) {
        await this.cleanupEmptyDirectoriesForEstablishment(establishmentId, date);
      }

    } catch (error) {
      result.errors.push(`Cleanup operation failed: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Delete files by pattern and return list of deleted files
   */
  private async deleteFilesByPatternWithTracking(pattern: string): Promise<string[]> {
    const dir = path.dirname(pattern);
    const filename = path.basename(pattern);
    const deletedFiles: string[] = [];
    
    try {
      const files = await fs.readdir(dir);
      const matchingFiles = files.filter(file => {
        if (filename.includes('*')) {
          const regex = new RegExp(filename.replace(/\*/g, '.*'));
          return regex.test(file);
        }
        return file === filename;
      });
      
      for (const file of matchingFiles) {
        const filePath = path.join(dir, file);
        await fs.unlink(filePath);
        deletedFiles.push(filePath);
      }
    } catch (error) {
      // Directory doesn't exist or other error - not necessarily a problem
    }
    
    return deletedFiles;
  }

  /**
   * Batch cleanup operation for multiple images
   */
  async batchCleanup(
    imageIds: string[], 
    establishmentId: string,
    date: Date = new Date()
  ): Promise<{ 
    totalProcessed: number; 
    successful: number; 
    failed: number; 
    errors: string[] 
  }> {
    const result = {
      totalProcessed: imageIds.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const imageId of imageIds) {
      try {
        const cleanupResult = await this.completeCleanup(imageId, establishmentId, date);
        
        if (cleanupResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(...cleanupResult.errors);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to cleanup ${imageId}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Emergency rollback - restore files from a backup location
   * This is a safety mechanism for critical operations
   */
  async emergencyRollback(
    backupPaths: string[], 
    originalPaths: string[]
  ): Promise<{ success: boolean; restored: string[]; errors: string[] }> {
    const result = {
      success: true,
      restored: [] as string[],
      errors: [] as string[]
    };

    if (backupPaths.length !== originalPaths.length) {
      result.success = false;
      result.errors.push('Backup and original path arrays must have the same length');
      return result;
    }

    for (let i = 0; i < backupPaths.length; i++) {
      const backupPath = backupPaths[i];
      const originalPath = originalPaths[i];

      try {
        // Check if backup exists
        if (await this.fileExists(backupPath)) {
          // Ensure target directory exists
          await ensureDirectoryExists(path.dirname(originalPath));
          
          // Copy backup to original location
          await fs.copyFile(backupPath, originalPath);
          await setFilePermissions(originalPath);
          
          result.restored.push(originalPath);
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Failed to restore ${originalPath}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Validate file system integrity for an establishment
   */
  async validateFileSystemIntegrity(establishmentId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const result = {
      isValid: true,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    try {
      const baseDir = path.join(IMAGE_CONFIG.directories.base, establishmentId);
      
      // Check if base directory exists
      if (!(await this.fileExists(baseDir))) {
        result.isValid = false;
        result.issues.push(`Base directory does not exist: ${baseDir}`);
        result.recommendations.push('Create the base directory structure');
        return result;
      }

      // Check directory permissions
      const stats = await fs.stat(baseDir);
      if (!stats.isDirectory()) {
        result.isValid = false;
        result.issues.push(`Base path is not a directory: ${baseDir}`);
      }

      // Find orphaned files
      const orphanedFiles = await this.findOrphanedFiles(establishmentId);
      if (orphanedFiles.length > 0) {
        result.issues.push(`Found ${orphanedFiles.length} orphaned files`);
        result.recommendations.push('Run cleanup operation to remove orphaned files');
      }

      // Check for empty directories
      await this.checkForEmptyDirectories(baseDir, result);

    } catch (error) {
      result.isValid = false;
      result.issues.push(`Failed to validate file system: ${error}`);
    }

    return result;
  }

  /**
   * Check for empty directories and add to validation result
   */
  private async checkForEmptyDirectories(
    dirPath: string, 
    result: { issues: string[]; recommendations: string[] }
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      if (entries.length === 0) {
        result.issues.push(`Empty directory found: ${dirPath}`);
        result.recommendations.push('Remove empty directories to clean up file system');
        return;
      }

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dirPath, entry.name);
          await this.checkForEmptyDirectories(fullPath, result);
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
  }
}

// Export singleton instance
export const fileStorageManager = new FileStorageManager();