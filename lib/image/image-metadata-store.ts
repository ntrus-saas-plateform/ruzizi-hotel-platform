import { Types } from 'mongoose';
import { ImageMetadataModel, type IImageMetadata, type IImageMetadataDocument } from '@/models/ImageMetadata.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { AccommodationModel } from '@/models/Accommodation.model';

/**
 * Image metadata creation data
 */
export interface CreateImageMetadataData {
  establishmentId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  webpUrl: string;
  jpegFallbackUrl: string;
  thumbnails: {
    small: { path: string; width: number; height: number; fileSize: number };
    medium: { path: string; width: number; height: number; fileSize: number };
    large: { path: string; width: number; height: number; fileSize: number };
    xlarge: { path: string; width: number; height: number; fileSize: number };
  };
  uploadedBy: string;
}

/**
 * Image metadata update data
 */
export interface UpdateImageMetadataData {
  originalFilename?: string;
  webpUrl?: string;
  jpegFallbackUrl?: string;
  thumbnails?: Partial<CreateImageMetadataData['thumbnails']>;
}

/**
 * Batch migration data
 */
export interface BatchMigrationData {
  establishmentId: string;
  images: Array<{
    base64Data: string;
    originalFilename?: string;
    uploadedBy: string;
  }>;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
  newUrls: string[];
}

/**
 * Service for managing image metadata in the database
 */
