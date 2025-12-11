/**
 * Property-based tests for base64 image identification
 * **Feature: image-optimization-system, Property 14: Base64 image identification**
 */

import * as fc from 'fast-check';
import { Base64MigrationService } from '../base64-migration-service';

describe('Base64 Image Identification - Property Tests', () => {
  let migrationService: Base64MigrationService;

  beforeEach(() => {
    migrationService = new Base64MigrationService();
  });

  /**
   * **Feature: image-optimization-system, Property 14: Base64 image identification**
   * **Validates: Requirements 4.1**
   * 
   * For any database scan, the system should correctly identify all base64 image strings
   */
  it('should correctly identify valid base64 image strings', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'),
            base64Data: fc.base64String({ minLength: 100, maxLength: 1000 })
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (imageSpecs) => {
          // Arrange: Create valid base64 image strings
          const validBase64Images = imageSpecs.map(spec => 
            `data:image/${spec.mimeType};base64,${spec.base64Data}`
          );
          
          // Act: Test identification for each valid base64 string
          validBase64Images.forEach(base64String => {
            const isIdentified = migrationService.isBase64Image(base64String);
            
            // Assert: Should correctly identify as base64 image
            expect(isIdentified).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly reject non-base64 image strings', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // Regular URLs
            fc.webUrl(),
            // File paths
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `/path/to/${s}.jpg`),
            // Random strings
            fc.string({ minLength: 1, maxLength: 200 }),
            // Invalid data URLs
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `data:text/plain;base64,${s}`),
            // Malformed data URLs
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `data:image/${s}`),
            // Empty or null values
            fc.constantFrom('', null, undefined),
            // Numbers and other types
            fc.integer().map(n => n.toString()),
            fc.boolean().map(b => b.toString())
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (nonBase64Strings) => {
          // Act & Assert: Test identification for each non-base64 string
          nonBase64Strings.forEach(testString => {
            const isIdentified = migrationService.isBase64Image(testString as string);
            
            // Should correctly reject as not base64 image
            expect(isIdentified).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases in base64 identification', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // Malformed data URLs
            fc.constantFrom(
              'data:image/',
              'data:image/jpeg',
              'data:image/jpeg;',
              'data:image/jpeg;base64',
              'data:image/jpeg;base64,',
              'data:image/;base64,validdata',
              'data:image/jpeg;charset=utf-8;base64,validdata',
              'DATA:IMAGE/JPEG;BASE64,validdata', // Wrong case
              'data:video/mp4;base64,validdata', // Wrong media type
              'data:application/pdf;base64,validdata' // Wrong media type
            ),
            // Very long strings
            fc.base64String({ minLength: 10000, maxLength: 50000 }).map(s => `data:image/jpeg;base64,${s}`),
            // Unicode and special characters in MIME type
            fc.string({ minLength: 1, maxLength: 20 }).map(s => `data:image/${s};base64,validdata`)
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (edgeCaseStrings) => {
          // Act & Assert: Test identification for edge cases
          edgeCaseStrings.forEach(testString => {
            const isIdentified = migrationService.isBase64Image(testString);
            
            // Only properly formatted data:image/ URLs should be identified
            const isValidFormat = testString && 
              typeof testString === 'string' && 
              /^data:image\/[a-zA-Z0-9+\-.]+;base64,/.test(testString) &&
              testString.split(';base64,')[1]?.length > 0;
            
            expect(isIdentified).toBe(!!isValidFormat);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly extract base64 data from valid strings', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mimeSubtype: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
            base64Data: fc.base64String({ minLength: 100, maxLength: 1000 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (imageSpecs) => {
          // Arrange: Create valid base64 image strings
          const testCases = imageSpecs.map(spec => ({
            base64String: `data:image/${spec.mimeSubtype};base64,${spec.base64Data}`,
            expectedMimeType: `image/${spec.mimeSubtype}`,
            expectedData: spec.base64Data
          }));
          
          // Act & Assert: Extract data from each valid base64 string
          testCases.forEach(testCase => {
            // First verify it's identified as base64
            expect(migrationService.isBase64Image(testCase.base64String)).toBe(true);
            
            // Then extract the data
            const extracted = migrationService.extractBase64Data(testCase.base64String);
            
            // Verify extracted data
            expect(extracted.mimeType).toBe(testCase.expectedMimeType);
            expect(extracted.buffer).toBeInstanceOf(Buffer);
            expect(extracted.buffer.length).toBeGreaterThan(0);
            
            // Verify the buffer contains the correct base64 decoded data
            // Note: Base64 padding might differ, so we decode and re-encode to normalize
            const originalBuffer = Buffer.from(testCase.expectedData, 'base64');
            expect(extracted.buffer.equals(originalBuffer)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed arrays of base64 and non-base64 strings', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // Valid base64 images
            fc.record({
              mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
              base64Data: fc.base64String({ minLength: 50, maxLength: 200 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            // Non-base64 strings
            fc.webUrl(),
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `/images/${s}.jpg`),
            fc.string({ minLength: 1, maxLength: 100 })
          ),
          { minLength: 5, maxLength: 50 }
        ),
        (mixedStrings) => {
          // Act: Identify base64 images in mixed array
          const identificationResults = mixedStrings.map(str => ({
            original: str,
            isBase64: migrationService.isBase64Image(str)
          }));
          
          // Assert: Verify correct identification
          identificationResults.forEach(result => {
            const shouldBeBase64 = result.original && 
              typeof result.original === 'string' && 
              /^data:image\/[a-zA-Z0-9+\-.]+;base64,/.test(result.original) &&
              result.original.split(';base64,')[1]?.length > 0;
            
            expect(result.isBase64).toBe(!!shouldBeBase64);
          });
          
          // Count should match manual filtering
          const manualCount = mixedStrings.filter(str => 
            str && typeof str === 'string' && 
            /^data:image\/[a-zA-Z0-9+\-.]+;base64,/.test(str) &&
            str.split(';base64,')[1]?.length > 0
          ).length;
          
          const identifiedCount = identificationResults.filter(r => r.isBase64).length;
          expect(identifiedCount).toBe(manualCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent identification across multiple calls', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // Valid base64 images
            fc.record({
              mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
              base64Data: fc.base64String({ minLength: 100, maxLength: 500 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            // Invalid strings
            fc.webUrl(),
            fc.string({ minLength: 1, maxLength: 100 })
          ),
          { minLength: 1, maxLength: 30 }
        ),
        fc.integer({ min: 2, max: 10 }),
        (testStrings, repeatCount) => {
          // Act: Test identification multiple times for each string
          testStrings.forEach(testString => {
            const results = Array.from({ length: repeatCount }, () => 
              migrationService.isBase64Image(testString)
            );
            
            // Assert: All results should be identical
            const firstResult = results[0];
            results.forEach(result => {
              expect(result).toBe(firstResult);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify base64 images with various MIME subtypes', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            // Include both common and less common image MIME subtypes
            mimeSubtype: fc.constantFrom(
              'jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif',
              'svg+xml', 'x-icon', 'vnd.microsoft.icon'
            ),
            base64Data: fc.base64String({ minLength: 50, maxLength: 200 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (imageSpecs) => {
          // Arrange: Create base64 strings with various MIME subtypes
          const base64Strings = imageSpecs.map(spec => 
            `data:image/${spec.mimeSubtype};base64,${spec.base64Data}`
          );
          
          // Act & Assert: All should be identified as base64 images
          base64Strings.forEach(base64String => {
            const isIdentified = migrationService.isBase64Image(base64String);
            expect(isIdentified).toBe(true);
            
            // Should also be able to extract data
            const extracted = migrationService.extractBase64Data(base64String);
            expect(extracted.mimeType).toMatch(/^image\//);
            expect(extracted.buffer).toBeInstanceOf(Buffer);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle concurrent identification operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            // Valid base64 images
            fc.record({
              mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
              base64Data: fc.base64String({ minLength: 100, maxLength: 300 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            // Invalid strings
            fc.webUrl(),
            fc.string({ minLength: 1, maxLength: 50 })
          ),
          { minLength: 5, maxLength: 20 }
        ),
        async (testStrings) => {
          // Act: Perform concurrent identification
          const promises = testStrings.map(str => 
            Promise.resolve(migrationService.isBase64Image(str))
          );
          
          const results = await Promise.all(promises);
          
          // Assert: Results should match sequential processing
          const sequentialResults = testStrings.map(str => 
            migrationService.isBase64Image(str)
          );
          
          expect(results).toEqual(sequentialResults);
          
          // Verify correctness of each result
          results.forEach((result, index) => {
            const testString = testStrings[index];
            const shouldBeBase64 = testString && 
              typeof testString === 'string' && 
              /^data:image\/[a-zA-Z0-9+\-.]+;base64,/.test(testString) &&
              testString.split(';base64,')[1]?.length > 0;
            
            expect(result).toBe(!!shouldBeBase64);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});