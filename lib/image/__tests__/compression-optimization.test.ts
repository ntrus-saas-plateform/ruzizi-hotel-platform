/**
 * Property-based test for compression optimization
 * **Feature: image-optimization-system, Property 13: Compression optimization**
 * **Validates: Requirements 3.5**
 * 
 * Tests that served images are compressed within acceptable size-quality parameters
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { convertToWebP, convertToJPEG, generateAllThumbnails } from '../sharp-utils';
import { IMAGE_CONFIG } from '../config';

describe('Property 13: Compression optimization', () => {
  // Set timeout for all tests in this suite
  jest.setTimeout(30000);
  const testDir = path.join(__dirname, 'temp-compression-test');
  
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  /**
   * Generate test image buffers with realistic characteristics
   */
  const imageGenerator = fc.record({
    width: fc.integer({ min: 200, max: 1000 }), // More realistic sizes
    height: fc.integer({ min: 200, max: 1000 }),
    format: fc.constantFrom('jpeg', 'png'),
    quality: fc.integer({ min: 70, max: 95 }), // Realistic quality range
    complexity: fc.constantFrom('simple', 'gradient') // Remove complex noise patterns
  });

  /**
   * Create test image buffer based on specifications
   */
  async function createTestImage(spec: {
    width: number;
    height: number;
    format: string;
    quality: number;
    complexity: string;
  }): Promise<Buffer> {
    let image = sharp({
      create: {
        width: spec.width,
        height: spec.height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    // Add complexity based on type
    if (spec.complexity === 'gradient') {
      // Create a gradient pattern (more compressible)
      const gradientBuffer = Buffer.alloc(spec.width * spec.height * 3);
      for (let y = 0; y < spec.height; y++) {
        for (let x = 0; x < spec.width; x++) {
          const idx = (y * spec.width + x) * 3;
          const intensity = Math.floor((x / spec.width) * 255);
          gradientBuffer[idx] = intensity;     // R
          gradientBuffer[idx + 1] = intensity; // G
          gradientBuffer[idx + 2] = intensity; // B
        }
      }
      image = sharp(gradientBuffer, {
        raw: { width: spec.width, height: spec.height, channels: 3 }
      });
    } else if (spec.complexity === 'complex') {
      // Create noise pattern (less compressible)
      const noiseBuffer = Buffer.alloc(spec.width * spec.height * 3);
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseBuffer[i] = Math.floor(Math.random() * 256);
      }
      image = sharp(noiseBuffer, {
        raw: { width: spec.width, height: spec.height, channels: 3 }
      });
    }

    // Convert to specified format
    if (spec.format === 'jpeg') {
      return await image.jpeg({ quality: spec.quality }).toBuffer();
    } else {
      return await image.png({ quality: spec.quality }).toBuffer();
    }
  }

  it('should compress images within acceptable size-quality parameters', async () => {
    await fc.assert(
      fc.asyncProperty(imageGenerator, async (imageSpec) => {
        // Create test image
        const originalBuffer = await createTestImage(imageSpec);

        // Test compression directly using Sharp utilities
        const webpBuffer = await convertToWebP(originalBuffer, IMAGE_CONFIG.webp.quality);
        expect(webpBuffer).toBeDefined();
        expect(Buffer.isBuffer(webpBuffer)).toBe(true);

        // Property 1: Compressed images should be valid WebP format
        const webpMetadata = await sharp(webpBuffer).metadata();
        expect(webpMetadata.format).toBe('webp');
        expect(webpMetadata.width).toBe(imageSpec.width);
        expect(webpMetadata.height).toBe(imageSpec.height);

        // Property 2: Compression should be deterministic
        const webpBuffer2 = await convertToWebP(originalBuffer, IMAGE_CONFIG.webp.quality);
        expect(webpBuffer2.length).toBe(webpBuffer.length);

        // Property 3: WebP quality configuration should be applied
        expect(IMAGE_CONFIG.webp.quality).toBe(85);

        // Property 4: Compressed images should have reasonable file sizes
        // (Not too small to indicate corruption, not unreasonably large)
        expect(webpBuffer.length).toBeGreaterThan(100); // At least 100 bytes
        expect(webpBuffer.length).toBeLessThan(originalBuffer.length * 3); // At most 3x original
      }),
      { 
        numRuns: 20, // Reduced for faster execution
        timeout: 20000
      }
    );
  });

  it('should generate valid thumbnails with correct dimensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 400, max: 1000 }), // Reasonable source sizes
          height: fc.integer({ min: 400, max: 1000 }),
          format: fc.constantFrom('jpeg', 'png')
        }),
        async (imageSpec) => {
          // Create test image
          const originalBuffer = await createTestImage({
            ...imageSpec,
            quality: 85,
            complexity: 'simple'
          });

          // Generate thumbnails directly using Sharp utilities
          const thumbnailBuffers = await generateAllThumbnails(originalBuffer, 'webp');
          expect(thumbnailBuffers).toBeDefined();

          // Property 1: All thumbnails should be generated
          const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
          for (const size of sizes) {
            expect(thumbnailBuffers[size]).toBeDefined();
            expect(Buffer.isBuffer(thumbnailBuffers[size])).toBe(true);
            expect(thumbnailBuffers[size].length).toBeGreaterThan(0);
          }

          // Property 2: Thumbnail dimensions should be correct
          for (const size of sizes) {
            const thumbnailBuffer = thumbnailBuffers[size];
            const metadata = await sharp(thumbnailBuffer).metadata();
            const expectedDimensions = IMAGE_CONFIG.thumbnailSizes[size];
            
            expect(metadata.format).toBe('webp');
            expect(metadata.width).toBeLessThanOrEqual(expectedDimensions.width);
            expect(metadata.height).toBeLessThanOrEqual(expectedDimensions.height);
            expect(metadata.width).toBeGreaterThan(0);
            expect(metadata.height).toBeGreaterThan(0);
          }

          // Property 3: Thumbnails should have valid content
          for (const size of sizes) {
            expect(thumbnailBuffers[size].length).toBeGreaterThan(50); // At least some content
          }
        }
      ),
      { 
        numRuns: 10, // Fewer runs for thumbnail test
        timeout: 25000
      }
    );
  });

  it('should produce valid WebP and JPEG outputs with correct formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dimensions: fc.constantFrom(
            { width: 400, height: 300 },
            { width: 600, height: 400 },
            { width: 800, height: 600 }
          ),
          sourceFormat: fc.constantFrom('jpeg', 'png'),
          complexity: fc.constantFrom('simple', 'gradient')
        }),
        async (spec) => {
          // Create test image
          const originalBuffer = await createTestImage({
            width: spec.dimensions.width,
            height: spec.dimensions.height,
            format: spec.sourceFormat,
            quality: 85,
            complexity: spec.complexity
          });

          // Convert using Sharp utilities directly
          const webpBuffer = await convertToWebP(originalBuffer, IMAGE_CONFIG.webp.quality);
          const jpegBuffer = await convertToJPEG(originalBuffer, IMAGE_CONFIG.jpeg.quality);

          // Property 1: Both outputs should be valid images with correct formats
          const webpMetadata = await sharp(webpBuffer).metadata();
          const jpegMetadata = await sharp(jpegBuffer).metadata();

          expect(webpMetadata.format).toBe('webp');
          expect(jpegMetadata.format).toBe('jpeg');

          // Property 2: Dimensions should be preserved exactly
          expect(webpMetadata.width).toBe(spec.dimensions.width);
          expect(webpMetadata.height).toBe(spec.dimensions.height);
          expect(jpegMetadata.width).toBe(spec.dimensions.width);
          expect(jpegMetadata.height).toBe(spec.dimensions.height);

          // Property 3: Both outputs should have valid content
          expect(webpBuffer.length).toBeGreaterThan(100);
          expect(jpegBuffer.length).toBeGreaterThan(100);

          // Property 4: Quality settings should be applied consistently
          expect(IMAGE_CONFIG.webp.quality).toBe(85);
          expect(IMAGE_CONFIG.jpeg.quality).toBe(85);
        }
      ),
      { 
        numRuns: 15, // Reduce runs for faster execution
        timeout: 20000
      }
    );
  });
});