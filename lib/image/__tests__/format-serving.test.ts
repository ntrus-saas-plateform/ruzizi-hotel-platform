/**
 * Property-based test for format serving based on browser support
 * **Feature: image-optimization-system, Property 10: Format serving based on browser support**
 * **Validates: Requirements 3.1, 3.2**
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

describe('Property 10: Format serving based on browser support', () => {
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

  it('should serve WebP for modern browsers and JPEG for older browsers', async () => {
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
          fc.constant('image/webp,image/*,*/*;q=0.8'), // Modern browser supporting WebP
          fc.constant('image/jpeg,image/png,image/*,*/*;q=0.8'), // Older browser without WebP
          fc.constant('image/*,*/*;q=0.8'), // Generic image support
          fc.constant('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), // No image preference
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

          // Check format selection based on Accept header
          const contentType = response.headers.get('Content-Type');
          const supportsWebP = acceptHeader.includes('image/webp');

          if (supportsWebP) {
            // Modern browsers should get WebP
            expect(contentType).toBe('image/webp');
          } else {
            // Older browsers should get JPEG fallback
            expect(contentType).toBe('image/jpeg');
          }

          // Verify caching headers are present
          expect(response.headers.get('Cache-Control')).toContain('max-age=31536000');
          expect(response.headers.get('ETag')).toBeTruthy();
          expect(response.headers.get('Last-Modified')).toBeTruthy();

          // Verify security headers
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle missing images gracefully with placeholder', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.constant('image/webp,image/*,*/*;q=0.8'),
          fc.constant('image/jpeg,image/png,image/*,*/*;q=0.8'),
        ),
        async (imageId, acceptHeader) => {
          // Mock metadata store to return null (image not found)
          mockImageMetadataStore.findById.mockResolvedValue(null);

          const request = new NextRequest(`http://localhost/api/images/${imageId}`, {
            headers: {
              'Accept': acceptHeader,
            },
          });

          const response = await GET(request, { params: { id: imageId } });

          // Should return 404 for missing images
          expect(response.status).toBe(404);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should serve placeholder when image files are missing but metadata exists', async () => {
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
          
          // Should be SVG placeholder or JPEG placeholder
          const contentType = response.headers.get('Content-Type');
          expect(contentType).toMatch(/^image\/(svg\+xml|jpeg)$/);
          
          // Should have placeholder indicator
          expect(response.headers.get('X-Image-Placeholder')).toBe('true');
        }
      ),
      { numRuns: 50 }
    );
  });
});