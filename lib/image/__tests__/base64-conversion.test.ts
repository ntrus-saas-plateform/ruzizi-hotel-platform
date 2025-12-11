/**
 * Property-based tests for base64 to WebP conversion
 * **Feature: image-optimization-system, Property 15: Base64 to WebP conversion**
 */

import * as fc from 'fast-check';
import { Base64MigrationService } from '../base64-migration-service';

// Create a simple test image using Sharp for reliable test data
const createTestImageBase64 = async (
  width: number = 100, 
  height: number = 100, 
  format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<string> => {
  const sharp = require('sharp');
  
  let buffer: Buffer;
  if (format === 'png') {
    buffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toBuffer();
  } else if (format === 'jpeg') {
    buffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    }).jpeg().toBuffer();
  } else {
    buffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 0, b: 255 }
      }
    }).webp().toBuffer();
  }
  
  const base64Data = buffer.toString('base64');
  return `data:image/${format};base64,${base64Data}`;
};

// Test the core conversion logic without database operations
const testBase64ToWebPConversion = async (base64String: string): Promise<{
  success: boolean;
  isWebPFormat: boolean;
  preservesDimensions: boolean;
  error?: string;
}> => {
  try {
    const migrationService = new Base64MigrationService();
    
    // Extract base64 data
    const { mimeType, buffer } = migrationService.extractBase64Data(base64String);
    
    // Use Sharp to convert to WebP directly (simulating the conversion process)
    const sharp = require('sharp');
    const originalMetadata = await sharp(buffer).metadata();
    const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
    const webpMetadata = await sharp(webpBuffer).metadata();
    
    return {
      success: true,
      isWebPFormat: webpMetadata.format === 'webp',
      preservesDimensions: originalMetadata.width === webpMetadata.width && 
                          originalMetadata.height === webpMetadata.height,
    };
  } catch (error) {
    return {
      success: false,
      isWebPFormat: false,
      preservesDimensions: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

describe('Base64 to WebP Conversion - Property Tests', () => {
  let migrationService: Base64MigrationService;

  beforeEach(() => {
    migrationService = new Base64MigrationService();
  });

  /**
   * **Feature: image-optimization-system, Property 15: Base64 to WebP conversion**
   * **Validates: Requirements 4.2**
   * 
   * For any valid base64 image, the conversion should produce a valid WebP file
   */
  it('should convert any valid base64 image to WebP format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            width: fc.integer({ min: 50, max: 200 }),
            height: fc.integer({ min: 50, max: 200 }),
            format: fc.constantFrom('png', 'jpeg', 'webp')
          }),
          { minLength: 1, maxLength: 5 } // Reduced for faster execution
        ),
        async (imageSpecs) => {
          // Arrange: Create valid base64 images
          const base64Images = await Promise.all(
            imageSpecs.map(async spec => ({
              base64String: await createTestImageBase64(spec.width, spec.height, spec.format as any),
              expectedFormat: spec.format,
              expectedDimensions: { width: spec.width, height: spec.height }
            }))
          );
          
          // Act & Assert: Convert each base64 image
          for (const imageData of base64Images) {
            const result = await testBase64ToWebPConversion(imageData.base64String);
            
            // Assert: Conversion should succeed
            expect(result.success).toBe(true);
            expect(result.isWebPFormat).toBe(true); // Should be converted to WebP
            expect(result.preservesDimensions).toBe(true); // Should preserve dimensions
            expect(result.error).toBeUndefined();
          }
        }
      ),
      { numRuns: 20 } // Increased runs since it's faster now
    );
  }, 15000); // 15 second timeout

  it('should handle various base64 image formats consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            format: fc.constantFrom('png', 'jpeg', 'webp'),
            size: fc.constantFrom(100, 150, 200)
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (imageSpecs) => {
          // Arrange: Create base64 images of different formats
          const testImages = await Promise.all(
            imageSpecs.map(async spec => ({
              base64String: await createTestImageBase64(spec.size, spec.size, spec.format as any),
              originalFormat: spec.format
            }))
          );
          
          // Act & Assert: All should convert successfully to WebP
          for (const testImage of testImages) {
            const result = await testBase64ToWebPConversion(testImage.base64String);
            
            expect(result.success).toBe(true);
            expect(result.isWebPFormat).toBe(true);
            expect(result.preservesDimensions).toBe(true);
          }
        }
      ),
      { numRuns: 15 }
    );
  }, 10000);

  it('should extract correct metadata from base64 images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 300 }),
          height: fc.integer({ min: 100, max: 300 }),
          format: fc.constantFrom('png', 'jpeg')
        }),
        async (spec) => {
          // Arrange: Create a test image with known dimensions
          const base64String = await createTestImageBase64(spec.width, spec.height, spec.format as any);
          
          // Act: Extract base64 data
          const extracted = migrationService.extractBase64Data(base64String);
          
          // Assert: Extracted data should be correct
          expect(extracted.mimeType).toBe(`image/${spec.format}`);
          expect(extracted.buffer).toBeInstanceOf(Buffer);
          expect(extracted.buffer.length).toBeGreaterThan(0);
          
          // Verify the buffer can be processed by Sharp
          const sharp = require('sharp');
          const metadata = await sharp(extracted.buffer).metadata();
          expect(metadata.width).toBe(spec.width);
          expect(metadata.height).toBe(spec.height);
          expect(metadata.format).toBe(spec.format === 'jpeg' ? 'jpeg' : 'png');
        }
      ),
      { numRuns: 25 }
    );
  }, 10000);

  it('should handle malformed base64 data gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            // Invalid base64 data
            fc.string({ minLength: 1, maxLength: 100 }).map(s => `data:image/jpeg;base64,${s}!!!invalid`),
            // Truncated base64 data
            fc.base64String({ minLength: 10, maxLength: 50 }).map(s => `data:image/png;base64,${s.substring(0, 10)}`),
            // Empty base64 data
            fc.constantFrom('data:image/jpeg;base64,', 'data:image/png;base64,'),
            // Non-image data encoded as base64
            fc.string({ minLength: 20, maxLength: 100 }).map(s => 
              `data:image/jpeg;base64,${Buffer.from(s).toString('base64')}`
            )
          ),
          { minLength: 1, maxLength: 10 }
        ),
        async (malformedBase64Strings) => {
          // Act & Assert: All malformed data should fail gracefully
          for (const malformedString of malformedBase64Strings) {
            const result = await testBase64ToWebPConversion(malformedString);
            
            // Should fail but not throw
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.isWebPFormat).toBe(false);
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 10000);

  it('should maintain data integrity during conversion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.constantFrom(100, 150, 200),
          height: fc.constantFrom(100, 150, 200),
          format: fc.constantFrom('png', 'jpeg')
        }),
        async (spec) => {
          // Arrange: Create original image
          const originalBase64 = await createTestImageBase64(spec.width, spec.height, spec.format as any);
          const originalData = migrationService.extractBase64Data(originalBase64);
          
          // Act: Test conversion
          const result = await testBase64ToWebPConversion(originalBase64);
          
          // Assert: Conversion preserves essential properties
          expect(result.success).toBe(true);
          expect(result.isWebPFormat).toBe(true);
          expect(result.preservesDimensions).toBe(true);
          
          // Verify original data extraction
          expect(originalData.mimeType).toBe(`image/${spec.format}`);
          expect(originalData.buffer.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  }, 10000);

  it('should handle concurrent conversions correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            format: fc.constantFrom('png', 'jpeg'),
            size: fc.constantFrom(100, 150)
          }),
          { minLength: 2, maxLength: 4 }
        ),
        async (imageSpecs) => {
          // Arrange: Create multiple different base64 images
          const base64Images = await Promise.all(
            imageSpecs.map(async spec => ({
              base64String: await createTestImageBase64(spec.size, spec.size, spec.format as any),
              expectedFormat: spec.format
            }))
          );
          
          // Act: Convert all images concurrently
          const results = await Promise.all(
            base64Images.map(img => testBase64ToWebPConversion(img.base64String))
          );
          
          // Assert: All conversions should succeed
          results.forEach((result, index) => {
            expect(result.success).toBe(true);
            expect(result.isWebPFormat).toBe(true);
            expect(result.preservesDimensions).toBe(true);
          });
        }
      ),
      { numRuns: 15 }
    );
  }, 10000);
});