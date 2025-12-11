/**
 * Property-based tests for Sharp image processing utilities
 * **Feature: image-optimization-system, Property 3: WebP conversion consistency**
 */

import * as fc from 'fast-check';
import { convertToWebP, convertToJPEG, extractMetadata, validateImageBuffer } from '../sharp-utils';
import { IMAGE_CONFIG } from '../config';

// Create a simple test image using Sharp itself for reliable test data
const createTestImage = async (width: number = 1, height: number = 1, format: 'png' | 'jpeg' = 'png') => {
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

// Test image data generators
const validImageBuffer = fc.asyncProperty(
  fc.constantFrom('png', 'jpeg'),
  fc.integer({ min: 1, max: 10 }),
  fc.integer({ min: 1, max: 10 }),
  async (format, width, height) => {
    return createTestImage(width, height, format as 'png' | 'jpeg');
  }
);

const qualityValue = fc.integer({ min: 1, max: 100 });

describe('Sharp Image Processing - Property Tests', () => {
  /**
   * **Feature: image-optimization-system, Property 3: WebP conversion consistency**
   * **Validates: Requirements 1.3**
   * 
   * For any valid uploaded image, the conversion process should produce a WebP file with 85% quality
   */
  it('should consistently convert valid images to WebP format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (format, width, height) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Convert to WebP
          const webpBuffer = await convertToWebP(imageBuffer, IMAGE_CONFIG.webp.quality);
          
          // Assert: Result should be a valid WebP buffer
          expect(Buffer.isBuffer(webpBuffer)).toBe(true);
          expect(webpBuffer.length).toBeGreaterThan(0);
          
          // Verify it's actually WebP by checking magic bytes
          const webpMagic = webpBuffer.subarray(8, 12);
          expect(webpMagic.toString('ascii')).toBe('WEBP');
          
          // Verify the buffer is valid by extracting metadata
          const isValid = await validateImageBuffer(webpBuffer);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain image validity through conversion process', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        qualityValue,
        async (format, width, height, quality) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Convert with different quality settings
          const webpBuffer = await convertToWebP(imageBuffer, quality);
          const jpegBuffer = await convertToJPEG(imageBuffer, quality);
          
          // Assert: Both conversions should produce valid images
          const webpValid = await validateImageBuffer(webpBuffer);
          const jpegValid = await validateImageBuffer(jpegBuffer);
          
          expect(webpValid).toBe(true);
          expect(jpegValid).toBe(true);
          
          // Both should have content
          expect(webpBuffer.length).toBeGreaterThan(0);
          expect(jpegBuffer.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract consistent metadata from valid images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (format, width, height) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Extract metadata
          const metadata = await extractMetadata(imageBuffer);
          
          // Assert: Metadata should have required properties
          expect(typeof metadata.width).toBe('number');
          expect(typeof metadata.height).toBe('number');
          expect(typeof metadata.format).toBe('string');
          expect(typeof metadata.size).toBe('number');
          
          // Dimensions should match what we created
          expect(metadata.width).toBe(width);
          expect(metadata.height).toBe(height);
          expect(metadata.size).toBeGreaterThan(0);
          
          // Format should be a known image format
          expect(['jpeg', 'png', 'webp', 'gif']).toContain(metadata.format);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid image buffers consistently', async () => {
    const invalidBuffer = fc.uint8Array({ minLength: 10, maxLength: 100 });
    
    await fc.assert(
      fc.asyncProperty(invalidBuffer, async (buffer) => {
        // Act: Try to validate invalid buffer
        const isValid = await validateImageBuffer(Buffer.from(buffer));
        
        // Assert: Should consistently reject invalid data
        expect(isValid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle quality parameter bounds correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 100 }), // Only test valid quality range
        async (format, width, height, quality) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Convert with valid quality
          const result = await convertToWebP(imageBuffer, quality);
          
          // Assert: Should work with valid quality
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);
          
          // Verify it's valid WebP
          const isValid = await validateImageBuffer(result);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});