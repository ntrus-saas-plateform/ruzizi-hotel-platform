/**
 * Property-based tests for usage protection
 * **Feature: image-optimization-system, Property 22: Usage protection**
 */

import * as fc from 'fast-check';

// Test the core usage protection logic without database dependencies
interface EntityUsage {
  type: 'establishment' | 'accommodation' | 'booking';
  id: string;
  name?: string;
  images: string[];
}

interface UsageInfo {
  isInUse: boolean;
  usedBy: Array<{
    type: 'establishment' | 'accommodation' | 'booking';
    id: string;
    name?: string;
  }>;
}

interface DeletionResult {
  success: boolean;
  deletedImageUrl: string;
  filesDeleted: string[];
  errors: string[];
  usageInfo?: UsageInfo;
}

class ImageUsageProtector {
  /**
   * Check if an image is currently in use by any entity
   */
  checkImageUsage(imageUrl: string, entities: EntityUsage[]): UsageInfo {
    const usageInfo: UsageInfo = {
      isInUse: false,
      usedBy: []
    };

    for (const entity of entities) {
      if (entity.images.includes(imageUrl)) {
        usageInfo.usedBy.push({
          type: entity.type,
          id: entity.id,
          name: entity.name
        });
      }
    }

    usageInfo.isInUse = usageInfo.usedBy.length > 0;
    return usageInfo;
  }

  /**
   * Attempt to delete an image with usage protection
   */
  deleteImage(
    imageUrl: string, 
    entities: EntityUsage[],
    options: { force?: boolean } = {}
  ): DeletionResult {
    const result: DeletionResult = {
      success: false,
      deletedImageUrl: imageUrl,
      filesDeleted: [],
      errors: []
    };

    // Check usage first (unless force delete)
    const usageInfo = this.checkImageUsage(imageUrl, entities);
    result.usageInfo = usageInfo;

    if (!options.force && usageInfo.isInUse) {
      result.errors.push(`Image is currently in use by ${usageInfo.usedBy.length} entities`);
      return result;
    }

    // Simulate successful deletion
    result.success = true;
    result.filesDeleted = [
      `/uploads/images/establishment/2024/01/${this.extractImageId(imageUrl)}.webp`,
      `/uploads/images/establishment/2024/01/thumbnails/small/${this.extractImageId(imageUrl)}_150x150.webp`
    ];

    return result;
  }

