/**
 * Property-based test for cache header consistency
 * **Feature: image-optimization-system, Property 12: Cache header consistency**
 * **Validates: Requirements 3.4**
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/images/[id]/route';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import { ImageMetadata } from '@/lib/image/types';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';

// Mock the dependencies
jest.mock('@/lib/image/image-metadata-store');
jest.mock('@/lib/auth/middleware');

const mockImageMetadataStore = imageMetadataStore as jest.Mocked<typeof imageMetadataStore>;

describe('Property 12: Cache header consistency', () => {
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

  it('should set 1-year cache headers for all served images', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random image metadata
        fc.record({
          id: fc.uuid(),
          establishmentId: fc.uuid(),
          originalFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          mimeType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          fileSize: fc.integer({ min: 1000, max: 1000000 }),
          dimensions: fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          uploadedAt: fc.date(),
          uploadedBy: fc.uuid(),
        }),
        // Generate Accept header variations
        fc.oneof(
          fc.constant('image/webp,image/*,*/*;q=0.8'),
          fc.constant('image/jpeg,image/png,image/*,*/*;q=0.8'),
        ),
        async (baseMetadata, acceptHeader) => {
          // Create complete metadata with URLs
          const metadata: ImageMetadata = {
            ...baseMetadata,
            establishmentId: '507f1f77bcf86cd799439012', // Match the mocked user's establishment
            webpUrl: `/api/images/${baseMetadata.id}.webp`,
            jpegFallbackUrl: `/api/images/${baseMetadata.id}.jpg`,
            thumbnails: {
              small: {
                path: `test-path/small/${baseMetadata.id}_150x150.webp`,
                url: `/api/images/${baseMetadata.id}/thumbnail/small.webp`,
                width: 150,
                height: 150,
                fileSize: 5000,
              },
              medium: {
                path: `test-path/medium/${baseMetadata.id}_300x300.webp`,
                url: `/api/images/${baseMetadata.id}/thumbnail/medium.webp`,
                width: 300,
                height: 300,
                fileSize: 15000,
              },
              large: {
                path: `test-path/large/${baseMetadata.id}_600x400.webp`,
                url: `/api/images/${baseMetadata.id}/thumbnail/large.webp`,
                width: 600,
                height: 400,
                fileSize: 35000,
              },
              xlarge: {
                path: `test-path/xlarge/${baseMetadata.id}_1200x800.webp`,
                url: `/api/images/${baseMetadata.id}/thumbnail/xlarge.webp`,
                width: 1200,
                height: 800,
                fileSize: 85000,
              },
            },
          };

          // Mock the metadata store to return our test metadata
          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          // Create test image files in the expected directory structure
          const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
          await mkdir(uploadsDir, { recursive: true });
          
          const webpPath = path.join(uploadsDir, `${metadata.id}.webp`);
          const jpegPath = path.join(uploadsDir, `${metadata.id}.jpg`);
          
          // Create minimal valid image data (simple test data)
          const testImageData = Buffer.from('test-image-data');
          await writeFile(webpPath, testImageData);
          await writeFile(jpegPath, testImageData);

          // Create request with the Accept header
          const request = new NextRequest(`http://localhost/api/images/${metadata.id}`, {
            headers: {
              'Accept': acceptHeader,
            },
          });

          // Call the API endpoint
          const response = await GET(request, { params: { id: metadata.id } });

          // Verify response is successful
          expect(response.status).toBe(200);

          // Verify 1-year cache headers are present (31536000 seconds = 1 year)
          const cacheControl = response.headers.get('Cache-Control');
          expect(cacheControl).toBeTruthy();
          expect(cacheControl).toContain('max-age=31536000');
          expect(cacheControl).toContain('public');
          expect(cacheControl).toContain('immutable');

          // Verify ETag is present and properly formatted
          const etag = response.headers.get('ETag');
          expect(etag).toBeTruthy();
          expect(etag).toMatch(/^".*"$/); // Should be quoted
          expect(etag).toContain(metadata.id);
          expect(etag).toContain(metadata.uploadedAt.getTime().toString());

          // Verify Last-Modified header is present and valid
          const lastModified = response.headers.get('Last-Modified');
          expect(lastModified).toBeTruthy();
          expect(lastModified).toBe(metadata.uploadedAt.toUTCString());

          // Verify Expires header is present and set to 1 year from now
          const expires = response.headers.get('Expires');
          expect(expires).toBeTruthy();
          const expiresDate = new Date(expires!);
          const now = new Date();
          const oneYearFromNow = new Date(now.getTime() + 31536000 * 1000);
          
          // Allow for some time difference in test execution (within 1 minute)
          const timeDiff = Math.abs(expiresDate.getTime() - oneYearFromNow.getTime());
          expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference

          // Verify security headers are present
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
          expect(response.headers.get('X-Frame-Options')).toBe('DENY');
          expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');

          // Verify content-specific headers
          expect(response.headers.get('Content-Length')).toBeTruthy();
          expect(response.headers.get('X-Image-Optimized')).toBe('true');
          expect(response.headers.get('X-Image-ID')).toBe(metadata.id);
          expect(response.headers.get('X-Establishment-ID')).toBe(metadata.establishmentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle conditional requests with ETag properly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          establishmentId: fc.uuid(),
          originalFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          mimeType: fc.constantFrom('image/jpeg', 'image/png'),
          fileSize: fc.integer({ min: 1000, max: 1000000 }),
          dimensions: fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          uploadedAt: fc.date(),
          uploadedBy: fc.uuid(),
        }),
        async (baseMetadata) => {
          const metadata: ImageMetadata = {
            ...baseMetadata,
            webpUrl: `/api/images/${baseMetadata.id}.webp`,
            jpegFallbackUrl: `/api/images/${baseMetadata.id}.jpg`,
            thumbnails: {
              small: { path: 'test', url: 'test', width: 150, height: 150, fileSize: 5000 },
              medium: { path: 'test', url: 'test', width: 300, height: 300, fileSize: 15000 },
              large: { path: 'test', url: 'test', width: 600, height: 400, fileSize: 35000 },
              xlarge: { path: 'test', url: 'test', width: 1200, height: 800, fileSize: 85000 },
            },
          };

          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          // Create test image files
          const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
          await mkdir(uploadsDir, { recursive: true });
          
          const webpPath = path.join(uploadsDir, `${metadata.id}.webp`);
          const jpegPath = path.join(uploadsDir, `${metadata.id}.jpg`);
          
          const testImageData = Buffer.from('test-image-data');
          await writeFile(webpPath, testImageData);
          await writeFile(jpegPath, testImageData);

          // First request to get the ETag
          const firstRequest = new NextRequest(`http://localhost/api/images/${metadata.id}`, {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8',
            },
          });

          const firstResponse = await GET(firstRequest, { params: { id: metadata.id } });
          expect(firstResponse.status).toBe(200);
          
          const etag = firstResponse.headers.get('ETag');
          expect(etag).toBeTruthy();

          // Second request with If-None-Match header
          const secondRequest = new NextRequest(`http://localhost/api/images/${metadata.id}`, {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8',
              'If-None-Match': etag!,
            },
          });

          const secondResponse = await GET(secondRequest, { params: { id: metadata.id } });

          // Should return 304 Not Modified
          expect(secondResponse.status).toBe(304);
          expect(secondResponse.headers.get('ETag')).toBe(etag);
          expect(secondResponse.headers.get('Cache-Control')).toContain('max-age=31536000');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set shorter cache headers for placeholder images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          establishmentId: fc.uuid(),
          originalFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          mimeType: fc.constantFrom('image/jpeg', 'image/png'),
          fileSize: fc.integer({ min: 1000, max: 1000000 }),
          dimensions: fc.record({
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          uploadedAt: fc.date(),
          uploadedBy: fc.uuid(),
        }),
        async (baseMetadata) => {
          const metadata: ImageMetadata = {
            ...baseMetadata,
            webpUrl: `/api/images/${baseMetadata.id}.webp`,
            jpegFallbackUrl: `/api/images/${baseMetadata.id}.jpg`,
            thumbnails: {
              small: { path: 'test', url: 'test', width: 150, height: 150, fileSize: 5000 },
              medium: { path: 'test', url: 'test', width: 300, height: 300, fileSize: 15000 },
              large: { path: 'test', url: 'test', width: 600, height: 400, fileSize: 35000 },
              xlarge: { path: 'test', url: 'test', width: 1200, height: 800, fileSize: 85000 },
            },
          };

          mockImageMetadataStore.findById.mockResolvedValue(metadata);

          // Don't create the actual image files - they should be missing

          const request = new NextRequest(`http://localhost/api/images/${metadata.id}`, {
            headers: {
              'Accept': 'image/webp,image/*,*/*;q=0.8',
            },
          });

          const response = await GET(request, { params: { id: metadata.id } });

          // Should return placeholder (200 status)
          expect(response.status).toBe(200);
          
          // Should have placeholder indicator
          expect(response.headers.get('X-Image-Placeholder')).toBe('true');
          
          // Should have shorter cache time for placeholders (3600 seconds = 1 hour)
          const cacheControl = response.headers.get('Cache-Control');
          expect(cacheControl).toBeTruthy();
          expect(cacheControl).toContain('max-age=3600');
          expect(cacheControl).toContain('public');
          
          // Should still have security headers
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
        }
      ),
      { numRuns: 50 }
    );
  });
});
