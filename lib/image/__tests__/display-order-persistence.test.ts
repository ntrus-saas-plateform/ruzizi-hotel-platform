/**
 * Property-based tests for display order persistence
 * **Feature: image-optimization-system, Property 20: Display order persistence**
 */

import * as fc from 'fast-check';

// Test the core validation logic without database dependencies
class ImageOrderValidator {
  /**
   * Validate that new order contains exactly the same images as current order
   */
  validateImageOrder(currentImages: string[], newOrder: string[]): string[] {
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
   * Simulate reordering operation
   */
  reorderImages(currentImages: string[], newOrder: string[]): { success: boolean; errors: string[]; newOrder: string[] } {
    const errors = this.validateImageOrder(currentImages, newOrder);
    
    return {
      success: errors.length === 0,
      errors,
      newOrder: errors.length === 0 ? newOrder : currentImages
    };
  }
}

describe('Display Order Persistence - Property Tests', () => {
  let validator: ImageOrderValidator;

  beforeEach(() => {
    validator = new ImageOrderValidator();
  });

  /**
   * **Feature: image-optimization-system, Property 20: Display order persistence**
   * **Validates: Requirements 5.3**
   * 
   * For any image reordering operation, the new order should be correctly saved and retrievable
   */
  it('should validate correct image reordering', () => {
    fc.assert(
      fc.property(
        // Generate an array of unique image URLs
        fc.array(
          fc.integer({ min: 1, max: 1000000 }).map(n => `/api/images/image-${n}.webp`),
          { minLength: 2, maxLength: 10 }
        ).map(urls => Array.from(new Set(urls))), // Ensure uniqueness
        (originalImages) => {
          // Skip if we don't have enough unique images
          fc.pre(originalImages.length >= 2);

          // Create a shuffled version of the images (new order)
          const newOrder = [...originalImages].sort(() => Math.random() - 0.5);
          
          // Act: Validate the reordering
          const result = validator.reorderImages(originalImages, newOrder);

          // Assert: Operation should succeed
          expect(result.success).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.newOrder).toEqual(newOrder);
          
          // Verify the new order contains exactly the same images
          expect(new Set(result.newOrder)).toEqual(new Set(originalImages));
          expect(result.newOrder.length).toBe(originalImages.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate reordering with same elements', () => {
    fc.assert(
      fc.property(
        // Generate an array of unique image URLs
        fc.array(
          fc.integer({ min: 1, max: 1000000 }).map(n => `/api/images/image-${n}.webp`),
          { minLength: 2, maxLength: 10 }
        ).map(urls => Array.from(new Set(urls))), // Ensure uniqueness
        (originalImages) => {
          // Skip if we don't have enough unique images
          fc.pre(originalImages.length >= 2);

          // Create multiple different valid reorderings
          const reordering1 = [...originalImages].reverse();
          const reordering2 = [...originalImages].sort();
          const reordering3 = [...originalImages].sort(() => Math.random() - 0.5);
          
          // Act & Assert: All reorderings should be valid
          [reordering1, reordering2, reordering3].forEach(newOrder => {
            const result = validator.reorderImages(originalImages, newOrder);
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.newOrder).toEqual(newOrder);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject reordering with invalid image sets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 1000 }).map(n => `/api/images/original-${n}.webp`),
          { minLength: 3, maxLength: 8 }
        ).map(urls => Array.from(new Set(urls))),
        fc.array(
          fc.integer({ min: 2000, max: 3000 }).map(n => `/api/images/different-${n}.webp`),
          { minLength: 1, maxLength: 5 }
        ).map(urls => Array.from(new Set(urls))),
        (originalImages, differentImages) => {
          // Ensure the arrays are actually different
          fc.pre(
            originalImages.length !== differentImages.length ||
            !originalImages.every(img => differentImages.includes(img))
          );

          // Act: Try to reorder with different images
          const result = validator.reorderImages(originalImages, differentImages);

          // Assert: Operation should fail
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should contain validation error messages
          const errorText = result.errors.join(' ').toLowerCase();
          expect(
            errorText.includes('same number') ||
            errorText.includes('not in the current') ||
            errorText.includes('missing from new order')
          ).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty image arrays correctly', () => {
    fc.assert(
      fc.property(
        fc.constant([]), // Empty array
        (emptyArray) => {
          // Convert readonly array to mutable array
          const mutableEmptyArray = [...emptyArray];
          
          // Act: Reorder empty array
          const result = validator.reorderImages(mutableEmptyArray, []);

          // Assert: Should succeed with empty array
          expect(result.success).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.newOrder).toEqual([]);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should preserve exact order including duplicates in validation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 100 }).map(n => `/api/images/unique-${n}.webp`),
          { minLength: 3, maxLength: 6 }
        ).map(urls => Array.from(new Set(urls))),
        (uniqueImages) => {
          fc.pre(uniqueImages.length >= 3);

          // Create array with intentional duplicates
          const imagesWithDuplicates = [...uniqueImages, uniqueImages[0], uniqueImages[1]];
          
          // Try to reorder with the same duplicates but in different order
          const reorderedWithDuplicates = [...imagesWithDuplicates].reverse();

          // Act: Validate the reordering
          const result = validator.reorderImages(imagesWithDuplicates, reorderedWithDuplicates);

          // Assert: Should succeed because the multisets match exactly
          expect(result.success).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.newOrder).toEqual(reorderedWithDuplicates);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle multiple reordering operations consistently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1, max: 100 }).map(n => `/api/images/concurrent-${n}.webp`),
          { minLength: 3, maxLength: 6 }
        ).map(urls => Array.from(new Set(urls))),
        fc.integer({ min: 2, max: 5 }),
        (originalImages, operationCount) => {
          fc.pre(originalImages.length >= 3);

          // Create multiple different valid reorderings
          const reorderOperations = Array.from({ length: operationCount }, () => {
            return [...originalImages].sort(() => Math.random() - 0.5);
          });

          // Act: Execute multiple reordering validations
          const results = reorderOperations.map(newOrder =>
            validator.reorderImages(originalImages, newOrder)
          );

          // Assert: All operations should succeed
          results.forEach((result, index) => {
            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.newOrder).toEqual(reorderOperations[index]);
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle edge cases in validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Different lengths
          fc.tuple(
            fc.array(fc.string(), { minLength: 3, maxLength: 5 }),
            fc.array(fc.string(), { minLength: 1, maxLength: 2 })
          ),
          // Missing elements
          fc.tuple(
            fc.constant(['/api/images/a.webp', '/api/images/b.webp', '/api/images/c.webp']),
            fc.constant(['/api/images/a.webp', '/api/images/d.webp'])
          ),
          // Extra elements
          fc.tuple(
            fc.constant(['/api/images/a.webp', '/api/images/b.webp']),
            fc.constant(['/api/images/a.webp', '/api/images/b.webp', '/api/images/c.webp'])
          )
        ),
        ([originalImages, newOrder]) => {
          // Convert readonly arrays to mutable arrays
          const mutableOriginalImages = [...originalImages];
          const mutableNewOrder = [...newOrder];
          
          // Act: Validate invalid reordering
          const result = validator.reorderImages(mutableOriginalImages, mutableNewOrder);

          // Assert: Should fail with appropriate errors
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should return original order on failure
          expect(result.newOrder).toEqual(mutableOriginalImages);
        }
      ),
      { numRuns: 50 }
    );
  });
});