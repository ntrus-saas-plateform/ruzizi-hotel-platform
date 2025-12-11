/**
 * Property-based tests for migration database updates
 * **Feature: image-optimization-system, Property 17: Migration database updates**
 */

import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { imageMetadataStore } from '../image-metadata-store';
import { EstablishmentModel } from '@/models/Establishment.model';
import { AccommodationModel } from '@/models/Accommodation.model';

// Mock the database models for testing
jest.mock('@/models/Establishment.model');
jest.mock('@/models/Accommodation.model');

const MockedEstablishmentModel = EstablishmentModel as jest.Mocked<typeof EstablishmentModel>;
const MockedAccommodationModel = AccommodationModel as jest.Mocked<typeof AccommodationModel>;

describe('Migration Database Updates - Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    MockedEstablishmentModel.findById = jest.fn();
    MockedEstablishmentModel.findByIdAndUpdate = jest.fn();
    MockedAccommodationModel.findById = jest.fn();
    MockedAccommodationModel.findByIdAndUpdate = jest.fn();
  });

  /**
   * **Feature: image-optimization-system, Property 17: Migration database updates**
   * **Validates: Requirements 4.4**
   * 
   * For any successfully migrated image, the existing images[] array should contain URLs instead of base64 strings
   */
  it('should replace base64 strings with URLs in establishment images arrays', async () => {
    // Arrange: Simple test case
    const establishmentId = new Types.ObjectId().toString();
    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    const newUrl = '/api/images/migrated_test.webp';
    const otherImages = ['/api/images/other1.webp', '/api/images/other2.webp'];
    const allImages = [base64Image, ...otherImages];
    
    const mockEstablishment = {
      _id: new Types.ObjectId(establishmentId),
      images: allImages,
    };

    // Mock the database calls
    MockedEstablishmentModel.findById.mockResolvedValueOnce(mockEstablishment as any);
    MockedEstablishmentModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockEstablishment,
      images: [newUrl, ...otherImages],
    } as any);

    // Mock verification call
    MockedEstablishmentModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        ...mockEstablishment,
        images: [newUrl, ...otherImages],
      })
    } as any);

    // Act: Perform the replacement
    await expect(
      imageMetadataStore.replaceBase64InEstablishment(
        establishmentId,
        base64Image,
        newUrl
      )
    ).resolves.not.toThrow();

    // Assert: Verify the update was called with correct parameters
    expect(MockedEstablishmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      establishmentId,
      { $set: { images: [newUrl, ...otherImages] } },
      { new: true, runValidators: true }
    );
  });

  it('should replace base64 strings with URLs in accommodation images arrays', async () => {
    // Arrange: Simple test case
    const accommodationId = new Types.ObjectId().toString();
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const newUrl = '/api/images/migrated_accommodation.webp';
    const otherImages = ['/api/images/other1.webp'];
    const allImages = [base64Image, ...otherImages];
    
    const mockAccommodation = {
      _id: new Types.ObjectId(accommodationId),
      images: allImages,
    };

    // Mock the database calls
    MockedAccommodationModel.findById.mockResolvedValueOnce(mockAccommodation as any);
    MockedAccommodationModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockAccommodation,
      images: [newUrl, ...otherImages],
    } as any);

    // Mock verification call
    MockedAccommodationModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        ...mockAccommodation,
        images: [newUrl, ...otherImages],
      })
    } as any);

    // Act: Perform the replacement
    await expect(
      imageMetadataStore.replaceBase64InAccommodation(
        accommodationId,
        base64Image,
        newUrl
      )
    ).resolves.not.toThrow();

    // Assert: Verify the update was called with correct parameters
    expect(MockedAccommodationModel.findByIdAndUpdate).toHaveBeenCalledWith(
      accommodationId,
      { $set: { images: [newUrl, ...otherImages] } },
      { new: true, runValidators: true }
    );
  });

  it('should verify migration completeness correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            entityType: fc.constantFrom('establishment', 'accommodation'),
            entityId: fc.string({ minLength: 24, maxLength: 24 }).map(s => new Types.ObjectId().toString()),
            base64Images: fc.array(
              fc.record({
                mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
                base64Data: fc.base64String({ minLength: 100, maxLength: 300 })
              }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
              { minLength: 0, maxLength: 3 }
            ),
            urlImages: fc.array(
              fc.string({ minLength: 10, maxLength: 30 }).map(s => `/api/images/${s}.webp`),
              { minLength: 0, maxLength: 5 }
            )
          }),
          { minLength: 1, maxLength: 8 }
        ),
        async (entitySpecs) => {
          // Arrange: Set up mock entities with mixed image types
          for (const spec of entitySpecs) {
            const allImages = [...spec.base64Images, ...spec.urlImages];
            const mockEntity = {
              _id: new Types.ObjectId(spec.entityId),
              images: allImages,
            };

            if (spec.entityType === 'establishment') {
              (MockedEstablishmentModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            } else {
              (MockedAccommodationModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            }

            // Act: Verify entity migration
            const verification = await imageMetadataStore.verifyEntityMigration(
              spec.entityType,
              spec.entityId
            );

            // Assert: Verification results should match expected values
            expect(verification.isComplete).toBe(spec.base64Images.length === 0);
            expect(verification.remainingBase64Count).toBe(spec.base64Images.length);
            expect(verification.totalImages).toBe(allImages.length);
            expect(verification.migratedImages).toBe(spec.urlImages.length);
            expect(verification.base64Images).toEqual(spec.base64Images);
            expect(verification.urlImages).toEqual(spec.urlImages);
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  it('should handle verification of base64 replacement correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            entityType: fc.constantFrom('establishment', 'accommodation'),
            entityId: fc.string({ minLength: 24, maxLength: 24 }).map(s => new Types.ObjectId().toString()),
            originalBase64: fc.record({
              mimeType: fc.constantFrom('jpeg', 'png', 'gif', 'webp'),
              base64Data: fc.base64String({ minLength: 100, maxLength: 300 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            newUrl: fc.string({ minLength: 10, maxLength: 30 }).map(s => `/api/images/${s}.webp`),
            otherImages: fc.array(
              fc.string({ minLength: 10, maxLength: 30 }).map(s => `/api/images/${s}.webp`),
              { minLength: 0, maxLength: 3 }
            )
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (testCases) => {
          // Test successful replacement verification
          for (const testCase of testCases) {
            // Arrange: Mock entity after successful replacement
            const imagesAfterReplacement = [...testCase.otherImages, testCase.newUrl];
            const mockEntity = {
              _id: new Types.ObjectId(testCase.entityId),
              images: imagesAfterReplacement,
            };

            if (testCase.entityType === 'establishment') {
              (MockedEstablishmentModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            } else {
              (MockedAccommodationModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            }

            // Act: Verify the replacement
            const verification = await imageMetadataStore.verifyBase64Replacement(
              testCase.entityType,
              testCase.entityId,
              testCase.originalBase64,
              testCase.newUrl
            );

            // Assert: Verification should succeed
            expect(verification.success).toBe(true);
            expect(verification.error).toBeUndefined();
          }

          // Test failed replacement verification (original base64 still present)
          for (const testCase of testCases) {
            // Arrange: Mock entity with original base64 still present
            const imagesWithBase64Still = [...testCase.otherImages, testCase.originalBase64];
            const mockEntity = {
              _id: new Types.ObjectId(testCase.entityId),
              images: imagesWithBase64Still,
            };

            if (testCase.entityType === 'establishment') {
              (MockedEstablishmentModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            } else {
              (MockedAccommodationModel.findById as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockResolvedValue(mockEntity)
              });
            }

            // Act: Verify the replacement
            const verification = await imageMetadataStore.verifyBase64Replacement(
              testCase.entityType,
              testCase.entityId,
              testCase.originalBase64,
              testCase.newUrl
            );

            // Assert: Verification should fail
            expect(verification.success).toBe(false);
            expect(verification.error).toContain('Original base64 string still present');
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle errors gracefully during replacement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            entityType: fc.constantFrom('establishment', 'accommodation'),
            entityId: fc.string({ minLength: 24, maxLength: 24 }).map(s => new Types.ObjectId().toString()),
            base64Image: fc.record({
              mimeType: fc.constantFrom('jpeg', 'png'),
              base64Data: fc.base64String({ minLength: 100, maxLength: 200 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            newUrl: fc.string({ minLength: 10, maxLength: 30 }).map(s => `/api/images/${s}.webp`)
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (errorTestCases) => {
          for (const testCase of errorTestCases) {
            // Test case 1: Entity not found
            if (testCase.entityType === 'establishment') {
              (MockedEstablishmentModel.findById as jest.Mock).mockResolvedValueOnce(null);
            } else {
              (MockedAccommodationModel.findById as jest.Mock).mockResolvedValueOnce(null);
            }

            await expect(
              testCase.entityType === 'establishment'
                ? imageMetadataStore.replaceBase64InEstablishment(
                    testCase.entityId,
                    testCase.base64Image,
                    testCase.newUrl
                  )
                : imageMetadataStore.replaceBase64InAccommodation(
                    testCase.entityId,
                    testCase.base64Image,
                    testCase.newUrl
                  )
            ).rejects.toThrow('not found');

            // Test case 2: Base64 image not found in array
            const mockEntity = {
              _id: new Types.ObjectId(testCase.entityId),
              images: ['/api/images/other1.webp', '/api/images/other2.webp'], // No base64 images
            };

            if (testCase.entityType === 'establishment') {
              (MockedEstablishmentModel.findById as jest.Mock).mockResolvedValueOnce(mockEntity as any);
            } else {
              (MockedAccommodationModel.findById as jest.Mock).mockResolvedValueOnce(mockEntity as any);
            }

            await expect(
              testCase.entityType === 'establishment'
                ? imageMetadataStore.replaceBase64InEstablishment(
                    testCase.entityId,
                    testCase.base64Image,
                    testCase.newUrl
                  )
                : imageMetadataStore.replaceBase64InAccommodation(
                    testCase.entityId,
                    testCase.base64Image,
                    testCase.newUrl
                  )
            ).rejects.toThrow('Base64 image not found');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should maintain data integrity during sequential replacements', async () => {
    // Arrange: Set up establishment with multiple base64 images
    const establishmentId = new Types.ObjectId().toString();
    const base64Image1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    const base64Image2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const newUrl1 = '/api/images/migrated_1.webp';
    const newUrl2 = '/api/images/migrated_2.webp';
    
    const initialImages = [base64Image1, base64Image2];
    const mockEstablishment = {
      _id: new Types.ObjectId(establishmentId),
      images: initialImages,
    };

    // Mock first replacement
    MockedEstablishmentModel.findById.mockResolvedValueOnce(mockEstablishment as any);
    MockedEstablishmentModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockEstablishment,
      images: [newUrl1, base64Image2],
    } as any);
    MockedEstablishmentModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        ...mockEstablishment,
        images: [newUrl1, base64Image2],
      })
    } as any);

    // Mock second replacement
    MockedEstablishmentModel.findById.mockResolvedValueOnce({
      ...mockEstablishment,
      images: [newUrl1, base64Image2],
    } as any);
    MockedEstablishmentModel.findByIdAndUpdate.mockResolvedValueOnce({
      ...mockEstablishment,
      images: [newUrl1, newUrl2],
    } as any);
    MockedEstablishmentModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        ...mockEstablishment,
        images: [newUrl1, newUrl2],
      })
    } as any);

    // Act: Perform sequential replacements
    await expect(
      imageMetadataStore.replaceBase64InEstablishment(
        establishmentId,
        base64Image1,
        newUrl1
      )
    ).resolves.not.toThrow();

    await expect(
      imageMetadataStore.replaceBase64InEstablishment(
        establishmentId,
        base64Image2,
        newUrl2
      )
    ).resolves.not.toThrow();

    // Assert: Both replacements should have been called
    expect(MockedEstablishmentModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    expect(MockedEstablishmentModel.findByIdAndUpdate).toHaveBeenNthCalledWith(1,
      establishmentId,
      { $set: { images: [newUrl1, base64Image2] } },
      { new: true, runValidators: true }
    );
    expect(MockedEstablishmentModel.findByIdAndUpdate).toHaveBeenNthCalledWith(2,
      establishmentId,
      { $set: { images: [newUrl1, newUrl2] } },
      { new: true, runValidators: true }
    );
  });
});