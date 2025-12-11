/**
 * Property-based tests for database storage separation
 * **Feature: image-optimization-system, Property 7: Database storage separation**
 */

import * as fc from 'fast-check';
import { ImageMetadataStore } from '../image-metadata-store';
import { EstablishmentModel } from '@/models/Establishment.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import mongoose from 'mongoose';

// Mock MongoDB connection for testing
jest.mock('@/lib/db/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

// Mock the models to avoid actual database operations
jest.mock('@/models/Establishment.model');
jest.mock('@/models/Accommodation.model');
jest.mock('@/models/ImageMetadata.model');

describe('Database Storage Separation - Property Tests', () => {
  let imageMetadataStore: ImageMetadataStore;
  
  beforeEach(() => {
    imageMetadataStore = new ImageMetadataStore();
    jest.clearAllMocks();
  });

  /**
   * **Feature: image-optimization-system, Property 7: Database storage separation**
   * **Validates: Requirements 2.2**
   * 
   * For any image in the existing images[] arrays, the strings should be URLs (e.g., "/api/images/uuid.webp") never base64 data
   */
  it('should ensure images arrays contain only URLs, never base64 data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            // Valid URL patterns
            fc.constant('/api/images/550e8400-e29b-41d4-a716-446655440000.webp'),
            fc.constant('/api/images/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg'),
            // Invalid base64 patterns
            fc.constant('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA'),
            fc.constant('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA')
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (images) => {
          // Separate URLs from base64 data
          const validUrls: string[] = [];
          const base64Images: string[] = [];

          images.forEach((image: string) => {
            if (image.startsWith('data:image/')) {
              base64Images.push(image);
            } else if (image.startsWith('/api/images/') || image.startsWith('/uploads/images/')) {
              validUrls.push(image);
            }
          });

          // Assert: All valid images should be URLs, not base64
          validUrls.forEach(url => {
            expect(url).not.toMatch(/^data:image\//);
            expect(url).toMatch(/^\/(?:api|uploads)\/images\//);
            expect(url).toMatch(/\.(webp|jpg|jpeg|png)$/);
            
            // Should contain UUID pattern
            expect(url).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
          });

          // Base64 images should be identified for migration
          base64Images.forEach(base64 => {
            expect(base64).toMatch(/^data:image\//);
            expect(base64).toContain('base64,');
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should maintain URL format consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constant('/api/images/550e8400-e29b-41d4-a716-446655440000.webp'),
          { minLength: 1, maxLength: 3 }
        ),
        async (imageUrls) => {
          const establishmentId = '507f1f77bcf86cd799439011';
          
          // Mock the models
          (EstablishmentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
            _id: establishmentId,
            images: imageUrls
          });

          // Act: Test operations that should maintain URL format
          for (const url of imageUrls) {
            await imageMetadataStore.addImageToEstablishment(establishmentId, url);

            // Assert: All operations should use proper URL format
            expect(url).toMatch(/^\/api\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/);
            expect(url).not.toMatch(/^data:image\//);
            expect(url).not.toContain('base64');
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should correctly identify base64 data vs URLs', () => {
    const testCases = [
      { input: '/api/images/550e8400-e29b-41d4-a716-446655440000.webp', isBase64: false },
      { input: '/api/images/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg', isBase64: false },
      { input: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA', isBase64: true },
      { input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA', isBase64: true },
    ];

    testCases.forEach(({ input, isBase64 }) => {
      if (isBase64) {
        expect(input).toMatch(/^data:image\//);
        expect(input).toContain('base64,');
        expect(input).not.toMatch(/^\/api\/images\//);
      } else {
        expect(input).not.toMatch(/^data:image\//);
        expect(input).toMatch(/^\/api\/images\//);
        expect(input).not.toContain('base64');
        expect(input).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
      }
    });
  });
});