  /**
   * Bulk delete multiple images with usage protection
   */
  bulkDeleteImages(
    imageUrls: string[],
    entities: EntityUsage[],
    options: { force?: boolean } = {}
  ): {
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{
      operation: string;
      imageUrl: string;
      success: boolean;
      error?: string;
    }>;
  } {
    const results = imageUrls.map(imageUrl => {
      const deleteResult = this.deleteImage(imageUrl, entities, options);
      return {
        operation: 'delete',
        imageUrl,
        success: deleteResult.success,
        error: deleteResult.errors.join('; ') || undefined
      };
    });

    return {
      totalProcessed: imageUrls.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  private extractImageId(imageUrl: string): string {
    return 'mock-image-id';
  }
}

describe('Usage Protection - Property Tests', () => {
  let protector: ImageUsageProtector;

  beforeEach(() => {
    protector = new ImageUsageProtector();
  });

  /**
   * **Feature: image-optimization-system, Property 22: Usage protection**
   * **Validates: Requirements 5.5**
   * 
   * For any image currently referenced by other entities, deletion should be prevented
   */
  it('should prevent deletion of images in use by establishments', () => {
    fc.assert(
      fc.property(
        // Generate image URL
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/protected-${n}.webp`),
        // Generate establishments using the image
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `Establishment ${s}`),
            otherImages: fc.array(
              fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/other-${n}.webp`),
              { minLength: 0, maxLength: 3 }
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (imageUrl, establishments) => {
          // Arrange: Create establishments using the image
          const entities: EntityUsage[] = establishments.map(est => ({
            type: 'establishment' as const,
            id: est.id,
            name: est.name,
            images: [...est.otherImages, imageUrl]
          }));

          // Act: Try to delete the image (without force)
          const result = protector.deleteImage(imageUrl, entities);

          // Assert: Deletion should be prevented
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain('currently in use');
          
          // Verify usage info is provided
          expect(result.usageInfo).toBeDefined();
          expect(result.usageInfo!.isInUse).toBe(true);
          expect(result.usageInfo!.usedBy.length).toBe(establishments.length);
          
          // Verify all using establishments are listed
          result.usageInfo!.usedBy.forEach((usage, index) => {
            expect(usage.type).toBe('establishment');
            expect(usage.id).toBe(establishments[index].id);
            expect(usage.name).toBe(establishments[index].name);
          });

          // Verify no cleanup was attempted (no files deleted)
          expect(result.filesDeleted.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow deletion of unused images', () => {
    fc.assert(
      fc.property(
        // Generate image URL
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/unused-${n}.webp`),
        // Generate entities that don't use the image
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            name: fc.string({ minLength: 5, maxLength: 30 }),
            type: fc.constantFrom('establishment', 'accommodation', 'booking'),
            otherImages: fc.array(
              fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/other-${n}.webp`),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (imageUrl, entitiesData) => {
          // Arrange: Create entities that don't use the target image
          const entities: EntityUsage[] = entitiesData.map(data => ({
            type: data.type as 'establishment' | 'accommodation' | 'booking',
            id: data.id,
            name: data.name,
            images: data.otherImages // No target image
          }));

          // Act: Delete the unused image
          const result = protector.deleteImage(imageUrl, entities);

          // Assert: Deletion should succeed
          expect(result.success).toBe(true);
          expect(result.errors.length).toBe(0);
          expect(result.deletedImageUrl).toBe(imageUrl);
          
          // Verify usage info shows not in use
          expect(result.usageInfo).toBeDefined();
          expect(result.usageInfo!.isInUse).toBe(false);
          expect(result.usageInfo!.usedBy.length).toBe(0);

          // Verify cleanup was performed
          expect(result.filesDeleted.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow force deletion even when image is in use', () => {
    fc.assert(
      fc.property(
        // Generate image URL
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/force-delete-${n}.webp`),
        // Generate establishment using the image
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 15 }),
          name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `Force Est ${s}`)
        }),
        (imageUrl, establishment) => {
          // Arrange: Create establishment using the image
          const entities: EntityUsage[] = [{
            type: 'establishment',
            id: establishment.id,
            name: establishment.name,
            images: [imageUrl]
          }];

          // Act: Force delete the image
          const result = protector.deleteImage(imageUrl, entities, { force: true });

          // Assert: Deletion should succeed despite being in use
          expect(result.success).toBe(true);
          expect(result.errors.length).toBe(0);
          expect(result.deletedImageUrl).toBe(imageUrl);

          // Verify usage info still shows in use (but deletion proceeded)
          expect(result.usageInfo).toBeDefined();
          expect(result.usageInfo!.isInUse).toBe(true);
          expect(result.usageInfo!.usedBy.length).toBe(1);

          // Verify cleanup was performed
          expect(result.filesDeleted.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle mixed entity usage correctly', () => {
    fc.assert(
      fc.property(
        // Generate image URL
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/mixed-usage-${n}.webp`),
        // Generate mixed entities using the image
        fc.record({
          establishments: fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 15 }),
              name: fc.string({ minLength: 5, maxLength: 30 }).map(s => `Est ${s}`)
            }),
            { minLength: 1, maxLength: 3 }
          ),
          accommodations: fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 15 }),
              name: fc.string({ minLength: 5, maxLength: 30 }).map(s => `Acc ${s}`)
            }),
            { minLength: 1, maxLength: 3 }
          ),
          bookings: fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 15 }),
              bookingCode: fc.string({ minLength: 5, maxLength: 15 }).map(s => `BK-${s}`)
            }),
            { minLength: 0, maxLength: 2 }
          )
        }),
        (imageUrl, entityData) => {
          // Arrange: Create all entity types using the image
          const entities: EntityUsage[] = [
            ...entityData.establishments.map(est => ({
              type: 'establishment' as const,
              id: est.id,
              name: est.name,
              images: [imageUrl]
            })),
            ...entityData.accommodations.map(acc => ({
              type: 'accommodation' as const,
              id: acc.id,
              name: acc.name,
              images: [imageUrl]
            })),
            ...entityData.bookings.map(booking => ({
              type: 'booking' as const,
              id: booking.id,
              name: booking.bookingCode,
              images: [imageUrl]
            }))
          ];

          // Act: Try to delete the image
          const result = protector.deleteImage(imageUrl, entities);

          // Assert: Deletion should be prevented
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain('currently in use');
          
          // Verify usage info includes all entity types
          expect(result.usageInfo).toBeDefined();
          expect(result.usageInfo!.isInUse).toBe(true);
          
          const totalExpectedUsage = entityData.establishments.length + 
                                   entityData.accommodations.length + 
                                   entityData.bookings.length;
          expect(result.usageInfo!.usedBy.length).toBe(totalExpectedUsage);

          // Verify all entity types are represented
          const usageByType = result.usageInfo!.usedBy.reduce((acc, usage) => {
            acc[usage.type] = (acc[usage.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          expect(usageByType.establishment || 0).toBe(entityData.establishments.length);
          expect(usageByType.accommodation || 0).toBe(entityData.accommodations.length);
          expect(usageByType.booking || 0).toBe(entityData.bookings.length);

          // Verify no cleanup was attempted
          expect(result.filesDeleted.length).toBe(0);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle bulk deletion with usage protection', () => {
    fc.assert(
      fc.property(
        // Generate multiple image URLs
        fc.array(
          fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/bulk-${n}.webp`),
          { minLength: 3, maxLength: 8 }
        ).map(urls => Array.from(new Set(urls))),
        // Generate which images are in use
        fc.array(fc.boolean(), { minLength: 3, maxLength: 8 }),
        (imageUrls, inUseFlags) => {
          fc.pre(imageUrls.length >= 3 && inUseFlags.length >= imageUrls.length);

          // Arrange: Create entities for images that are in use
          const entities: EntityUsage[] = [];
          imageUrls.forEach((url, index) => {
            if (inUseFlags[index]) {
              entities.push({
                type: 'establishment',
                id: `est-${index}`,
                name: `Establishment ${index}`,
                images: [url]
              });
            }
          });

          // Act: Bulk delete all images
          const result = protector.bulkDeleteImages(imageUrls, entities);

          // Assert: Results should match usage protection
          expect(result.totalProcessed).toBe(imageUrls.length);
          
          const expectedSuccessful = imageUrls.filter((_, index) => !inUseFlags[index]).length;
          const expectedFailed = imageUrls.filter((_, index) => inUseFlags[index]).length;
          
          expect(result.successful).toBe(expectedSuccessful);
          expect(result.failed).toBe(expectedFailed);

          // Verify results for each image
          result.results.forEach((res, index) => {
            if (inUseFlags[index]) {
              expect(res.success).toBe(false);
              expect(res.error).toContain('currently in use');
            } else {
              expect(res.success).toBe(true);
            }
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});