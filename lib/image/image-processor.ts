/**
 * ImageProcessor service - Main service for image processing operations
 * Integrates Sharp utilities for WebP conversion, thumbnail generation, and metadata extraction
 */

import { randomUUID } from 'crypto';
import { metadataExtractor } from './metadata-extractor';
import { 
  convertToWebP, 
  convertToJPEG, 
  generateAllThumbnails, 
  extractMetadata,
  validateImageBuffer,
  initializeSharp
} from './sharp-utils';
import { imageErrorHandler } from './error-handler';
import { IMAGE_CONFIG, ThumbnailSize } from './config';
import { 
  ProcessedImage, 
  ThumbnailSet, 
  ProcessingOptions
} from './types';
import { 
  recordImageProcessing, 
  recordWebPConversion, 
  recordThumbnailGeneration 
} from './performance-monitor';

export class ImageProcessor {
  constructor() {
    // Initialize Sharp with optimal settings
    initializeSharp();
  }

  /**
   * Process a single image: convert to WebP, generate thumbnails, extract metadata
   * Includes comprehensive error handling and fallback mechanisms
   */
  async processImage(
    inputBuffer: Buffer,
    originalFilename: string,
    establishmentId: string,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const startTime = performance.now();
    const context = {
      fileName: originalFilename,
      establishmentId,
      userId
    };

    try {
      // Check disk space before processing
      const spaceCheck = await imageErrorHandler.validateDiskSpaceForUpload(
        inputBuffer.length * 3 // Estimate 3x size for processed files
      );
      
      if (!spaceCheck.canUpload) {
        throw spaceCheck.error;
      }

      // Validate input buffer
      const isValid = await validateImageBuffer(inputBuffer);
      if (!isValid) {
        throw imageErrorHandler.createError(
          'INVALID_BUFFER',
          'Invalid image buffer provided',
          400,
          context
        );
      }

      // Generate unique ID for this image
      const imageId = randomUUID();
      
      // Extract metadata from original image
      const originalMetadata = await extractMetadata(inputBuffer);
      const originalSize = inputBuffer.length;
      
      // Convert to WebP with fallback handling
      let webpBuffer: Buffer;
      const webpStartTime = performance.now();
      try {
        webpBuffer = await convertToWebP(inputBuffer, IMAGE_CONFIG.webp.quality);
        const webpTime = performance.now() - webpStartTime;
        recordWebPConversion(
          webpTime,
          originalMetadata.format || 'unknown',
          originalSize,
          webpBuffer.length,
          true
        );
      } catch (webpError) {
        console.warn('WebP conversion failed, attempting fallback:', webpError);
        const webpTime = performance.now() - webpStartTime;
        recordWebPConversion(
          webpTime,
          originalMetadata.format || 'unknown',
          originalSize,
          0,
          false
        );
        
        const fallbackResult = await imageErrorHandler.handleConversionError(
          inputBuffer,
          webpError instanceof Error ? webpError : new Error('WebP conversion failed'),
          context
        );
        
        if (!fallbackResult.success || !fallbackResult.result) {
          throw fallbackResult.error;
        }
        
        webpBuffer = fallbackResult.result.buffer!;
      }
      
      // Generate JPEG fallback
      let jpegBuffer: Buffer;
      try {
        jpegBuffer = await convertToJPEG(inputBuffer, IMAGE_CONFIG.jpeg.quality);
      } catch (jpegError) {
        console.warn('JPEG fallback conversion failed:', jpegError);
        // If JPEG also fails, use the WebP buffer as fallback
        jpegBuffer = webpBuffer;
      }
      
      // Generate all required thumbnails (150x150, 300x300, 600x400, 1200x800)
      let thumbnailBuffers: Record<ThumbnailSize, Buffer>;
      let jpegThumbnailBuffers: Record<ThumbnailSize, Buffer>;
      
      const thumbnailStartTime = performance.now();
      try {
        thumbnailBuffers = await generateAllThumbnails(inputBuffer, 'webp');
        jpegThumbnailBuffers = await generateAllThumbnails(inputBuffer, 'jpeg');
        
        const thumbnailTime = performance.now() - thumbnailStartTime;
        // Record thumbnail generation for each size
        Object.keys(thumbnailBuffers).forEach((size) => {
          recordThumbnailGeneration(
            size,
            thumbnailTime / 4, // Approximate time per thumbnail
            thumbnailBuffers[size as ThumbnailSize].length,
            true
          );
        });
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed:', thumbnailError);
        throw imageErrorHandler.createError(
          'THUMBNAIL_FAILED',
          'Failed to generate thumbnails',
          500,
          context,
          { originalError: thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error' }
        );
      }
      
      // Create file paths based on establishment and date structure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const basePath = `${IMAGE_CONFIG.directories.base}/${establishmentId}/${year}/${month}`;
    
    const webpPath = `${basePath}/${IMAGE_CONFIG.directories.subdirs.webp}/${imageId}.webp`;
    const jpegFallbackPath = `${basePath}/${IMAGE_CONFIG.directories.subdirs.jpeg}/${imageId}.jpg`;
    
    // Create thumbnail info objects
    const thumbnails: ThumbnailSet = {
      small: {
        path: `${basePath}/${IMAGE_CONFIG.directories.subdirs.thumbnails}/small/${imageId}_150x150.webp`,
        url: `/api/images/${imageId}/thumbnail/small`,
        width: IMAGE_CONFIG.thumbnailSizes.small.width,
        height: IMAGE_CONFIG.thumbnailSizes.small.height,
        fileSize: thumbnailBuffers.small.length
      },
      medium: {
        path: `${basePath}/${IMAGE_CONFIG.directories.subdirs.thumbnails}/medium/${imageId}_300x300.webp`,
        url: `/api/images/${imageId}/thumbnail/medium`,
        width: IMAGE_CONFIG.thumbnailSizes.medium.width,
        height: IMAGE_CONFIG.thumbnailSizes.medium.height,
        fileSize: thumbnailBuffers.medium.length
      },
      large: {
        path: `${basePath}/${IMAGE_CONFIG.directories.subdirs.thumbnails}/large/${imageId}_600x400.webp`,
        url: `/api/images/${imageId}/thumbnail/large`,
        width: IMAGE_CONFIG.thumbnailSizes.large.width,
        height: IMAGE_CONFIG.thumbnailSizes.large.height,
        fileSize: thumbnailBuffers.large.length
      },
      xlarge: {
        path: `${basePath}/${IMAGE_CONFIG.directories.subdirs.thumbnails}/xlarge/${imageId}_1200x800.webp`,
        url: `/api/images/${imageId}/thumbnail/xlarge`,
        width: IMAGE_CONFIG.thumbnailSizes.xlarge.width,
        height: IMAGE_CONFIG.thumbnailSizes.xlarge.height,
        fileSize: thumbnailBuffers.xlarge.length
      }
    };

    // Create complete metadata object using MetadataExtractor
    const metadata = await metadataExtractor.extractImageMetadata(
      inputBuffer,
      originalFilename,
      establishmentId,
      userId,
      `/api/images/${imageId}.webp`,
      `/api/images/${imageId}.jpg`,
      thumbnails
    );

      // Record overall processing performance
      const totalProcessingTime = performance.now() - startTime;
      const totalProcessedSize = webpBuffer.length + jpegBuffer.length + 
        Object.values(thumbnailBuffers).reduce((sum, buf) => sum + buf.length, 0);
      
      recordImageProcessing(
        originalSize,
        totalProcessedSize,
        totalProcessingTime,
        Object.keys(thumbnailBuffers).length,
        originalMetadata.format || 'unknown'
      );

      return {
        webpPath,
        jpegFallbackPath,
        thumbnails,
        metadata,
        // Include the processed buffers for storage
        buffers: {
          webp: webpBuffer,
          jpeg: jpegBuffer,
          thumbnails: {
            webp: thumbnailBuffers,
            jpeg: jpegThumbnailBuffers
          }
        }
      } as ProcessedImage & { buffers: any };
      
    } catch (error) {
      // Handle any unexpected errors in the main processing
      const imgError = imageErrorHandler.createError(
        'PROCESSING_FAILED',
        error instanceof Error ? error.message : 'Image processing failed',
        500,
        context,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      imageErrorHandler.logError(imgError, 'image_processing');
      throw imgError;
    }
  }

  /**
   * Convert image to WebP format with specified quality
   */
  async convertToWebP(inputBuffer: Buffer, quality: number = IMAGE_CONFIG.webp.quality): Promise<Buffer> {
    return convertToWebP(inputBuffer, quality);
  }

  /**
   * Generate thumbnails for all required sizes
   */
  async generateThumbnails(inputBuffer: Buffer): Promise<Record<ThumbnailSize, Buffer>> {
    return generateAllThumbnails(inputBuffer, 'webp');
  }

  /**
   * Extract metadata from image buffer
   */
  async extractImageMetadata(inputBuffer: Buffer) {
    return extractMetadata(inputBuffer);
  }

  /**
   * Generate UUID-based filename
   */
  generateUniqueFilename(originalFilename?: string): string {
    return metadataExtractor.generateUniqueFilename(originalFilename);
  }

  /**
   * Validate image buffer
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    return validateImageBuffer(buffer);
  }

  /**
   * Process multiple images in batch
   */
  async processMultipleImages(
    images: Array<{ buffer: Buffer; filename: string }>,
    establishmentId: string,
    userId: string
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const image of images) {
      try {
        const processed = await this.processImage(
          image.buffer,
          image.filename,
          establishmentId,
          userId
        );
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process image ${image.filename}:`, error);
        // Continue processing other images even if one fails
        continue;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();