export class ImageMetadataStore {
  /**
   * Create new image metadata record
   */
  async create(data: CreateImageMetadataData): Promise<IImageMetadataDocument> {
    try {
      const metadata = new ImageMetadataModel({
        establishmentId: new Types.ObjectId(data.establishmentId),
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        dimensions: data.dimensions,
        webpUrl: data.webpUrl,
        jpegFallbackUrl: data.jpegFallbackUrl,
        thumbnails: data.thumbnails,
        uploadedBy: new Types.ObjectId(data.uploadedBy),
        uploadedAt: new Date(),
      });

      return await metadata.save();
    } catch (error) {
      throw new Error(`Failed to create image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find image metadata by ID
   */
  async findById(id: string): Promise<IImageMetadataDocument | null> {
    try {
      // Use findOne with the id field instead of findById for UUID compatibility
      return await ImageMetadataModel.findOne({ id: id });
    } catch (error) {
      throw new Error(`Failed to find image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find image metadata by URL
   */
  async findByUrl(url: string): Promise<IImageMetadataDocument | null> {
    try {
      return await ImageMetadataModel.findByUrl(url);
    } catch (error) {
      throw new Error(`Failed to find image metadata by URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all image metadata for an establishment
   */
  async findByEstablishment(establishmentId: string): Promise<IImageMetadataDocument[]> {
    try {
      return await ImageMetadataModel.findByEstablishment(establishmentId);
    } catch (error) {
      throw new Error(`Failed to find establishment images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find image metadata by uploader
   */
  async findByUploader(uploadedBy: string): Promise<IImageMetadataDocument[]> {
    try {
      return await ImageMetadataModel.findByUploader(uploadedBy);
    } catch (error) {
      throw new Error(`Failed to find images by uploader: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find image metadata by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<IImageMetadataDocument[]> {
    try {
      return await ImageMetadataModel.findByDateRange(startDate, endDate);
    } catch (error) {
      throw new Error(`Failed to find images by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update image metadata
   */
  async update(id: string, data: UpdateImageMetadataData): Promise<IImageMetadataDocument | null> {
    try {
      return await ImageMetadataModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image metadata
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await ImageMetadataModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new Error(`Failed to delete image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image metadata by URL
   */
  async deleteByUrl(url: string): Promise<boolean> {
    try {
      const result = await ImageMetadataModel.findOneAndDelete({
        $or: [
          { webpUrl: url },
          { jpegFallbackUrl: url },
        ],
      });
      return result !== null;
    } catch (error) {
      throw new Error(`Failed to delete image metadata by URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add image URL to establishment's images array
   */
  async addImageToEstablishment(establishmentId: string, imageUrl: string): Promise<void> {
    try {
      await EstablishmentModel.findByIdAndUpdate(
        establishmentId,
        { $addToSet: { images: imageUrl } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to add image to establishment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove image URL from establishment's images array
   */
  async removeImageFromEstablishment(establishmentId: string, imageUrl: string): Promise<void> {
    try {
      await EstablishmentModel.findByIdAndUpdate(
        establishmentId,
        { $pull: { images: imageUrl } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to remove image from establishment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add image URL to accommodation's images array
   */
  async addImageToAccommodation(accommodationId: string, imageUrl: string): Promise<void> {
    try {
      await AccommodationModel.findByIdAndUpdate(
        accommodationId,
        { $addToSet: { images: imageUrl } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to add image to accommodation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove image URL from accommodation's images array
   */
  async removeImageFromAccommodation(accommodationId: string, imageUrl: string): Promise<void> {
    try {
      await AccommodationModel.findByIdAndUpdate(
        accommodationId,
        { $pull: { images: imageUrl } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to remove image from accommodation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update image order in establishment's images array
   */
  async updateEstablishmentImageOrder(establishmentId: string, imageUrls: string[]): Promise<void> {
    try {
      await EstablishmentModel.findByIdAndUpdate(
        establishmentId,
        { $set: { images: imageUrls } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update establishment image order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update image order in accommodation's images array
   */
  async updateAccommodationImageOrder(accommodationId: string, imageUrls: string[]): Promise<void> {
    try {
      await AccommodationModel.findByIdAndUpdate(
        accommodationId,
        { $set: { images: imageUrls } },
        { runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update accommodation image order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace base64 image with URL in establishment's images array
   */
  async replaceBase64InEstablishment(establishmentId: string, base64Data: string, newUrl: string): Promise<void> {
    try {
      // Find and replace the base64 string with the new URL
      const establishment = await EstablishmentModel.findById(establishmentId);
      if (!establishment) {
        throw new Error('Establishment not found');
      }

      // Check if the base64 data exists in the images array
      const base64Index = establishment.images.findIndex(image => image === base64Data);
      if (base64Index === -1) {
        throw new Error('Base64 image not found in establishment images array');
      }

      // Replace the base64 string with the new URL
      const updatedImages = establishment.images.map(image => 
        image === base64Data ? newUrl : image
      );

      // Verify that the replacement occurred
      const replacementCount = establishment.images.filter(img => img === base64Data).length;
      const newUrlCount = updatedImages.filter(img => img === newUrl).length;
      
      if (replacementCount !== newUrlCount) {
        throw new Error('Base64 replacement verification failed: count mismatch');
      }

      // Update the database
      const updateResult = await EstablishmentModel.findByIdAndUpdate(
        establishmentId,
        { $set: { images: updatedImages } },
        { new: true, runValidators: true }
      );

      if (!updateResult) {
        throw new Error('Failed to update establishment in database');
      }

      // Verify the update was successful
      const verificationResult = await this.verifyBase64Replacement(
        'establishment',
        establishmentId,
        base64Data,
        newUrl
      );

      if (!verificationResult.success) {
        throw new Error(`Migration verification failed: ${verificationResult.error}`);
      }
    } catch (error) {
      throw new Error(`Failed to replace base64 in establishment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace base64 image with URL in accommodation's images array
   */
  async replaceBase64InAccommodation(accommodationId: string, base64Data: string, newUrl: string): Promise<void> {
    try {
      // Find and replace the base64 string with the new URL
      const accommodation = await AccommodationModel.findById(accommodationId);
      if (!accommodation) {
        throw new Error('Accommodation not found');
      }

      // Check if the base64 data exists in the images array
      const base64Index = accommodation.images.findIndex(image => image === base64Data);
      if (base64Index === -1) {
        throw new Error('Base64 image not found in accommodation images array');
      }

      // Replace the base64 string with the new URL
      const updatedImages = accommodation.images.map(image => 
        image === base64Data ? newUrl : image
      );

      // Verify that the replacement occurred
      const replacementCount = accommodation.images.filter(img => img === base64Data).length;
      const newUrlCount = updatedImages.filter(img => img === newUrl).length;
      
      if (replacementCount !== newUrlCount) {
        throw new Error('Base64 replacement verification failed: count mismatch');
      }

      // Update the database
      const updateResult = await AccommodationModel.findByIdAndUpdate(
        accommodationId,
        { $set: { images: updatedImages } },
        { new: true, runValidators: true }
      );

      if (!updateResult) {
        throw new Error('Failed to update accommodation in database');
      }

      // Verify the update was successful
      const verificationResult = await this.verifyBase64Replacement(
        'accommodation',
        accommodationId,
        base64Data,
        newUrl
      );

      if (!verificationResult.success) {
        throw new Error(`Migration verification failed: ${verificationResult.error}`);
      }
    } catch (error) {
      throw new Error(`Failed to replace base64 in accommodation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch migration of base64 images to file system
   */
  async batchMigration(data: BatchMigrationData): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      errors: [],
      newUrls: [],
    };

    try {
      for (let i = 0; i < data.images.length; i++) {
        result.processedCount++;
        
        try {
          const imageData = data.images[i];
          
          // This would typically involve:
          // 1. Decoding base64 data
          // 2. Processing the image (conversion, thumbnails)
          // 3. Storing files on disk
          // 4. Creating metadata record
          // 5. Updating the images array
          
          // For now, we'll create a placeholder URL
          const newUrl = `/api/images/${new Types.ObjectId().toString()}.webp`;
          
          // Replace base64 with URL in establishment
          await this.replaceBase64InEstablishment(
            data.establishmentId,
            imageData.base64Data,
            newUrl
          );

          result.newUrls.push(newUrl);
          result.successCount++;
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.success = result.failedCount === 0;
      return result;
    } catch (error) {
      throw new Error(`Batch migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all base64 images in the database
   */
  async findBase64Images(): Promise<Array<{
    type: 'establishment' | 'accommodation';
    id: string;
    base64Images: string[];
  }>> {
    try {
      const results: Array<{
        type: 'establishment' | 'accommodation';
        id: string;
        base64Images: string[];
      }> = [];

      // Find establishments with base64 images
      const establishments = await EstablishmentModel.find({
        images: { $regex: /^data:image\// }
      });

      for (const establishment of establishments) {
        const base64Images = establishment.images.filter(image => 
          image.startsWith('data:image/')
        );
        
        if (base64Images.length > 0) {
          results.push({
            type: 'establishment',
            id: establishment._id.toString(),
            base64Images,
          });
        }
      }

      // Find accommodations with base64 images
      const accommodations = await AccommodationModel.find({
        images: { $regex: /^data:image\// }
      });

      for (const accommodation of accommodations) {
        const base64Images = accommodation.images.filter(image => 
          image.startsWith('data:image/')
        );
        
        if (base64Images.length > 0) {
          results.push({
            type: 'accommodation',
            id: accommodation._id.toString(),
            base64Images,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to find base64 images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify that base64 replacement was successful
   */
  async verifyBase64Replacement(
    entityType: 'establishment' | 'accommodation',
    entityId: string,
    originalBase64: string,
    newUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let entity;
      
      if (entityType === 'establishment') {
        entity = await EstablishmentModel.findById(entityId).select('images');
      } else {
        entity = await AccommodationModel.findById(entityId).select('images');
      }

      if (!entity) {
        return { success: false, error: `${entityType} not found` };
      }

      // Check that the original base64 is no longer present
      const hasOriginalBase64 = entity.images.some(image => image === originalBase64);
      if (hasOriginalBase64) {
        return { success: false, error: 'Original base64 string still present in images array' };
      }

      // Check that the new URL is present
      const hasNewUrl = entity.images.some(image => image === newUrl);
      if (!hasNewUrl) {
        return { success: false, error: 'New URL not found in images array' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Verify migration completeness for a specific entity
   */
  async verifyEntityMigration(
    entityType: 'establishment' | 'accommodation',
    entityId: string
  ): Promise<{
    isComplete: boolean;
    remainingBase64Count: number;
    totalImages: number;
    migratedImages: number;
    base64Images: string[];
    urlImages: string[];
  }> {
    try {
      let entity;
      
      if (entityType === 'establishment') {
        entity = await EstablishmentModel.findById(entityId).select('images');
      } else {
        entity = await AccommodationModel.findById(entityId).select('images');
      }

      if (!entity) {
        throw new Error(`${entityType} not found`);
      }

      const base64Images = entity.images.filter(image => 
        image && typeof image === 'string' && image.startsWith('data:image/')
      );
      
      const urlImages = entity.images.filter(image => 
        image && typeof image === 'string' && !image.startsWith('data:image/')
      );

      return {
        isComplete: base64Images.length === 0,
        remainingBase64Count: base64Images.length,
        totalImages: entity.images.length,
        migratedImages: urlImages.length,
        base64Images,
        urlImages,
      };
    } catch (error) {
      throw new Error(`Failed to verify entity migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify overall migration completeness across all entities
   */
  async verifyOverallMigrationCompleteness(): Promise<{
    isComplete: boolean;
    totalEntities: number;
    completeEntities: number;
    incompleteEntities: number;
    totalBase64Images: number;
    totalMigratedImages: number;
    entitiesWithBase64: Array<{
      type: 'establishment' | 'accommodation';
      id: string;
      name?: string;
      base64Count: number;
      totalImages: number;
    }>;
  }> {
    try {
      const result = {
        isComplete: true,
        totalEntities: 0,
        completeEntities: 0,
        incompleteEntities: 0,
        totalBase64Images: 0,
        totalMigratedImages: 0,
        entitiesWithBase64: [] as Array<{
          type: 'establishment' | 'accommodation';
          id: string;
          name?: string;
          base64Count: number;
          totalImages: number;
        }>,
      };

      // Check establishments
      const establishments = await EstablishmentModel.find({}).select('_id name images');
      for (const establishment of establishments) {
        result.totalEntities++;
        
        const verification = await this.verifyEntityMigration('establishment', establishment._id.toString());
        
        if (verification.isComplete) {
          result.completeEntities++;
        } else {
          result.incompleteEntities++;
          result.isComplete = false;
          result.entitiesWithBase64.push({
            type: 'establishment',
            id: establishment._id.toString(),
            name: establishment.name,
            base64Count: verification.remainingBase64Count,
            totalImages: verification.totalImages,
          });
        }
        
        result.totalBase64Images += verification.remainingBase64Count;
        result.totalMigratedImages += verification.migratedImages;
      }

      // Check accommodations
      const accommodations = await AccommodationModel.find({}).select('_id name images');
      for (const accommodation of accommodations) {
        result.totalEntities++;
        
        const verification = await this.verifyEntityMigration('accommodation', accommodation._id.toString());
        
        if (verification.isComplete) {
          result.completeEntities++;
        } else {
          result.incompleteEntities++;
          result.isComplete = false;
          result.entitiesWithBase64.push({
            type: 'accommodation',
            id: accommodation._id.toString(),
            name: accommodation.name,
            base64Count: verification.remainingBase64Count,
            totalImages: verification.totalImages,
          });
        }
        
        result.totalBase64Images += verification.remainingBase64Count;
        result.totalMigratedImages += verification.migratedImages;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to verify overall migration completeness: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch verify multiple entity migrations
   */
  async batchVerifyMigrations(
    entities: Array<{ type: 'establishment' | 'accommodation'; id: string }>
  ): Promise<Array<{
    entityType: 'establishment' | 'accommodation';
    entityId: string;
    isComplete: boolean;
    remainingBase64Count: number;
    error?: string;
  }>> {
    const results = [];
    
    for (const entity of entities) {
      try {
        const verification = await this.verifyEntityMigration(entity.type, entity.id);
        results.push({
          entityType: entity.type,
          entityId: entity.id,
          isComplete: verification.isComplete,
          remainingBase64Count: verification.remainingBase64Count,
        });
      } catch (error) {
        results.push({
          entityType: entity.type,
          entityId: entity.id,
          isComplete: false,
          remainingBase64Count: -1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }

  /**
   * Get statistics about images in the system
   */
  async getImageStats(): Promise<{
    totalImages: number;
    imagesByEstablishment: Record<string, number>;
    totalFileSize: number;
    averageFileSize: number;
    imagesByMimeType: Record<string, number>;
  }> {
    try {
      const totalImages = await ImageMetadataModel.countDocuments();
      
      const establishmentStats = await ImageMetadataModel.aggregate([
        {
          $group: {
            _id: '$establishmentId',
            count: { $sum: 1 },
          },
        },
      ]);

      const fileSizeStats = await ImageMetadataModel.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$fileSize' },
            avgSize: { $avg: '$fileSize' },
          },
        },
      ]);

      const mimeTypeStats = await ImageMetadataModel.aggregate([
        {
          $group: {
            _id: '$mimeType',
            count: { $sum: 1 },
          },
        },
      ]);

      const imagesByEstablishment: Record<string, number> = {};
      establishmentStats.forEach(stat => {
        imagesByEstablishment[stat._id.toString()] = stat.count;
      });

      const imagesByMimeType: Record<string, number> = {};
      mimeTypeStats.forEach(stat => {
        imagesByMimeType[stat._id] = stat.count;
      });

      return {
        totalImages,
        imagesByEstablishment,
        totalFileSize: fileSizeStats[0]?.totalSize || 0,
        averageFileSize: fileSizeStats[0]?.avgSize || 0,
        imagesByMimeType,
      };
    } catch (error) {
      throw new Error(`Failed to get image statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const imageMetadataStore = new ImageMetadataStore();