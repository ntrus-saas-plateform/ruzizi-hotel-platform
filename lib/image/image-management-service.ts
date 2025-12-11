/**
 * Image Management Service
 * Handles image deletion, reordering, replacement, and bulk operations
 */

import { Types } from 'mongoose';
import { EstablishmentModel } from '@/models/Establishment.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { BookingModel } from '@/models/Booking.model';
import { fileStorageManager } from './file-storage-manager';
import { imageMetadataStore } from './image-metadata-store';

export interface ImageUsageInfo {
  isInUse: boolean;
  usedBy: Array<{
    type: 'establishment' | 'accommodation' | 'booking';
    id: string;
    name?: string;
  }>;
}

export interface ImageDeletionResult {
  success: boolean;
  deletedImageUrl: string;
  filesDeleted: string[];
  errors: string[];
  usageInfo?: ImageUsageInfo;
}

export interface ImageReorderResult {
  success: boolean;
  entityType: 'establishment' | 'accommodation';
  entityId: string;
  newOrder: string[];
  errors: string[];
}

export interface ImageReplacementResult {
  success: boolean;
  oldImageUrl: string;
  newImageUrl: string;
  filesDeleted: string[];
  filesCreated: string[];
  errors: string[];
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: Array<{
    operation: string;
    imageUrl?: string;
    success: boolean;
    error?: string;
  }>;
  errors: string[];
}

/**
 * Service for managing image operations (delete, reorder, replace, bulk operations)
 */
