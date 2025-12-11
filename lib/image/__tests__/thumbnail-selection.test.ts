/**
 * Property-based test for thumbnail size selection
 * **Feature: image-optimization-system, Property 11: Thumbnail size selection**
 * **Validates: Requirements 3.3**
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/images/[id]/thumbnail/[size]/route';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import { ThumbnailSize } from '@/lib/image/types';
import { IImageMetadataDocument } from '@/models/ImageMetadata.model';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import { IMAGE_CONFIG } from '@/lib/image/config';
import { Types } from 'mongoose';

// Mock the dependencies
jest.mock('@/lib/image/image-metadata-store');
jest.mock('@/lib/auth/middleware');

const mockImageMetadataStore = imageMetadataStore as jest.Mocked<typeof imageMetadataStore>;

describe('Property 11: Thumbnail size selection', () => {
  const testDir = path.join(process.cwd(), 'test-uploads');
  
  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
    jest.clearAllMocks();
    
    // Mock authentication to always succeed
    const { authenticateUser } = require('@/lib/auth/middleware');
    authenticateUser.mockResolvedValue({
      success: true,
      user: {
        userId: '507f1f77bcf86cd799439011', // Valid ObjectId
        email: 'test@example.com',
        role: 'manager',
        establishmentId: '507f1f77bcf86cd799439012', // Valid ObjectId
      },
    });
    
    // Mock audit service to prevent ObjectId validation errors
    const AuditService = require('@/services/Audit.service');
    AuditService.log = jest.fn().mockResolvedValue({});
  });
  
  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
    // Clean up uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it('should serve appropriate thumbnail sizes based on context', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random image metadata
        fc.record({
          id: fc.uuid(),
          establishmentId: fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 }).map(arr => 
            arr.map(n => n.toString(16)).join('')
          ),
          originalFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          mimeType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          fileSize: fc.integer({ min: 1000, max: 1000000 }),
          dimensions: fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          uploadedAt: fc.date(),
          uploadedBy: fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 }).map(arr => 
            arr.map(n => n.toString(16)).join('')
          ),
        }),
        // Generate thumbnail size requests
        fc.oneof(
          fc.constant('small'),
          fc.constant('medium'),
          fc.constant('large'),
          fc.constant('xlarge'),
          // Test numeric size mapping
          fc.constant('150'), // Should map to small
          fc.constant('300'), // Should map to medium
          fc.constant('600'), // Should map to large
          fc.constant('1200'), // Should map to xlarge
          fc.constant('100'), // Should map to small (smaller than 150)
          fc.constant('400'), // Should map to large (between 300 and 600)
        ),
        // Generate Accept header variations
        fc.oneof(
          fc.constant('image/webp,image/*,*/*;q=0.8'),
          fc.constant('image/jpeg,image/png,image/*,*/*;q=0.8'),
        ),
        async (baseMetadata, requestedSize, acceptHeader) => {
          // Create complete metadata document mock
          const metadata = {
            _id: new Types.ObjectId(),
            id: baseMetadata.id,
            establishmentId: new Types.ObjectId('507f1f77bcf86cd799439012'),
            originalFilename: baseMetadata.originalFilename,
            mimeType: baseMetadata.mimeType,
            fileSize: baseMetadata.fileSize,
            dimensions: baseMetadata.dimensions,
            webpUrl: `/api/images/${baseMetadata.id}.webp`,
            jpegFallbackUrl: `/api/images/${baseMetadata.id}.jpg`,
            thumbnails: {
              small: {
                path: `test-path/small/${baseMetadata.id}_150x150.webp`,
                width: 150,
                height: 150,
                fileSize: 5000,
              },
              medium: {
                path: `test-path/medium/${baseMetadata.id}_300x300.webp`,
                width: 300,
                height: 300,
                fileSize: 15000,
              },
              large: {
                path: `test-path/large/${baseMetadata.id}_600x400.webp`,
                width: 600,
                height: 400,
                fileSize: 35000,
              },
              xlarge: {
                path: `test-path/xlarge/${baseMetadata.id}_1200x800.webp`,
                width: 1200,
                height: 800,
                fileSize: 85000,
              },
            },
            uploadedAt: baseMetadata.uploadedAt,
            uploadedBy: new Types.ObjectId(baseMetadata.uploadedBy),
            toJSON: jest.fn().mockReturnValue({}),
          } as unknown as IImageMetadataDocument;

          // Mock the metadata store to return our test metadata
          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          // Create test thumbnail files in the expected directory structure
          const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
          const establishmentDir = path.join(uploadsDir, metadata.establishmentId.toString());
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const thumbnailsDir = path.join(establishmentDir, year.toString(), month, 'thumbnails');
          
          // Create all thumbnail directories and files
          for (const [sizeName, sizeInfo] of Object.entries(IMAGE_CONFIG.thumbnailSizes)) {
            const sizeDir = path.join(thumbnailsDir, sizeName);
            await mkdir(sizeDir, { recursive: true });
            
            const webpFile = path.join(sizeDir, `${metadata.id}_${sizeInfo.width}x${sizeInfo.height}.webp`);
            const jpegFile = path.join(sizeDir, `${metadata.id}_${sizeInfo.width}x${sizeInfo.height}.jpg`);
            
            const testImageData = Buffer.from(`test-thumbnail-${sizeName}`);
            await writeFile(webpFile, testImageData);
            await writeFile(jpegFile, testImageData);
          }

          // Create request for the specific thumbnail size
          const request = new NextRequest(`http://localhost/api/images/${metadata.id}/thumbnail/${requestedSize}`, {
            headers: {
              'Accept': acceptHeader,
            },
          });

          // Call the API endpoint
          const response = await GET(request, { params: { id: metadata.id, size: requestedSize } });

          // Verify response is successful
          expect(response.status).toBe(200);

          // Determine expected thumbnail size based on request
          let expectedSize: ThumbnailSize;
          const numericSize = parseInt(requestedSize);
          
          if (!isNaN(numericSize)) {
            // Numeric size mapping
            if (numericSize <= 150) expectedSize = 'small';
            else if (numericSize <= 300) expectedSize = 'medium';
            else if (numericSize <= 600) expectedSize = 'large';
            else expectedSize = 'xlarge';
          } else {
            // Direct size name
            expectedSize = requestedSize as ThumbnailSize;
          }

          // Verify thumbnail size header
          const thumbnailSizeHeader = response.headers.get('X-Thumbnail-Size');
          expect(thumbnailSizeHeader).toBe(expectedSize);

          // Verify original dimensions header
          const originalDimensionsHeader = response.headers.get('X-Original-Dimensions');
          expect(originalDimensionsHeader).toBe(`${metadata.dimensions.width}x${metadata.dimensions.height}`);

          // Verify content type based on Accept header
          const contentType = response.headers.get('Content-Type');
          const supportsWebP = acceptHeader.includes('image/webp');
          
          if (supportsWebP) {
            expect(contentType).toBe('image/webp');
          } else {
            expect(contentType).toBe('image/jpeg');
          }

          // Verify caching headers are present
          const cacheControl = response.headers.get('Cache-Control');
          expect(cacheControl).toContain('max-age=31536000');
          expect(cacheControl).toContain('public');
          expect(cacheControl).toContain('immutable');

          // Verify ETag contains thumbnail size
          const etag = response.headers.get('ETag');
          expect(etag).toBeTruthy();
          expect(etag).toContain(metadata.id);
          expect(etag).toContain(expectedSize);

          // Verify security headers
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid thumbnail sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant('invalid'),
          fc.constant('huge'),
          fc.constant('tiny'),
          fc.constant(''),
          fc.constant('0'),
          fc.constant('-100'),
        ),
        async (imageId, invalidSize) => {
          // Mock metadata store to return valid metadata
          const metadata = {
            _id: new Types.ObjectId(),
            id: imageId,
            establishmentId: new Types.ObjectId(),
            originalFilename: 'test.jpg',
            mimeType: 'image/jpeg',
            fileSize: 100000,
            dimensions: { width: 800, height: 600 },
            webpUrl: `/api/images/${imageId}.webp`,
            jpegFallbackUrl: `/api/images/${imageId}.jpg`,
            thumbnails: {
              small: { path: 'test', width: 150, height: 150, fileSize: 5000 },
              medium: { path: 'test', width: 300, height: 300, fileSize: 15000 },
              large: { path: 'test', width: 600, height: 400, fileSize: 35000 },
              xlarge: { path: 'test', width: 1200, height: 800, fileSize: 85000 },
            },
            uploadedAt: new Date(),
            uploadedBy: new Types.ObjectId(),
            toJSON: jest.fn().mockReturnValue({}),
          } as unknown as IImageMetadataDocument;

          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          const request = new NextRequest(`http://localhost/api/images/${imageId}/thumbnail/${invalidSize}`, {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8',
            },
          });

          const response = await GET(request, { params: { id: imageId, size: invalidSize } });

          // Should return 400 Bad Request for invalid sizes
          expect(response.status).toBe(400);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should serve placeholder thumbnails when files are missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          establishmentId: fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 }).map(arr => 
            arr.map(n => n.toString(16)).join('')
          ),
          originalFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          mimeType: fc.constantFrom('image/jpeg', 'image/png'),
          fileSize: fc.integer({ min: 1000, max: 1000000 }),
          dimensions: fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          uploadedAt: fc.date(),
          uploadedBy: fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 24, maxLength: 24 }).map(arr => 
            arr.map(n => n.toString(16)).join('')
          ),
        }),
        fc.constantFrom('small', 'medium', 'large', 'xlarge'),
        async (baseMetadata, thumbnailSize) => {
          const metadata = {
            _id: new Types.ObjectId(),
            id: baseMetadata.id,
            establishmentId: new Types.ObjectId('507f1f77bcf86cd799439012'),
            originalFilename: baseMetadata.originalFilename,
            mimeType: baseMetadata.mimeType,
            fileSize: baseMetadata.fileSize,
            dimensions: baseMetadata.dimensions,
            webpUrl: `/api/images/${baseMetadata.id}.webp`,
            jpegFallbackUrl: `/api/images/${baseMetadata.id}.jpg`,
            thumbnails: {
              small: { path: 'test', width: 150, height: 150, fileSize: 5000 },
              medium: { path: 'test', width: 300, height: 300, fileSize: 15000 },
              large: { path: 'test', width: 600, height: 400, fileSize: 35000 },
              xlarge: { path: 'test', width: 1200, height: 800, fileSize: 85000 },
            },
            uploadedAt: baseMetadata.uploadedAt,
            uploadedBy: new Types.ObjectId(baseMetadata.uploadedBy),
            toJSON: jest.fn().mockReturnValue({}),
          } as unknown as IImageMetadataDocument;

          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          // Don't create the actual thumbnail files - they should be missing

          const request = new NextRequest(`http://localhost/api/images/${metadata.id}/thumbnail/${thumbnailSize}`, {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8',
            },
          });

          const response = await GET(request, { params: { id: metadata.id, size: thumbnailSize } });

          // Should return placeholder (200 status)
          expect(response.status).toBe(200);
          
          // Should be SVG placeholder
          const contentType = response.headers.get('Content-Type');
          expect(contentType).toBe('image/svg+xml');
          
          // Should have placeholder indicator
          expect(response.headers.get('X-Image-Placeholder')).toBe('true');
          
          // Should have thumbnail size header
          expect(response.headers.get('X-Thumbnail-Size')).toBe(thumbnailSize);
          
          // Should have shorter cache time for placeholders
          const cacheControl = response.headers.get('Cache-Control');
          expect(cacheControl).toContain('max-age=3600');
          
          // Verify the SVG content contains the expected dimensions
          const responseText = await response.text();
          const expectedDimensions = IMAGE_CONFIG.thumbnailSizes[thumbnailSize as ThumbnailSize];
          expect(responseText).toContain(`width="${expectedDimensions.width}"`);
          expect(responseText).toContain(`height="${expectedDimensions.height}"`);
          expect(responseText).toContain(`${expectedDimensions.width}×${expectedDimensions.height}`);
        }
      ),
      { numRuns: 50 }
    );
  });
});
