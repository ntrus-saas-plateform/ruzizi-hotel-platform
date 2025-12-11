/**
 * Property-based tests for ImageProcessor service
 * **Feature: image-optimization-system, Property 4: Thumbnail generation completeness**
 */

import * as fc from 'fast-check';
import { ImageProcessor } from '../image-processor';
import { IMAGE_CONFIG } from '../config';

// Create a simple test image using Sharp itself for reliable test data
const createTestImage = async (width: number = 100, height: number = 100, format: 'png' | 'jpeg' = 'png') => {
  const sharp = require('sharp');
  
  if (format === 'png') {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toBuffer();
  } else {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toBuffer();
  }
};

describe('ImageProcessor - Property Tests', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  /**
   * **Feature: image-optimization-system, Property 4: Thumbnail generation completeness**
   * **Validates: Requirements 1.4**
   * 
   * For any processed image, the system should generate all four required thumbnail sizes (150x150, 300x300, 600x400, 1200x800)
   */
  it('should generate all required thumbnail sizes for any valid image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 300, max: 800 }), // Smaller range for faster tests
        fc.integer({ min: 300, max: 800 }),
        fc.constant('test-image.jpg'), // Use constant filename
        fc.constant('establishment-123'), // Use constant establishment
        fc.constant('user-456'), // Use constant user
        async (format, width, height, filename, establishmentId, userId) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Process image
          const result = await processor.processImage(
            imageBuffer,
            filename,
            establishmentId,
            userId
          );
          
          // Assert: All four required thumbnail sizes should be present
          expect(result.thumbnails).toBeDefined();
          expect(result.thumbnails.small).toBeDefined();
          expect(result.thumbnails.medium).toBeDefined();
          expect(result.thumbnails.large).toBeDefined();
          expect(result.thumbnails.xlarge).toBeDefined();
          
          // Verify each thumbnail has correct dimensions
          expect(result.thumbnails.small.width).toBe(IMAGE_CONFIG.thumbnailSizes.small.width);
          expect(result.thumbnails.small.height).toBe(IMAGE_CONFIG.thumbnailSizes.small.height);
          
          expect(result.thumbnails.medium.width).toBe(IMAGE_CONFIG.thumbnailSizes.medium.width);
          expect(result.thumbnails.medium.height).toBe(IMAGE_CONFIG.thumbnailSizes.medium.height);
          
          expect(result.thumbnails.large.width).toBe(IMAGE_CONFIG.thumbnailSizes.large.width);
          expect(result.thumbnails.large.height).toBe(IMAGE_CONFIG.thumbnailSizes.large.height);
          
          expect(result.thumbnails.xlarge.width).toBe(IMAGE_CONFIG.thumbnailSizes.xlarge.width);
          expect(result.thumbnails.xlarge.height).toBe(IMAGE_CONFIG.thumbnailSizes.xlarge.height);
          
          // Verify each thumbnail has valid path and URL
          expect(result.thumbnails.small.path).toContain('150x150');
          expect(result.thumbnails.medium.path).toContain('300x300');
          expect(result.thumbnails.large.path).toContain('600x400');
          expect(result.thumbnails.xlarge.path).toContain('1200x800');
          
          expect(result.thumbnails.small.url).toContain('/thumbnail/small');
          expect(result.thumbnails.medium.url).toContain('/thumbnail/medium');
          expect(result.thumbnails.large.url).toContain('/thumbnail/large');
          expect(result.thumbnails.xlarge.url).toContain('/thumbnail/xlarge');
          
          // Verify file sizes are positive
          expect(result.thumbnails.small.fileSize).toBeGreaterThan(0);
          expect(result.thumbnails.medium.fileSize).toBeGreaterThan(0);
          expect(result.thumbnails.large.fileSize).toBeGreaterThan(0);
          expect(result.thumbnails.xlarge.fileSize).toBeGreaterThan(0);
          
          // Verify buffers are generated if available
          if (result.buffers) {
            expect(result.buffers.thumbnails.webp.small).toBeDefined();
            expect(result.buffers.thumbnails.webp.medium).toBeDefined();
            expect(result.buffers.thumbnails.webp.large).toBeDefined();
            expect(result.buffers.thumbnails.webp.xlarge).toBeDefined();
            
            expect(Buffer.isBuffer(result.buffers.thumbnails.webp.small)).toBe(true);
            expect(Buffer.isBuffer(result.buffers.thumbnails.webp.medium)).toBe(true);
            expect(Buffer.isBuffer(result.buffers.thumbnails.webp.large)).toBe(true);
            expect(Buffer.isBuffer(result.buffers.thumbnails.webp.xlarge)).toBe(true);
          }
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    );
  }, 15000); // 15 second timeout

  it('should generate thumbnails with consistent quality and format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 400, max: 600 }), // Smaller range
        fc.integer({ min: 400, max: 600 }),
        async (format, width, height) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Generate thumbnails directly
          const thumbnails = await processor.generateThumbnails(imageBuffer);
          
          // Assert: All thumbnails should be generated
          expect(Object.keys(thumbnails)).toHaveLength(4);
          expect(thumbnails.small).toBeDefined();
          expect(thumbnails.medium).toBeDefined();
          expect(thumbnails.large).toBeDefined();
          expect(thumbnails.xlarge).toBeDefined();
          
          // All should be valid buffers
          expect(Buffer.isBuffer(thumbnails.small)).toBe(true);
          expect(Buffer.isBuffer(thumbnails.medium)).toBe(true);
          expect(Buffer.isBuffer(thumbnails.large)).toBe(true);
          expect(Buffer.isBuffer(thumbnails.xlarge)).toBe(true);
          
          // All should have content
          expect(thumbnails.small.length).toBeGreaterThan(0);
          expect(thumbnails.medium.length).toBeGreaterThan(0);
          expect(thumbnails.large.length).toBeGreaterThan(0);
          expect(thumbnails.xlarge.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 } // Reduced runs
    );
  }, 10000); // 10 second timeout

  it('should handle batch processing and generate thumbnails for all images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            format: fc.constantFrom('png', 'jpeg'),
            width: fc.constant(400), // Use constant size for speed
            height: fc.constant(400),
            filename: fc.constant('test-image.jpg') // Use constant filename
          }),
          { minLength: 1, maxLength: 2 } // Very small batch
        ),
        fc.constant('establishment-123'),
        fc.constant('user-456'),
        async (imageSpecs, establishmentId, userId) => {
          // Arrange: Create test images
          const images = await Promise.all(
            imageSpecs.map(async spec => ({
              buffer: await createTestImage(spec.width, spec.height, spec.format as 'png' | 'jpeg'),
              filename: spec.filename
            }))
          );
          
          // Act: Process multiple images
          const results = await processor.processMultipleImages(images, establishmentId, userId);
          
          // Assert: Should process all images successfully
          expect(results).toHaveLength(images.length);
          
          // Each result should have complete thumbnails
          results.forEach(result => {
            expect(result.thumbnails.small).toBeDefined();
            expect(result.thumbnails.medium).toBeDefined();
            expect(result.thumbnails.large).toBeDefined();
            expect(result.thumbnails.xlarge).toBeDefined();
            
            // Verify dimensions
            expect(result.thumbnails.small.width).toBe(150);
            expect(result.thumbnails.small.height).toBe(150);
            expect(result.thumbnails.medium.width).toBe(300);
            expect(result.thumbnails.medium.height).toBe(300);
            expect(result.thumbnails.large.width).toBe(600);
            expect(result.thumbnails.large.height).toBe(400);
            expect(result.thumbnails.xlarge.width).toBe(1200);
            expect(result.thumbnails.xlarge.height).toBe(800);
          });
        }
      ),
      { numRuns: 10 } // Very reduced runs for batch processing
    );
  }, 15000); // 15 second timeout
});