export class ImageManagementService {
  /**
   * Check if an image is currently in use by any entity
   */
  async checkImageUsage(imageUrl: string): Promise<ImageUsageInfo> {
    const usageInfo: ImageUsageInfo = {
      isInUse: false,
      usedBy: []
    };

    try {
      // Check establishments
      const establishments = await EstablishmentModel.find({ 
        images: imageUrl 
      }).select('_id name images');

      for (const establishment of establishments) {
        usageInfo.usedBy.push({
          type: 'establishment',
          id: establishment._id.toString(),
          name: establishment.name
        });
      }

      // Check accommodations
      const accommodations = await AccommodationModel.find({ 
        images: imageUrl 
      }).select('_id name images');

      for (const accommodation of accommodations) {
        usageInfo.usedBy.push({
          type: 'accommodation',
          id: accommodation._id.toString(),
          name: accommodation.name
        });
      }

      // Check bookings (if they reference images)
      const bookings = await BookingModel.find({
        $or: [
          { 'accommodation.images': imageUrl },
          { 'establishment.images': imageUrl }
        ]
      }).select('_id bookingCode');

      for (const booking of bookings) {
        usageInfo.usedBy.push({
          type: 'booking',
          id: (booking._id as Types.ObjectId).toString(),
          name: booking.bookingCode
        });
      }

      usageInfo.isInUse = usageInfo.usedBy.length > 0;
      return usageInfo;
    } catch (error) {
      throw new Error(`Failed to check image usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image with usage protection
   */
  async deleteImage(
    imageUrl: string, 
    options: { 
      force?: boolean; 
      establishmentId?: string;
      accommodationId?: string;
    } = {}
  ): Promise<ImageDeletionResult> {
    const result: ImageDeletionResult = {
      success: false,
      deletedImageUrl: imageUrl,
      filesDeleted: [],
      errors: []
    };

    try {
      // Check usage first (unless force delete)
      if (!options.force) {
        const usageInfo = await this.checkImageUsage(imageUrl);
        result.usageInfo = usageInfo;

        if (usageInfo.isInUse) {
          result.errors.push(`Image is currently in use by ${usageInfo.usedBy.length} entities`);
          return result;
        }
      }

      // Find image metadata
      const metadata = await imageMetadataStore.findByUrl(imageUrl);
      if (!metadata) {
        result.errors.push('Image metadata not found');
        return result;
      }

      // Remove from establishment if specified
      if (options.establishmentId) {
        await imageMetadataStore.removeImageFromEstablishment(options.establishmentId, imageUrl);
      }

      // Remove from accommodation if specified
      if (options.accommodationId) {
        await imageMetadataStore.removeImageFromAccommodation(options.accommodationId, imageUrl);
      }

      // If no specific entity provided, remove from all entities
      if (!options.establishmentId && !options.accommodationId) {
        // Remove from all establishments
        const establishments = await EstablishmentModel.find({ images: imageUrl });
        for (const establishment of establishments) {
          await imageMetadataStore.removeImageFromEstablishment(establishment._id.toString(), imageUrl);
        }

        // Remove from all accommodations
        const accommodations = await AccommodationModel.find({ images: imageUrl });
        for (const accommodation of accommodations) {
          await imageMetadataStore.removeImageFromAccommodation(accommodation._id.toString(), imageUrl);
        }
      }

      // Delete files from file system
      const imageId = this.extractImageIdFromUrl(imageUrl);
      if (imageId) {
        const cleanupResult = await fileStorageManager.completeCleanup(
          imageId,
          metadata.establishmentId.toString(),
          metadata.uploadedAt
        );

        result.filesDeleted = cleanupResult.deletedFiles;
        if (!cleanupResult.success) {
          result.errors.push(...cleanupResult.errors);
        }
      }

      // Delete metadata
      const metadataDeleted = await imageMetadataStore.deleteByUrl(imageUrl);
      if (!metadataDeleted) {
        result.errors.push('Failed to delete image metadata');
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Reorder images in an entity's images array
   */
  async reorderImages(
    entityType: 'establishment' | 'accommodation',
    entityId: string,
    newImageOrder: string[]
  ): Promise<ImageReorderResult> {
    const result: ImageReorderResult = {
      success: false,
      entityType,
      entityId,
      newOrder: newImageOrder,
      errors: []
    };

    try {
      // Validate that all images exist in the entity
      let currentImages: string[] = [];
      
      if (entityType === 'establishment') {
        const establishment = await EstablishmentModel.findById(entityId).select('images');
        if (!establishment) {
          result.errors.push('Establishment not found');
          return result;
        }
        currentImages = establishment.images;
      } else {
        const accommodation = await AccommodationModel.findById(entityId).select('images');
        if (!accommodation) {
          result.errors.push('Accommodation not found');
          return result;
        }
        currentImages = accommodation.images;
      }

      // Validate that new order contains exactly the same images
      const currentSet = new Set(currentImages);
      const newSet = new Set(newImageOrder);

      if (currentSet.size !== newSet.size) {
        result.errors.push('New order must contain the same number of images');
        return result;
      }

      for (const image of newImageOrder) {
        if (!currentSet.has(image)) {
          result.errors.push(`Image ${image} is not in the current images array`);
        }
      }

      for (const image of currentImages) {
        if (!newSet.has(image)) {
          result.errors.push(`Current image ${image} is missing from new order`);
        }
      }

      if (result.errors.length > 0) {
        return result;
      }

      // Update the order
      if (entityType === 'establishment') {
        await imageMetadataStore.updateEstablishmentImageOrder(entityId, newImageOrder);
      } else {
        await imageMetadataStore.updateAccommodationImageOrder(entityId, newImageOrder);
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(`Failed to reorder images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Replace an image with a new one, cleaning up old files
   */
  async replaceImage(
    oldImageUrl: string,
    newImageUrl: string,
    options: {
      establishmentId?: string;
      accommodationId?: string;
      preserveOrder?: boolean;
    } = {}
  ): Promise<ImageReplacementResult> {
    const result: ImageReplacementResult = {
      success: false,
      oldImageUrl,
      newImageUrl,
      filesDeleted: [],
      filesCreated: [],
      errors: []
    };

    try {
      // Find entities that use the old image
      const entities: Array<{ type: 'establishment' | 'accommodation'; id: string }> = [];

      if (options.establishmentId) {
        entities.push({ type: 'establishment', id: options.establishmentId });
      } else if (options.accommodationId) {
        entities.push({ type: 'accommodation', id: options.accommodationId });
      } else {
        // Find all entities using this image
        const establishments = await EstablishmentModel.find({ images: oldImageUrl }).select('_id');
        const accommodations = await AccommodationModel.find({ images: oldImageUrl }).select('_id');

        entities.push(
          ...establishments.map(e => ({ type: 'establishment' as const, id: e._id.toString() })),
          ...accommodations.map(a => ({ type: 'accommodation' as const, id: a._id.toString() }))
        );
      }

      if (entities.length === 0) {
        result.errors.push('Old image not found in any entity');
        return result;
      }

      // Replace in each entity
      for (const entity of entities) {
        try {
          let currentImages: string[] = [];
          
          if (entity.type === 'establishment') {
            const establishment = await EstablishmentModel.findById(entity.id).select('images');
            if (establishment) {
              currentImages = establishment.images;
            }
          } else {
            const accommodation = await AccommodationModel.findById(entity.id).select('images');
            if (accommodation) {
              currentImages = accommodation.images;
            }
          }

          // Replace old URL with new URL, preserving order
          const updatedImages = currentImages.map(img => 
            img === oldImageUrl ? newImageUrl : img
          );

          // Update the entity
          if (entity.type === 'establishment') {
            await imageMetadataStore.updateEstablishmentImageOrder(entity.id, updatedImages);
          } else {
            await imageMetadataStore.updateAccommodationImageOrder(entity.id, updatedImages);
          }
        } catch (error) {
          result.errors.push(`Failed to update ${entity.type} ${entity.id}: ${error}`);
        }
      }

      // Delete old image files (but don't fail if this fails)
      try {
        const oldMetadata = await imageMetadataStore.findByUrl(oldImageUrl);
        if (oldMetadata) {
          const oldImageId = this.extractImageIdFromUrl(oldImageUrl);
          if (oldImageId) {
            const cleanupResult = await fileStorageManager.completeCleanup(
              oldImageId,
              oldMetadata.establishmentId.toString(),
              oldMetadata.uploadedAt
            );
            result.filesDeleted = cleanupResult.deletedFiles;
            
            if (!cleanupResult.success) {
              result.errors.push(...cleanupResult.errors.map(e => `Cleanup warning: ${e}`));
            }
          }

          // Delete old metadata
          await imageMetadataStore.deleteByUrl(oldImageUrl);
        }
      } catch (error) {
        result.errors.push(`Warning: Failed to cleanup old image: ${error}`);
      }

      result.success = result.errors.filter(e => !e.startsWith('Warning:')).length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Failed to replace image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Bulk delete multiple images
   */
  async bulkDeleteImages(
    imageUrls: string[],
    options: { 
      force?: boolean; 
      establishmentId?: string;
      accommodationId?: string;
    } = {}
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      totalProcessed: imageUrls.length,
      successful: 0,
      failed: 0,
      results: [],
      errors: []
    };

    for (const imageUrl of imageUrls) {
      try {
        const deleteResult = await this.deleteImage(imageUrl, options);
        
        result.results.push({
          operation: 'delete',
          imageUrl,
          success: deleteResult.success,
          error: deleteResult.errors.join('; ') || undefined
        });

        if (deleteResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`Failed to delete ${imageUrl}: ${deleteResult.errors.join('; ')}`);
        }
      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to delete ${imageUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        result.results.push({
          operation: 'delete',
          imageUrl,
          success: false,
          error: errorMsg
        });
      }
    }

    return result;
  }

  /**
   * Bulk reorder images for multiple entities
   */
  async bulkReorderImages(
    operations: Array<{
      entityType: 'establishment' | 'accommodation';
      entityId: string;
      newOrder: string[];
    }>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      totalProcessed: operations.length,
      successful: 0,
      failed: 0,
      results: [],
      errors: []
    };

    for (const operation of operations) {
      try {
        const reorderResult = await this.reorderImages(
          operation.entityType,
          operation.entityId,
          operation.newOrder
        );

        result.results.push({
          operation: 'reorder',
          success: reorderResult.success,
          error: reorderResult.errors.join('; ') || undefined
        });

        if (reorderResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`Failed to reorder ${operation.entityType} ${operation.entityId}: ${reorderResult.errors.join('; ')}`);
        }
      } catch (error) {
        result.failed++;
        const errorMsg = `Failed to reorder ${operation.entityType} ${operation.entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        result.results.push({
          operation: 'reorder',
          success: false,
          error: errorMsg
        });
      }
    }

    return result;
  }

  /**
   * Get image management statistics for an establishment
   */
  async getImageManagementStats(establishmentId: string): Promise<{
    totalImages: number;
    imagesInEstablishments: number;
    imagesInAccommodations: number;
    orphanedImages: number;
    totalFileSize: number;
    imagesByStatus: Record<string, number>;
  }> {
    try {
      const stats = {
        totalImages: 0,
        imagesInEstablishments: 0,
        imagesInAccommodations: 0,
        orphanedImages: 0,
        totalFileSize: 0,
        imagesByStatus: {} as Record<string, number>
      };

      // Get all images for this establishment from metadata
      const allImages = await imageMetadataStore.findByEstablishment(establishmentId);
      stats.totalImages = allImages.length;
      stats.totalFileSize = allImages.reduce((sum, img) => sum + img.fileSize, 0);

      // Count images in establishments
      const establishment = await EstablishmentModel.findById(establishmentId).select('images');
      if (establishment) {
        stats.imagesInEstablishments = establishment.images.length;
      }

      // Count images in accommodations for this establishment
      const accommodations = await AccommodationModel.find({ 
        establishmentId: new Types.ObjectId(establishmentId) 
      }).select('images');
      
      stats.imagesInAccommodations = accommodations.reduce(
        (sum, acc) => sum + acc.images.length, 0
      );

      // Find orphaned images (in metadata but not referenced)
      const allReferencedUrls = new Set([
        ...(establishment?.images || []),
        ...accommodations.flatMap(acc => acc.images)
      ]);

      stats.orphanedImages = allImages.filter(
        img => !allReferencedUrls.has(img.webpUrl)
      ).length;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get image management stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up orphaned images for an establishment
   */
  async cleanupOrphanedImages(establishmentId: string): Promise<{
    cleaned: number;
    errors: string[];
    cleanedImages: string[];
  }> {
    const result = {
      cleaned: 0,
      errors: [] as string[],
      cleanedImages: [] as string[]
    };

    try {
      // Get all images for this establishment
      const allImages = await imageMetadataStore.findByEstablishment(establishmentId);
      
      // Get all referenced images
      const establishment = await EstablishmentModel.findById(establishmentId).select('images');
      const accommodations = await AccommodationModel.find({ 
        establishmentId: new Types.ObjectId(establishmentId) 
      }).select('images');

      const referencedUrls = new Set([
        ...(establishment?.images || []),
        ...accommodations.flatMap(acc => acc.images)
      ]);

      // Find orphaned images
      const orphanedImages = allImages.filter(
        img => !referencedUrls.has(img.webpUrl)
      );

      // Delete orphaned images
      for (const orphanedImage of orphanedImages) {
        try {
          const deleteResult = await this.deleteImage(orphanedImage.webpUrl, { force: true });
          if (deleteResult.success) {
            result.cleaned++;
            result.cleanedImages.push(orphanedImage.webpUrl);
          } else {
            result.errors.push(`Failed to delete ${orphanedImage.webpUrl}: ${deleteResult.errors.join('; ')}`);
          }
        } catch (error) {
          result.errors.push(`Error deleting ${orphanedImage.webpUrl}: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Failed to cleanup orphaned images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Extract image ID from URL
   */
  private extractImageIdFromUrl(imageUrl: string): string | null {
    // Extract UUID from URL like "/api/images/uuid.webp"
    const match = imageUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    return match ? match[1] : null;
  }

  /**
   * Validate image order array
   */
  private validateImageOrder(currentImages: string[], newOrder: string[]): string[] {
    const errors: string[] = [];

    if (currentImages.length !== newOrder.length) {
      errors.push('New order must contain the same number of images');
    }

    const currentSet = new Set(currentImages);
    const newSet = new Set(newOrder);

    if (currentSet.size !== newSet.size) {
      errors.push('New order contains duplicate images');
    }

    for (const image of newOrder) {
      if (!currentSet.has(image)) {
        errors.push(`Image ${image} is not in the current images array`);
      }
    }

    for (const image of currentImages) {
      if (!newSet.has(image)) {
        errors.push(`Current image ${image} is missing from new order`);
      }
    }

    return errors;
  }

  /**
   * Batch validate image operations
   */
  async batchValidateOperations(
    operations: Array<{
      type: 'delete' | 'reorder' | 'replace';
      imageUrl?: string;
      entityType?: 'establishment' | 'accommodation';
      entityId?: string;
      newOrder?: string[];
      newImageUrl?: string;
    }>
  ): Promise<Array<{
    operation: any;
    isValid: boolean;
    errors: string[];
  }>> {
    const results = [];

    for (const operation of operations) {
      const result = {
        operation,
        isValid: true,
        errors: [] as string[]
      };

      try {
        switch (operation.type) {
          case 'delete':
            if (!operation.imageUrl) {
              result.errors.push('Image URL is required for delete operation');
            } else {
              const usageInfo = await this.checkImageUsage(operation.imageUrl);
              if (usageInfo.isInUse) {
                result.errors.push(`Image is in use by ${usageInfo.usedBy.length} entities`);
              }
            }
            break;

          case 'reorder':
            if (!operation.entityType || !operation.entityId || !operation.newOrder) {
              result.errors.push('Entity type, ID, and new order are required for reorder operation');
            } else {
              // Validate entity exists and get current images
              let currentImages: string[] = [];
              
              if (operation.entityType === 'establishment') {
                const establishment = await EstablishmentModel.findById(operation.entityId).select('images');
                if (!establishment) {
                  result.errors.push('Establishment not found');
                } else {
                  currentImages = establishment.images;
                }
              } else {
                const accommodation = await AccommodationModel.findById(operation.entityId).select('images');
                if (!accommodation) {
                  result.errors.push('Accommodation not found');
                } else {
                  currentImages = accommodation.images;
                }
              }

              if (currentImages.length > 0) {
                const validationErrors = this.validateImageOrder(currentImages, operation.newOrder);
                result.errors.push(...validationErrors);
              }
            }
            break;

          case 'replace':
            if (!operation.imageUrl || !operation.newImageUrl) {
              result.errors.push('Both old and new image URLs are required for replace operation');
            } else {
              const usageInfo = await this.checkImageUsage(operation.imageUrl);
              if (!usageInfo.isInUse) {
                result.errors.push('Old image is not in use by any entity');
              }
            }
            break;

          default:
            result.errors.push(`Unknown operation type: ${operation.type}`);
        }
      } catch (error) {
        result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      result.isValid = result.errors.length === 0;
      results.push(result);
    }

    return results;
  }
}

// Export singleton instance
export const imageManagementService = new ImageManagementService();