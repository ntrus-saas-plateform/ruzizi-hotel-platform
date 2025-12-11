/**
 * Property-based tests for filename uniqueness
 * **Feature: image-optimization-system, Property 8: Filename uniqueness**
 */

import * as fc from 'fast-check';
import { MetadataExtractor } from '../metadata-extractor';
import { ImageProcessor } from '../image-processor';

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

describe('Filename Uniqueness - Property Tests', () => {
  let extractor: MetadataExtractor;
  let processor: ImageProcessor;

  beforeEach(() => {
    extractor = new MetadataExtractor();
    processor = new ImageProcessor();
  });

  /**
   * **Feature: image-optimization-system, Property 8: Filename uniqueness**
   * **Validates: Requirements 2.4**
   * 
   * For any generated filename, it should be UUID-based and unique across the entire system
   */
  it('should generate unique UUID-based filenames for any input', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `image-${s}.jpg`),
          { minLength: 100, maxLength: 1000 } // Large array to test uniqueness
        ),
        (filenames) => {
          // Act: Generate unique filenames for all inputs
          const generatedNames = filenames.map(filename => 
            extractor.generateUniqueFilename(filename)
          );
          
          // Assert: All generated names should be unique
          const uniqueNames = new Set(generatedNames);
          expect(uniqueNames.size).toBe(generatedNames.length);
          
          // All should be UUID-based (contain UUID pattern)
          generatedNames.forEach(name => {
            // UUID v4 pattern: 8-4-4-4-12 hexadecimal characters
            expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            expect(name.length).toBeGreaterThan(36); // UUID + extension
          });
          
          // Should preserve file extensions
          filenames.forEach((original, index) => {
            const generated = generatedNames[index];
            if (original.includes('.')) {
              const originalExt = original.substring(original.lastIndexOf('.'));
              expect(generated).toContain('.'); // Should have extension
              expect(generated.endsWith('.jpg') || generated.endsWith('.jpeg') || 
                     generated.endsWith('.png') || generated.endsWith('.webp') ||
                     generated.endsWith('.gif')).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique IDs for image metadata', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        (count) => {
          // Act: Generate multiple image IDs
          const ids = Array.from({ length: count }, () => extractor.generateImageId());
          
          // Assert: All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
          
          // All should be valid UUIDs
          ids.forEach(id => {
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(id.length).toBe(36);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate unique filenames even with identical input names', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `duplicate-${s}.jpg`),
        fc.integer({ min: 10, max: 100 }),
        (filename, count) => {
          // Act: Generate multiple filenames from the same input
          const generatedNames = Array.from({ length: count }, () => 
            extractor.generateUniqueFilename(filename)
          );
          
          // Assert: All should be unique despite identical input
          const uniqueNames = new Set(generatedNames);
          expect(uniqueNames.size).toBe(generatedNames.length);
          
          // All should follow UUID pattern
          generatedNames.forEach(name => {
            expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique metadata IDs during image processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            format: fc.constantFrom('png', 'jpeg'),
            width: fc.constant(200),
            height: fc.constant(200),
            filename: fc.constant('test-image.jpg')
          }),
          { minLength: 3, maxLength: 5 } // Reduced for faster execution
        ),
        fc.constant('establishment-123'),
        fc.constant('user-456'),
        async (imageSpecs, establishmentId, userId) => {
          // Arrange: Create multiple identical test images
          const images = await Promise.all(
            imageSpecs.map(async spec => ({
              buffer: await createTestImage(spec.width, spec.height, spec.format as 'png' | 'jpeg'),
              filename: spec.filename
            }))
          );
          
          // Act: Process all images
          const results = await processor.processMultipleImages(images, establishmentId, userId);
          
          // Assert: All metadata IDs should be unique
          const metadataIds = results.map(result => result.metadata.id);
          const uniqueIds = new Set(metadataIds);
          expect(uniqueIds.size).toBe(metadataIds.length);
          
          // All IDs should be valid UUIDs
          metadataIds.forEach(id => {
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(id.length).toBe(36);
          });
          
          // All file paths should be unique
          const webpPaths = results.map(result => result.webpPath);
          const uniquePaths = new Set(webpPaths);
          expect(uniquePaths.size).toBe(webpPaths.length);
          
          // All URLs should be unique
          const webpUrls = results.map(result => result.metadata.webpUrl);
          const uniqueUrls = new Set(webpUrls);
          expect(uniqueUrls.size).toBe(webpUrls.length);
        }
      ),
      { numRuns: 10 } // Reduced runs
    );
  }, 15000); // 15 second timeout

  it('should handle edge cases in filename generation', async () => {
    await fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.constant('no-extension'), // No extension
          fc.constant('.hidden'), // Hidden file
          fc.constant('file.'), // Trailing dot
          fc.constant('file..jpg'), // Double dot
          fc.constant('file with spaces.jpg'), // Spaces
          fc.constant('file@#$%.jpg'), // Special characters
          fc.string({ minLength: 1, maxLength: 10 }).map(s => `${s}.unknown`) // Unknown extension
        ),
        (edgeCaseFilename) => {
          // Act: Generate filename for edge case
          const generated = extractor.generateUniqueFilename(edgeCaseFilename);
          
          // Assert: Should always generate valid UUID-based filename
          expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
          expect(generated.length).toBeGreaterThanOrEqual(36); // UUID is exactly 36 chars, plus extension
          
          // Should have a valid extension (unless input was empty/invalid)
          if (edgeCaseFilename && edgeCaseFilename.includes('.')) {
            expect(generated).toMatch(/\.(jpg|jpeg|png|webp|gif|tiff|bmp)$/);
          } else {
            // For empty or invalid filenames, might just be UUID or UUID with default extension
            expect(generated.length).toBeGreaterThanOrEqual(36);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain uniqueness across concurrent operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `concurrent-${s}.jpg`),
        async (concurrentCount, baseFilename) => {
          // Act: Generate filenames concurrently
          const promises = Array.from({ length: concurrentCount }, () => 
            Promise.resolve(extractor.generateUniqueFilename(baseFilename))
          );
          
          const results = await Promise.all(promises);
          
          // Assert: All results should be unique
          const uniqueResults = new Set(results);
          expect(uniqueResults.size).toBe(results.length);
          
          // All should be valid UUIDs
          results.forEach(result => {
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});