/**
 * Base64 Migration Service
 * Handles migration of base64 images to file system storage
 */

import { randomUUID } from 'crypto';
import { imageProcessor } from './image-processor';
import { fileStorageManager } from './file-storage-manager';
import { imageMetadataStore } from './image-metadata-store';
import { EstablishmentModel } from '@/models/Establishment.model';
import { AccommodationModel } from '@/models/Accommodation.model';

/**
 * Base64 image detection result
 */
export interface Base64ImageInfo {
  type: 'establishment' | 'accommodation';
  id: string;
  base64Images: string[];
  entityName?: string;
}

/**
 * Migration progress tracking
 */
export interface MigrationProgress {
  totalEntities: number;
  processedEntities: number;
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  currentEntity?: string;
  currentImage?: string;
  errors: Array<{
    entityId: string;
    entityType: 'establishment' | 'accommodation';
    imageIndex: number;
    base64Data: string;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * Migration result for a single image
 */
export interface ImageMigrationResult {
  success: boolean;
  originalBase64: string;
  newUrl?: string;
  error?: string;
  metadata?: {
    fileSize: number;
    dimensions: { width: number; height: number };
    mimeType: string;
  };
}

/**
 * Batch migration result
 */
export interface BatchMigrationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  progress: MigrationProgress;
  newUrls: string[];
  errors: Array<{
    entityId: string;
    entityType: 'establishment' | 'accommodation';
    imageIndex: number;
    error: string;
  }>;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  batchSize?: number;
  skipErrors?: boolean;
  dryRun?: boolean;
  userId?: string;
  progressCallback?: (progress: MigrationProgress) => void;
  errorCallback?: (error: any) => void;
}

export class Base64MigrationService {
  private readonly DEFAULT_BATCH_SIZE = 10;
  private readonly DEFAULT_USER_ID = '000000000000000000000000'; // Fallback user ID

