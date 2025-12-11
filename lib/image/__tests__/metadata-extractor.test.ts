/**
 * Property-based tests for MetadataExtractor service
 * **Feature: image-optimization-system, Property 9: Metadata completeness**
 */

import * as fc from 'fast-check';
import { MetadataExtractor } from '../metadata-extractor';
import { ThumbnailSet } from '../types';

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

// Create mock thumbnail set for testing
const createMockThumbnailSet = (baseId: string): ThumbnailSet => ({
  small: {
    path: `/uploads/images/test/${baseId}_150x150.webp`,
    url: `/api/images/${baseId}/thumbnail/small`,
    width: 150,
    height: 150,
    fileSize: 1024
  },
  medium: {
    path: `/uploads/images/test/${baseId}_300x300.webp`,
    url: `/api/images/${baseId}/thumbnail/medium`,
    width: 300,
    height: 300,
    fileSize: 2048
  },
  large: {
    path: `/uploads/images/test/${baseId}_600x400.webp`,
    url: `/api/images/${baseId}/thumbnail/large`,
    width: 600,
    height: 400,
    fileSize: 4096
  },
  xlarge: {
    path: `/uploads/images/test/${baseId}_1200x800.webp`,
    url: `/api/images/${baseId}/thumbnail/xlarge`,
    width: 1200,
    height: 800,
    fileSize: 8192
  }
});

describe('MetadataExtractor - Property Tests', () => {
  let extractor: MetadataExtractor;

  beforeEach(() => {
    extractor = new MetadataExtractor();
  });

  /**
   * **Feature: image-optimization-system, Property 9: Metadata completeness**
   * **Validates: Requirements 2.5**
   * 
   * For any stored image, the metadata should include original filename, file size, dimensions, and creation date
   */
  it('should extract complete metadata with all required fields for any valid image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 100, max: 500 }),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => `image-${s}.jpg`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `establishment-${s}`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `user-${s}`),
        async (format, width, height, filename, establishmentId, userId) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          const mockThumbnails = createMockThumbnailSet('test-id');
          const webpUrl = '/api/images/test-id.webp';
          const jpegUrl = '/api/images/test-id.jpg';
          
          // Act: Extract metadata
          const metadata = await extractor.extractImageMetadata(
            imageBuffer,
            filename,
            establishmentId,
            userId,
            webpUrl,
            jpegUrl,
            mockThumbnails
          );
          
          // Assert: All required fields should be present and valid
          expect(metadata.id).toBeDefined();
          expect(typeof metadata.id).toBe('string');
          expect(metadata.id.length).toBeGreaterThan(0);
          
          expect(metadata.establishmentId).toBe(establishmentId);
          expect(metadata.originalFilename).toBe(filename);
          expect(metadata.uploadedBy).toBe(userId);
          
          // File size should be positive
          expect(metadata.fileSize).toBeGreaterThan(0);
          expect(typeof metadata.fileSize).toBe('number');
          
          // Dimensions should match the created image
          expect(metadata.dimensions.width).toBe(width);
          expect(metadata.dimensions.height).toBe(height);
          expect(metadata.dimensions.width).toBeGreaterThan(0);
          expect(metadata.dimensions.height).toBeGreaterThan(0);
          
          // MIME type should be valid
          expect(metadata.mimeType).toBeDefined();
          expect(metadata.mimeType).toMatch(/^image\//);
          
          // URLs should be provided
          expect(metadata.webpUrl).toBe(webpUrl);
          expect(metadata.jpegFallbackUrl).toBe(jpegUrl);
          
          // Thumbnails should be complete
          expect(metadata.thumbnails).toBe(mockThumbnails);
          
          // Upload date should be recent
          expect(metadata.uploadedAt).toBeInstanceOf(Date);
          expect(metadata.uploadedAt.getTime()).toBeLessThanOrEqual(Date.now());
          expect(metadata.uploadedAt.getTime()).toBeGreaterThan(Date.now() - 5000); // Within 5 seconds
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique filenames for any input', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `file-${s}.jpg`),
          { minLength: 10, maxLength: 100 }
        ),
        (filenames) => {
          // Act: Generate unique filenames
          const generatedNames = filenames.map(filename => 
            extractor.generateUniqueFilename(filename)
          );
          
          // Assert: All generated names should be unique
          const uniqueNames = new Set(generatedNames);
          expect(uniqueNames.size).toBe(generatedNames.length);
          
          // All should contain UUID pattern (36 characters with hyphens)
          generatedNames.forEach(name => {
            expect(name).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract basic image information consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('png', 'jpeg'),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 300 }),
        async (format, width, height) => {
          // Arrange: Create test image
          const imageBuffer = await createTestImage(width, height, format as 'png' | 'jpeg');
          
          // Act: Extract basic info
          const info = await extractor.extractBasicInfo(imageBuffer);
          
          // Assert: Basic info should be accurate
          expect(info.width).toBe(width);
          expect(info.height).toBe(height);
          expect(info.format).toBeDefined();
          expect(info.size).toBeGreaterThan(0);
          expect(typeof info.hasAlpha).toBe('boolean');
          expect(info.channels).toBeGreaterThan(0);
          
          // Format should match expected
          if (format === 'png') {
            expect(info.format).toBe('png');
          } else {
            expect(info.format).toBe('jpeg');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate metadata completeness correctly', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `id-${s}`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `est-${s}`),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => `file-${s}.jpg`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `user-${s}`),
        fc.integer({ min: 1, max: 10000000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 5000 }),
        (id, establishmentId, filename, userId, fileSize, width, height) => {
          // Arrange: Create complete metadata
          const mockThumbnails = createMockThumbnailSet(id);
          const completeMetadata = extractor.createMetadataFromExisting(
            id,
            establishmentId,
            filename,
            fileSize,
            { width, height },
            'jpeg',
            userId,
            `/api/images/${id}.webp`,
            `/api/images/${id}.jpg`,
            mockThumbnails
          );
          
          // Act: Validate complete metadata
          const validation = extractor.validateMetadata(completeMetadata);
          
          // Assert: Should be valid
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect incomplete metadata', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `id-${s}`),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `est-${s}`),
        (id, establishmentId) => {
          // Arrange: Create incomplete metadata (missing required fields)
          const incompleteMetadata = {
            id,
            establishmentId,
            originalFilename: '', // Empty filename should be invalid
            mimeType: 'image/jpeg',
            fileSize: 0, // Zero file size should be invalid
            dimensions: { width: 0, height: 0 }, // Zero dimensions should be invalid
            webpUrl: '',
            jpegFallbackUrl: '',
            thumbnails: {} as any, // Empty thumbnails should be invalid
            uploadedAt: new Date(),
            uploadedBy: ''
          };
          
          // Act: Validate incomplete metadata
          const validation = extractor.validateMetadata(incompleteMetadata);
          
          // Assert: Should be invalid with errors
          expect(validation.isValid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
          
          // Should detect specific issues
          expect(validation.errors.some(error => error.includes('filename'))).toBe(true);
          expect(validation.errors.some(error => error.includes('file size'))).toBe(true);
          expect(validation.errors.some(error => error.includes('width') || error.includes('height'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});