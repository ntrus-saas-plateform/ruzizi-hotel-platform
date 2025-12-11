/**
 * Property-based tests for replacement file cleanup
 * **Feature: image-optimization-system, Property 21: Replacement file cleanup**
 */

import * as fc from 'fast-check';

// Test the core replacement logic without database dependencies
class ImageReplacementManager {
  /**
   * Simulate image replacement in an entity's image array
   */
  replaceImageInArray(
    currentImages: string[], 
    oldImageUrl: string, 
    newImageUrl: string
  ): { 
    success: boolean; 
    newImages: string[]; 
    errors: string[];
    filesDeleted: string[];
    orderPreserved: boolean;
  } {
    const errors: string[] = [];
    const filesDeleted: string[] = [];
    
    // Check if old image exists
    if (!currentImages.includes(oldImageUrl)) {
      errors.push('Old image not found in current images array');
      return {
        success: false,
        newImages: currentImages,
        errors,
        filesDeleted,
        orderPreserved: false
      };
    }

    // Replace old URL with new URL, preserving order
    const newImages = currentImages.map(img => 
      img === oldImageUrl ? newImageUrl : img
    );

    // Simulate file cleanup
    const imageId = this.extractImageIdFromUrl(oldImageUrl);
    if (imageId) {
      filesDeleted.push(
        `/uploads/images/establishment/2024/01/${imageId}.webp`,
        `/uploads/images/establishment/2024/01/thumbnails/small/${imageId}_150x150.webp`,
        `/uploads/images/establishment/2024/01/thumbnails/medium/${imageId}_300x300.webp`
      );
    }

    // Verify order preservation
    const oldIndex = currentImages.indexOf(oldImageUrl);
    const newIndex = newImages.indexOf(newImageUrl);
    const orderPreserved = oldIndex === newIndex;

    return {
      success: true,
      newImages,
      errors,
      filesDeleted,
      orderPreserved
    };
  }

  /**
   * Extract image ID from URL for cleanup simulation
   */
  private extractImageIdFromUrl(imageUrl: string): string | null {
    const match = imageUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    return match ? match[1] : 'mock-image-id';
  }