  /**
   * Detect all base64 images in the database
   */
  async detectBase64Images(): Promise<Base64ImageInfo[]> {
    try {
      const results: Base64ImageInfo[] = [];

      // Find establishments with base64 images
      const establishments = await EstablishmentModel.find({
        images: { $regex: /^data:image\// }
      }).select('_id name images');

      for (const establishment of establishments) {
        const base64Images = establishment.images.filter(image => 
          this.isBase64Image(image)
        );
        
        if (base64Images.length > 0) {
          results.push({
            type: 'establishment',
            id: establishment._id.toString(),
            entityName: establishment.name,
            base64Images,
          });
        }
      }

      // Find accommodations with base64 images
      const accommodations = await AccommodationModel.find({
        images: { $regex: /^data:image\// }
      }).select('_id name images');

      for (const accommodation of accommodations) {
        const base64Images = accommodation.images.filter(image => 
          this.isBase64Image(image)
        );
        
        if (base64Images.length > 0) {
          results.push({
            type: 'accommodation',
            id: accommodation._id.toString(),
            entityName: accommodation.name,
            base64Images,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to detect base64 images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a string is a base64 image
   */
  isBase64Image(imageString: string): boolean {
    if (!imageString || typeof imageString !== 'string') {
      return false;
    }
    
    // Check if it matches the full base64 image pattern
    // Format: data:image/{subtype};base64,{data}
    // MIME subtypes can contain letters, numbers, dots, hyphens, and plus signs
    const base64ImagePattern = /^data:image\/[a-zA-Z0-9+\-.]+;base64,/;
    return base64ImagePattern.test(imageString) && imageString.split(';base64,')[1]?.length > 0;
  }

  /**
   * Extract image data from base64 string
   */
  extractBase64Data(base64String: string): { mimeType: string; buffer: Buffer } {
    if (!this.isBase64Image(base64String)) {
      throw new Error('Invalid base64 image string');
    }

    try {
      // Parse data URL: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...
      const matches = base64String.match(/^data:image\/([^;]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format');
      }

      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return { mimeType, buffer };
    } catch (error) {
      throw new Error(`Failed to extract base64 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrate a single base64 image to file system
   */
  async migrateSingleImage(
    base64String: string,
    establishmentId: string,
    userId: string = this.DEFAULT_USER_ID,
    originalFilename?: string
  ): Promise<ImageMigrationResult> {
    try {
      // Extract image data from base64
      const { mimeType, buffer } = this.extractBase64Data(base64String);
      
      // Generate filename if not provided
      const filename = originalFilename || `migrated_${randomUUID()}.${mimeType.split('/')[1]}`;
      
      // Process the image (convert to WebP, generate thumbnails, etc.)
      const processedImage = await imageProcessor.processImage(
        buffer,
        filename,
        establishmentId,
        userId
      );

      // Store the processed image files
      const storedFiles = await this.storeProcessedImage(processedImage, establishmentId);
      
      // Create metadata record
      await imageMetadataStore.create({
        establishmentId,
        originalFilename: filename,
        mimeType,
        fileSize: buffer.length,
        dimensions: processedImage.metadata.dimensions,
        webpUrl: processedImage.metadata.webpUrl,
        jpegFallbackUrl: processedImage.metadata.jpegFallbackUrl,
        thumbnails: processedImage.thumbnails,
        uploadedBy: userId,
      });

      return {
        success: true,
        originalBase64: base64String,
        newUrl: processedImage.metadata.webpUrl,
        metadata: {
          fileSize: buffer.length,
          dimensions: processedImage.metadata.dimensions,
          mimeType,
        },
      };
    } catch (error) {
      return {
        success: false,
        originalBase64: base64String,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store processed image files to disk
   */
  private async storeProcessedImage(
    processedImage: any,
    establishmentId: string
  ): Promise<{ webpPath: string; jpegPath: string; thumbnailPaths: Record<string, string> }> {
    const options = { establishmentId, preserveOriginal: false, generateFallback: true };
    
    // Store WebP image
    const webpPath = await fileStorageManager.storeWebPImage(
      processedImage.buffers.webp,
      processedImage.metadata.webpUrl,
      options
    );

    // Store JPEG fallback
    const jpegPath = await fileStorageManager.storeJPEGImage(
      processedImage.buffers.jpeg,
      processedImage.metadata.jpegFallbackUrl,
      options
    );

    // Store thumbnails
    const thumbnailPaths = await fileStorageManager.storeThumbnails(
      processedImage.buffers.thumbnails.webp,
      processedImage.metadata.webpUrl,
      options
    );

    return { webpPath, jpegPath, thumbnailPaths };
  }

  /**
   * Migrate images for a single entity (establishment or accommodation)
   */
  async migrateEntityImages(
    entityInfo: Base64ImageInfo,
    options: MigrationOptions = {}
  ): Promise<BatchMigrationResult> {
    const {
      skipErrors = true,
      dryRun = false,
      userId = this.DEFAULT_USER_ID,
      progressCallback,
      errorCallback,
    } = options;

    const result: BatchMigrationResult = {
      success: false,
      totalProcessed: 0,
      successCount: 0,
      failedCount: 0,
      progress: {
        totalEntities: 1,
        processedEntities: 0,
        totalImages: entityInfo.base64Images.length,
        processedImages: 0,
        successfulImages: 0,
        failedImages: 0,
        currentEntity: entityInfo.entityName || entityInfo.id,
        errors: [],
      },
      newUrls: [],
      errors: [],
    };

    try {
      // Get establishment ID for file storage
      const establishmentId = entityInfo.type === 'establishment' 
        ? entityInfo.id 
        : await this.getEstablishmentIdForAccommodation(entityInfo.id);

      if (!establishmentId) {
        throw new Error(`Could not determine establishment ID for ${entityInfo.type} ${entityInfo.id}`);
      }

      // Process each base64 image
      for (let i = 0; i < entityInfo.base64Images.length; i++) {
        const base64Image = entityInfo.base64Images[i];
        result.totalProcessed++;
        result.progress.processedImages++;
        result.progress.currentImage = `Image ${i + 1}/${entityInfo.base64Images.length}`;

        try {
          if (!dryRun) {
            // Migrate the image
            const migrationResult = await this.migrateSingleImage(
              base64Image,
              establishmentId,
              userId,
              `migrated_${entityInfo.type}_${entityInfo.id}_${i + 1}`
            );

            if (migrationResult.success && migrationResult.newUrl) {
              // Replace base64 with URL in database
              await this.replaceBase64InDatabase(
                entityInfo.type,
                entityInfo.id,
                base64Image,
                migrationResult.newUrl
              );

              result.successCount++;
              result.progress.successfulImages++;
              result.newUrls.push(migrationResult.newUrl);
            } else {
              throw new Error(migrationResult.error || 'Migration failed');
            }
          } else {
            // Dry run - just validate the base64 data
            this.extractBase64Data(base64Image);
            result.successCount++;
            result.progress.successfulImages++;
          }
        } catch (error) {
          result.failedCount++;
          result.progress.failedImages++;
          
          const errorInfo = {
            entityId: entityInfo.id,
            entityType: entityInfo.type,
            imageIndex: i,
            base64Data: base64Image.substring(0, 100) + '...', // Truncate for logging
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          };

          result.progress.errors.push(errorInfo);
          result.errors.push({
            entityId: entityInfo.id,
            entityType: entityInfo.type,
            imageIndex: i,
            error: errorInfo.error,
          });

          if (errorCallback) {
            errorCallback(error);
          }

          if (!skipErrors) {
            throw error;
          }
        }

        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(result.progress);
        }
      }

      result.progress.processedEntities = 1;
      result.success = result.failedCount === 0 || skipErrors;

    } catch (error) {
      result.success = false;
      const errorInfo = {
        entityId: entityInfo.id,
        entityType: entityInfo.type,
        imageIndex: -1,
        base64Data: '', // Empty string for entity-level errors
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
      result.progress.errors.push(errorInfo);
      
      if (errorCallback) {
        errorCallback(error);
      }
    }

    return result;
  }

  /**
   * Get establishment ID for an accommodation
   */
  private async getEstablishmentIdForAccommodation(accommodationId: string): Promise<string | null> {
    try {
      const accommodation = await AccommodationModel.findById(accommodationId).select('establishmentId');
      return accommodation?.establishmentId?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Replace base64 string with URL in database
   */
  private async replaceBase64InDatabase(
    entityType: 'establishment' | 'accommodation',
    entityId: string,
    base64Data: string,
    newUrl: string
  ): Promise<void> {
    try {
      if (entityType === 'establishment') {
        await imageMetadataStore.replaceBase64InEstablishment(entityId, base64Data, newUrl);
      } else {
        await imageMetadataStore.replaceBase64InAccommodation(entityId, base64Data, newUrl);
      }
    } catch (error) {
      throw new Error(`Failed to update database for ${entityType} ${entityId}: ${error}`);
    }
  }

  /**
   * Batch migration of all detected base64 images
   */
  async batchMigration(options: MigrationOptions = {}): Promise<BatchMigrationResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      skipErrors = true,
      dryRun = false,
      progressCallback,
      errorCallback,
    } = options;

    // Detect all base64 images
    const base64Images = await this.detectBase64Images();
    
    if (base64Images.length === 0) {
      return {
        success: true,
        totalProcessed: 0,
        successCount: 0,
        failedCount: 0,
        progress: {
          totalEntities: 0,
          processedEntities: 0,
          totalImages: 0,
          processedImages: 0,
          successfulImages: 0,
          failedImages: 0,
          errors: [],
        },
        newUrls: [],
        errors: [],
      };
    }

    const totalImages = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
    
    const overallResult: BatchMigrationResult = {
      success: false,
      totalProcessed: 0,
      successCount: 0,
      failedCount: 0,
      progress: {
        totalEntities: base64Images.length,
        processedEntities: 0,
        totalImages,
        processedImages: 0,
        successfulImages: 0,
        failedImages: 0,
        errors: [],
      },
      newUrls: [],
      errors: [],
    };

    try {
      // Process entities in batches
      for (let i = 0; i < base64Images.length; i += batchSize) {
        const batch = base64Images.slice(i, i + batchSize);
        
        // Process each entity in the batch
        for (const entityInfo of batch) {
          overallResult.progress.currentEntity = entityInfo.entityName || entityInfo.id;
          
          try {
            const entityResult = await this.migrateEntityImages(entityInfo, {
              ...options,
              progressCallback: (progress) => {
                // Merge entity progress into overall progress
                overallResult.progress.processedImages += progress.processedImages;
                overallResult.progress.successfulImages += progress.successfulImages;
                overallResult.progress.failedImages += progress.failedImages;
                overallResult.progress.errors.push(...progress.errors);
                
                if (progressCallback) {
                  progressCallback(overallResult.progress);
                }
              },
            });

            // Merge results
            overallResult.totalProcessed += entityResult.totalProcessed;
            overallResult.successCount += entityResult.successCount;
            overallResult.failedCount += entityResult.failedCount;
            overallResult.newUrls.push(...entityResult.newUrls);
            overallResult.errors.push(...entityResult.errors);
            
            overallResult.progress.processedEntities++;

          } catch (error) {
            overallResult.failedCount++;
            overallResult.progress.failedImages++;
            
            const errorInfo = {
              entityId: entityInfo.id,
              entityType: entityInfo.type,
              imageIndex: -1,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            overallResult.errors.push(errorInfo);
            
            if (errorCallback) {
              errorCallback(error);
            }

            if (!skipErrors) {
              throw error;
            }
          }
        }
      }

      overallResult.success = overallResult.failedCount === 0 || skipErrors;

    } catch (error) {
      overallResult.success = false;
      if (errorCallback) {
        errorCallback(error);
      }
    }

    return overallResult;
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(): Promise<{
    totalBase64Images: number;
    entitiesWithBase64: number;
    establishmentsWithBase64: number;
    accommodationsWithBase64: number;
    estimatedMigrationTime: number; // in minutes
    estimatedStorageSize: number; // in bytes
  }> {
    try {
      const base64Images = await this.detectBase64Images();
      
      const totalBase64Images = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
      const establishmentsWithBase64 = base64Images.filter(entity => entity.type === 'establishment').length;
      const accommodationsWithBase64 = base64Images.filter(entity => entity.type === 'accommodation').length;
      
      // Estimate migration time (assuming 2 seconds per image)
      const estimatedMigrationTime = Math.ceil(totalBase64Images * 2 / 60);
      
      // Estimate storage size (assuming average 500KB per processed image with thumbnails)
      const estimatedStorageSize = totalBase64Images * 500 * 1024;

      return {
        totalBase64Images,
        entitiesWithBase64: base64Images.length,
        establishmentsWithBase64,
        accommodationsWithBase64,
        estimatedMigrationTime,
        estimatedStorageSize,
      };
    } catch (error) {
      throw new Error(`Failed to get migration stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate migration completeness
   */
  async validateMigration(): Promise<{
    isComplete: boolean;
    remainingBase64Images: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const base64Images = await this.detectBase64Images();
      const remainingBase64Images = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
      
      const result = {
        isComplete: remainingBase64Images === 0,
        remainingBase64Images,
        issues: [] as string[],
        recommendations: [] as string[],
      };

      if (remainingBase64Images > 0) {
        result.issues.push(`${remainingBase64Images} base64 images still remain in the database`);
        result.recommendations.push('Run the migration process to convert remaining base64 images');
        
        // Group by entity type
        const establishmentCount = base64Images.filter(e => e.type === 'establishment').length;
        const accommodationCount = base64Images.filter(e => e.type === 'accommodation').length;
        
        if (establishmentCount > 0) {
          result.issues.push(`${establishmentCount} establishments still have base64 images`);
        }
        if (accommodationCount > 0) {
          result.issues.push(`${accommodationCount} accommodations still have base64 images`);
        }
      } else {
        result.recommendations.push('Migration is complete - all base64 images have been converted');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to validate migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate migration completeness using enhanced verification
   */
  async validateMigrationCompleteness(): Promise<{
    isComplete: boolean;
    totalEntities: number;
    completeEntities: number;
    incompleteEntities: number;
    totalBase64Images: number;
    totalMigratedImages: number;
    detailedReport: Array<{
      type: 'establishment' | 'accommodation';
      id: string;
      name?: string;
      base64Count: number;
      totalImages: number;
    }>;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      // Use the enhanced verification from imageMetadataStore
      const overallVerification = await imageMetadataStore.verifyOverallMigrationCompleteness();
      
      const result = {
        isComplete: overallVerification.isComplete,
        totalEntities: overallVerification.totalEntities,
        completeEntities: overallVerification.completeEntities,
        incompleteEntities: overallVerification.incompleteEntities,
        totalBase64Images: overallVerification.totalBase64Images,
        totalMigratedImages: overallVerification.totalMigratedImages,
        detailedReport: overallVerification.entitiesWithBase64,
        issues: [] as string[],
        recommendations: [] as string[],
      };

      // Generate issues and recommendations
      if (!result.isComplete) {
        result.issues.push(`Migration incomplete: ${result.totalBase64Images} base64 images remain across ${result.incompleteEntities} entities`);
        
        if (result.incompleteEntities > 0) {
          const establishmentCount = result.detailedReport.filter(e => e.type === 'establishment').length;
          const accommodationCount = result.detailedReport.filter(e => e.type === 'accommodation').length;
          
          if (establishmentCount > 0) {
            result.issues.push(`${establishmentCount} establishments still contain base64 images`);
          }
          if (accommodationCount > 0) {
            result.issues.push(`${accommodationCount} accommodations still contain base64 images`);
          }
        }
        
        result.recommendations.push('Run batch migration to convert remaining base64 images');
        result.recommendations.push('Use migration CLI tool for detailed progress tracking');
        
        if (result.incompleteEntities < 10) {
          result.recommendations.push('Consider migrating entities individually for better error handling');
        }
      } else {
        result.recommendations.push('Migration is complete - all base64 images have been successfully converted');
        result.recommendations.push('Consider running cleanup operations to remove orphaned files');
      }

      // Add performance recommendations
      if (result.totalMigratedImages > 1000) {
        result.recommendations.push('Consider implementing image CDN for better performance with large image collections');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to validate migration completeness: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify specific entity migration
   */
  async verifyEntityMigration(
    entityType: 'establishment' | 'accommodation',
    entityId: string
  ): Promise<{
    isComplete: boolean;
    entityId: string;
    entityType: 'establishment' | 'accommodation';
    remainingBase64Count: number;
    totalImages: number;
    migratedImages: number;
    base64Images: string[];
    urlImages: string[];
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const verification = await imageMetadataStore.verifyEntityMigration(entityType, entityId);
      
      const result = {
        isComplete: verification.isComplete,
        entityId,
        entityType,
        remainingBase64Count: verification.remainingBase64Count,
        totalImages: verification.totalImages,
        migratedImages: verification.migratedImages,
        base64Images: verification.base64Images,
        urlImages: verification.urlImages,
        issues: [] as string[],
        recommendations: [] as string[],
      };

      // Generate specific issues and recommendations
      if (!result.isComplete) {
        result.issues.push(`${result.remainingBase64Count} base64 images still need migration`);
        
        if (result.remainingBase64Count > 0) {
          result.recommendations.push(`Migrate ${entityType} ${entityId} using migrateEntityImages method`);
        }
        
        if (result.base64Images.length > 10) {
          result.recommendations.push('Consider batch processing for this entity due to large number of images');
        }
      } else {
        result.recommendations.push(`${entityType} migration is complete`);
        
        if (result.migratedImages > 0) {
          result.recommendations.push('Verify that all migrated images are accessible via their URLs');
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to verify entity migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rollback migration for a specific entity
   */
  async rollbackEntityMigration(
    entityType: 'establishment' | 'accommodation',
    entityId: string,
    backupUrls: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    const result = {
      success: true,
      errors: [] as string[],
    };

    try {
      // This would require having backup of original base64 data
      // For now, we'll just remove the URLs and clean up files
      
      const entity = entityType === 'establishment' 
        ? await EstablishmentModel.findById(entityId)
        : await AccommodationModel.findById(entityId);

      if (!entity) {
        throw new Error(`${entityType} not found: ${entityId}`);
      }

      // Remove URLs from images array
      const updatedImages = entity.images.filter(image => !backupUrls.includes(image));
      
      if (entityType === 'establishment') {
        await EstablishmentModel.findByIdAndUpdate(entityId, { images: updatedImages });
      } else {
        await AccommodationModel.findByIdAndUpdate(entityId, { images: updatedImages });
      }

      // Clean up files and metadata
      for (const url of backupUrls) {
        try {
          // Remove metadata
          await imageMetadataStore.deleteByUrl(url);
          
          // Clean up files would require file path resolution
          // This is a simplified version
        } catch (error) {
          result.errors.push(`Failed to cleanup ${url}: ${error}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }
}

// Export singleton instance
export const base64MigrationService = new Base64MigrationService();