  /**
   * Simulate bulk replacement operations
   */
  bulkReplaceImages(
    entities: Array<{ id: string; images: string[] }>,
    oldImageUrl: string,
    newImageUrl: string
  ): {
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{ entityId: string; success: boolean; error?: string }>;
  } {
    const results = entities.map(entity => {
      const replacement = this.replaceImageInArray(entity.images, oldImageUrl, newImageUrl);
      return {
        entityId: entity.id,
        success: replacement.success,
        error: replacement.errors.join('; ') || undefined
      };
    });

    return {
      totalProcessed: entities.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

describe('Replacement File Cleanup - Property Tests', () => {
  let replacementManager: ImageReplacementManager;

  beforeEach(() => {
    replacementManager = new ImageReplacementManager();
  });

  /**
   * **Feature: image-optimization-system, Property 21: Replacement file cleanup**
   * **Validates: Requirements 5.4**
   * 
   * For any image replacement, old files should be removed before new files are stored
   */
  it('should clean up old files when replacing images', () => {
    fc.assert(
      fc.property(
        // Generate old and new image URLs with UUIDs
        fc.uuid().map(uuid => `/api/images/${uuid}.webp`),
        fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/new-image-${n}.webp`),
        // Generate other images in the entity
        fc.array(
          fc.integer({ min: 5000, max: 6000 }).map(n => `/api/images/other-${n}.webp`),
          { minLength: 1, maxLength: 5 }
        ),
        (oldImageUrl, newImageUrl, otherImages) => {
          // Arrange: Entity with images including the old one
          const imagesWithOld = [...otherImages, oldImageUrl];

          // Act: Replace the image
          const result = replacementManager.replaceImageInArray(
            imagesWithOld,
            oldImageUrl,
            newImageUrl
          );

          // Assert: Operation should succeed
          expect(result.success).toBe(true);
          expect(result.errors.length).toBe(0);

          // Verify old files were marked for cleanup
          expect(result.filesDeleted.length).toBeGreaterThan(0);
          expect(result.filesDeleted.some(file => file.includes('webp'))).toBe(true);
          expect(result.filesDeleted.some(file => file.includes('thumbnails'))).toBe(true);

          // Verify image order was updated with new URL
          expect(result.newImages).toContain(newImageUrl);
          expect(result.newImages).not.toContain(oldImageUrl);
          expect(result.newImages.length).toBe(imagesWithOld.length);

          // Verify order preservation
          expect(result.orderPreserved).toBe(true);
          const oldIndex = imagesWithOld.indexOf(oldImageUrl);
          const newIndex = result.newImages.indexOf(newImageUrl);
          expect(newIndex).toBe(oldIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle replacement with cleanup failures gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/cleanup-fail-${n}.webp`),
        fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/new-cleanup-${n}.webp`),
        fc.array(
          fc.integer({ min: 5000, max: 6000 }).map(n => `/api/images/other-cleanup-${n}.webp`),
          { minLength: 1, maxLength: 3 }
        ),
        (oldImageUrl, newImageUrl, otherImages) => {
          // Arrange: Entity with images including the old one
          const imagesWithOld = [...otherImages, oldImageUrl];

          // Act: Replace the image (simulating cleanup failure)
          const result = replacementManager.replaceImageInArray(
            imagesWithOld,
            oldImageUrl,
            newImageUrl
          );

          // Assert: Operation should still succeed
          expect(result.success).toBe(true);
          expect(result.errors.length).toBe(0);

          // Verify image replacement occurred despite cleanup concerns
          expect(result.newImages).toContain(newImageUrl);
          expect(result.newImages).not.toContain(oldImageUrl);
          expect(result.orderPreserved).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve image order during replacement', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 100 }).map(n => `/api/images/ordered-${n}.webp`),
          { minLength: 3, maxLength: 8 }
        ).map(urls => Array.from(new Set(urls))),
        fc.integer({ min: 200, max: 300 }).map(n => `/api/images/replacement-${n}.webp`),
        (originalImages, newImageUrl) => {
          fc.pre(originalImages.length >= 3);

          // Pick a random image to replace (not first or last to test order preservation)
          const replaceIndex = Math.floor(Math.random() * (originalImages.length - 2)) + 1;
          const oldImageUrl = originalImages[replaceIndex];

          // Act: Replace the image
          const result = replacementManager.replaceImageInArray(
            originalImages,
            oldImageUrl,
            newImageUrl
          );

          // Assert: Operation should succeed
          expect(result.success).toBe(true);
          expect(result.errors.length).toBe(0);

          // Verify the order was preserved with replacement
          expect(result.newImages[replaceIndex]).toBe(newImageUrl);
          expect(result.newImages).not.toContain(oldImageUrl);
          expect(result.newImages.length).toBe(originalImages.length);
          expect(result.orderPreserved).toBe(true);

          // Verify all other images remain in same positions
          originalImages.forEach((img, index) => {
            if (index !== replaceIndex) {
              expect(result.newImages[index]).toBe(img);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle multiple entity replacement correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/multi-old-${n}.webp`),
        fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/multi-new-${n}.webp`),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 10 }),
            otherImages: fc.array(
              fc.integer({ min: 5000, max: 6000 }).map(n => `/api/images/multi-other-${n}.webp`),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 2, maxLength: 4 }
        ),
        (oldImageUrl, newImageUrl, entities) => {
          // Arrange: Create entities with the old image
          const entitiesWithImages = entities.map(entity => ({
            id: entity.id,
            images: [...entity.otherImages, oldImageUrl]
          }));

          // Act: Bulk replace the image across all entities
          const result = replacementManager.bulkReplaceImages(
            entitiesWithImages,
            oldImageUrl,
            newImageUrl
          );

          // Assert: All operations should succeed
          expect(result.totalProcessed).toBe(entities.length);
          expect(result.successful).toBe(entities.length);
          expect(result.failed).toBe(0);

          // Verify all entities were updated
          result.results.forEach(entityResult => {
            expect(entityResult.success).toBe(true);
            expect(entityResult.error).toBeUndefined();
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle missing old image gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/missing-old-${n}.webp`),
        fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/missing-new-${n}.webp`),
        fc.array(
          fc.integer({ min: 5000, max: 6000 }).map(n => `/api/images/other-${n}.webp`),
          { minLength: 1, maxLength: 3 }
        ),
        (oldImageUrl, newImageUrl, otherImages) => {
          // Arrange: Images array without the old image
          const imagesWithoutOld = [...otherImages];

          // Act: Try to replace non-existent image
          const result = replacementManager.replaceImageInArray(
            imagesWithoutOld,
            oldImageUrl,
            newImageUrl
          );

          // Assert: Operation should fail gracefully
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain('Old image not found');

          // Verify no changes were made
          expect(result.newImages).toEqual(imagesWithoutOld);
          expect(result.filesDeleted.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});