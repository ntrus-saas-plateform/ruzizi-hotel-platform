/**
 * Property-based tests for migration error resilience
 * **Feature: image-optimization-system, Property 18: Migration error resilience**
 */

import * as fc from 'fast-check';
import { Types } from 'mongoose';
import { Base64MigrationService, Base64ImageInfo, MigrationOptions } from '../base64-migration-service';

// Mock dependencies
jest.mock('../image-processor');
jest.mock('../file-storage-manager');
jest.mock('../image-metadata-store');
jest.mock('@/models/Establishment.model');
jest.mock('@/models/Accommodation.model');

describe('Migration Error Resilience - Property Tests', () => {
  let migrationService: Base64MigrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    migrationService = new Base64MigrationService();
  });

  /**
   * **Feature: image-optimization-system, Property 18: Migration error resilience**
   * **Validates: Requirements 4.5**
   * 
   * For any migration batch, individual failures should not prevent processing of remaining images
   */
  it('should continue processing remaining images when individual migrations fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            base64Images: fc.array(
              fc.record({
                mimeType: fc.constantFrom('jpeg', 'png'),
                base64Data: fc.base64String({ minLength: 100, maxLength: 200 }),
                shouldFail: fc.boolean()
              }).map(spec => ({
                base64String: `data:image/${spec.mimeType};base64,${spec.base64Data}`,
                shouldFail: spec.shouldFail
              })),
              { minLength: 3, maxLength: 8 }
            )
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (entitySpecs) => {
          // Arrange: Create test entities
          const allEntities: Base64ImageInfo[] = entitySpecs.map((spec, index) => ({
            type: 'establishment',
            id: new Types.ObjectId().toString(),
            entityName: `Test Entity ${index}`,
            base64Images: spec.base64Images.map(img => img.base64String)
          }));

          // Mock detectBase64Images
          jest.spyOn(migrationService, 'detectBase64Images').mockResolvedValue(allEntities);

          // Mock migrateSingleImage to simulate success/failure based on shouldFail flag
          let imageIndex = 0;
          const migrateSingleImageSpy = jest.spyOn(migrationService, 'migrateSingleImage');
          
          for (const entitySpec of entitySpecs) {
            for (const imageSpec of entitySpec.base64Images) {
              if (imageSpec.shouldFail) {
                migrateSingleImageSpy.mockResolvedValueOnce({
                  success: false,
                  originalBase64: imageSpec.base64String,
                  error: `Migration failed for image ${imageIndex}`
                });
              } else {
                migrateSingleImageSpy.mockResolvedValueOnce({
                  success: true,
                  originalBase64: imageSpec.base64String,
                  newUrl: `/api/images/migrated_${imageIndex}.webp`,
                  metadata: {
                    fileSize: 1000,
                    dimensions: { width: 100, height: 100 },
                    mimeType: 'image/webp'
                  }
                });
              }
              imageIndex++;
            }
          }

          // Mock database replacement methods
          jest.spyOn(migrationService as any, 'replaceBase64InDatabase').mockResolvedValue(undefined);

          // Act: Perform batch migration with skipErrors enabled
          const result = await migrationService.batchMigration({
            skipErrors: true,
            dryRun: false
          });

          // Calculate expected results
          const totalImages = entitySpecs.reduce((sum, entity) => sum + entity.base64Images.length, 0);
          const expectedFailures = entitySpecs.reduce((sum, entity) => 
            sum + entity.base64Images.filter(img => img.shouldFail).length, 0
          );
          const expectedSuccesses = totalImages - expectedFailures;

          // Assert: Migration should be resilient to individual failures
          expect(result.totalProcessed).toBe(totalImages);
          expect(result.successCount).toBe(expectedSuccesses);
          expect(result.failedCount).toBe(expectedFailures);
          
          // Should succeed overall if skipErrors is true
          expect(result.success).toBe(true);
          
          // Should have processed all entities
          expect(result.progress.processedEntities).toBe(entitySpecs.length);
          
          // Should have URLs for successful migrations only
          expect(result.newUrls.length).toBe(expectedSuccesses);
          
          // Error tracking should include all failures
          expect(result.errors.length).toBe(expectedFailures);
          
          // Verify error details
          result.errors.forEach(error => {
            expect(error.entityId).toBeDefined();
            expect(error.entityType).toBe('establishment');
            expect(error.imageIndex).toBeGreaterThanOrEqual(0);
            expect(error.error).toContain('Migration failed');
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 10000);

  it('should handle entity-level failures without stopping batch processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            base64Images: fc.array(
              fc.record({
                mimeType: fc.constantFrom('jpeg', 'png'),
                base64Data: fc.base64String({ minLength: 100, maxLength: 200 })
              }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
              { minLength: 1, maxLength: 3 }
            ),
            shouldFailEntity: fc.boolean()
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (entitySpecs) => {
          // Arrange: Create test entities
          const allEntities: Base64ImageInfo[] = entitySpecs.map((spec, index) => ({
            type: 'establishment',
            id: new Types.ObjectId().toString(),
            entityName: `Test Entity ${index}`,
            base64Images: spec.base64Images
          }));

          jest.spyOn(migrationService, 'detectBase64Images').mockResolvedValue(allEntities);

          // Mock migrateEntityImages to simulate entity-level success/failure
          const migrateEntityImagesSpy = jest.spyOn(migrationService, 'migrateEntityImages');
          
          for (let i = 0; i < entitySpecs.length; i++) {
            const entitySpec = entitySpecs[i];
            const entity = allEntities[i];
            
            if (entitySpec.shouldFailEntity) {
              // Mock entity-level failure
              migrateEntityImagesSpy.mockRejectedValueOnce(
                new Error(`Entity-level failure for ${entity.id}`)
              );
            } else {
              // Mock successful entity processing
              const successfulResult = {
                success: true,
                totalProcessed: entitySpec.base64Images.length,
                successCount: entitySpec.base64Images.length,
                failedCount: 0,
                progress: {
                  totalEntities: 1,
                  processedEntities: 1,
                  totalImages: entitySpec.base64Images.length,
                  processedImages: entitySpec.base64Images.length,
                  successfulImages: entitySpec.base64Images.length,
                  failedImages: 0,
                  errors: []
                },
                newUrls: entitySpec.base64Images.map((_, imgIndex) => `/api/images/entity_${i}_${imgIndex}.webp`),
                errors: []
              };
              migrateEntityImagesSpy.mockResolvedValueOnce(successfulResult);
            }
          }

          // Act: Perform batch migration
          const result = await migrationService.batchMigration({
            skipErrors: true,
            dryRun: false
          });

          // Calculate expected results
          const failedEntities = entitySpecs.filter(spec => spec.shouldFailEntity);
          const successfulEntities = entitySpecs.filter(spec => !spec.shouldFailEntity);
          
          const totalImages = entitySpecs.reduce((sum, entity) => sum + entity.base64Images.length, 0);
          const successfulImages = successfulEntities.reduce((sum, entity) => sum + entity.base64Images.length, 0);

          // Assert: Batch should continue despite entity-level failures
          expect(result.success).toBe(true); // Should succeed overall with skipErrors
          
          // Only successful entities should be counted as processed
          const successfulEntitiesCount = entitySpecs.filter(spec => !spec.shouldFailEntity).length;
          expect(result.progress.processedEntities).toBe(successfulEntitiesCount);
          
          // Should have processed successful entities
          expect(result.successCount).toBe(successfulImages);
          expect(result.newUrls.length).toBe(successfulImages);
          
          // Should have error entries for failed entities
          expect(result.errors.length).toBe(failedEntities.length);
        }
      ),
      { numRuns: 15 }
    );
  }, 8000);

  it('should respect skipErrors=false and stop on first failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            base64Images: fc.array(
              fc.record({
                mimeType: fc.constantFrom('jpeg', 'png'),
                base64Data: fc.base64String({ minLength: 100, maxLength: 200 })
              }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 2, maxLength: 4 }
        ),
        async (entitySpecs) => {
          // Arrange: Create test entities where second entity will fail
          const allEntities: Base64ImageInfo[] = entitySpecs.map((spec, index) => ({
            type: 'establishment',
            id: new Types.ObjectId().toString(),
            entityName: `Test Entity ${index}`,
            base64Images: spec.base64Images
          }));

          jest.spyOn(migrationService, 'detectBase64Images').mockResolvedValue(allEntities);

          // Mock migrateEntityImages
          const migrateEntityImagesSpy = jest.spyOn(migrationService, 'migrateEntityImages');
          
          // First entity succeeds
          const firstEntityResult = {
            success: true,
            totalProcessed: entitySpecs[0].base64Images.length,
            successCount: entitySpecs[0].base64Images.length,
            failedCount: 0,
            progress: {
              totalEntities: 1,
              processedEntities: 1,
              totalImages: entitySpecs[0].base64Images.length,
              processedImages: entitySpecs[0].base64Images.length,
              successfulImages: entitySpecs[0].base64Images.length,
              failedImages: 0,
              errors: []
            },
            newUrls: entitySpecs[0].base64Images.map((_, i) => `/api/images/success_${i}.webp`),
            errors: []
          };
          migrateEntityImagesSpy.mockResolvedValueOnce(firstEntityResult);

          // Second entity fails (if exists)
          if (entitySpecs.length > 1) {
            migrateEntityImagesSpy.mockRejectedValueOnce(
              new Error('Critical entity failure')
            );
          }

          // Act: Perform batch migration with skipErrors=false
          const result = await migrationService.batchMigration({
            skipErrors: false,
            dryRun: false
          });

          // Assert: Should fail overall when skipErrors=false and there's a failure
          if (entitySpecs.length > 1) {
            expect(result.success).toBe(false);
            
            // Should have processed first entity successfully
            expect(result.successCount).toBe(entitySpecs[0].base64Images.length);
            expect(result.newUrls.length).toBe(entitySpecs[0].base64Images.length);
            
            // Should have stopped processing after the failure
            expect(result.progress.processedEntities).toBeLessThanOrEqual(entitySpecs.length);
          } else {
            // If only one entity, it should succeed
            expect(result.success).toBe(true);
          }
        }
      ),
      { numRuns: 15 }
    );
  }, 8000);

  it('should track detailed error information for failed migrations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          base64Images: fc.array(
            fc.record({
              mimeType: fc.constantFrom('jpeg', 'png'),
              base64Data: fc.base64String({ minLength: 100, maxLength: 200 })
            }).map(spec => `data:image/${spec.mimeType};base64,${spec.base64Data}`),
            { minLength: 2, maxLength: 4 }
          )
        }),
        async (entitySpec) => {
          // Arrange: Create entity with images that will all fail
          const entity: Base64ImageInfo = {
            type: 'establishment',
            id: new Types.ObjectId().toString(),
            entityName: 'Test Entity',
            base64Images: entitySpec.base64Images
          };

          jest.spyOn(migrationService, 'detectBase64Images').mockResolvedValue([entity]);

          // Mock migrateSingleImage to fail for all images
          const migrateSingleImageSpy = jest.spyOn(migrationService, 'migrateSingleImage');
          entitySpec.base64Images.forEach((base64String, index) => {
            migrateSingleImageSpy.mockResolvedValueOnce({
              success: false,
              originalBase64: base64String,
              error: `Processing failed for image ${index}`
            });
          });

          // Mock database replacement
          jest.spyOn(migrationService as any, 'replaceBase64InDatabase').mockResolvedValue(undefined);

          // Act: Perform migration
          const result = await migrationService.batchMigration({
            skipErrors: true,
            dryRun: false
          });

          // Assert: All images should fail with detailed error tracking
          expect(result.success).toBe(true); // Overall success due to skipErrors
          expect(result.totalProcessed).toBe(entitySpec.base64Images.length);
          expect(result.successCount).toBe(0); // All should fail
          expect(result.failedCount).toBe(entitySpec.base64Images.length);
          
          // Verify detailed error information
          expect(result.errors.length).toBe(entitySpec.base64Images.length);
          
          result.errors.forEach((error, index) => {
            expect(error.entityId).toBe(entity.id);
            expect(error.entityType).toBe('establishment');
            expect(error.imageIndex).toBe(index);
            expect(error.error).toContain('Processing failed');
          });
        }
      ),
      { numRuns: 15 }
    );
  }, 8000);

  it('should handle batch processing with mixed success and failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            base64Images: fc.array(
              fc.record({
                mimeType: fc.constantFrom('jpeg', 'png'),
                base64Data: fc.base64String({ minLength: 100, maxLength: 200 }),
                shouldFail: fc.boolean()
              }).map(spec => ({
                base64String: `data:image/${spec.mimeType};base64,${spec.base64Data}`,
                shouldFail: spec.shouldFail
              })),
              { minLength: 2, maxLength: 4 }
            )
          }),
          { minLength: 2, maxLength: 4 }
        ),
        async (entitySpecs) => {
          // Arrange: Create entities with mixed success/failure
          const allEntities: Base64ImageInfo[] = entitySpecs.map((spec, index) => ({
            type: 'establishment',
            id: new Types.ObjectId().toString(),
            entityName: `Test Entity ${index}`,
            base64Images: spec.base64Images.map(img => img.base64String)
          }));

          jest.spyOn(migrationService, 'detectBase64Images').mockResolvedValue(allEntities);

          // Mock migrateSingleImage for each image
          let totalSuccessful = 0;
          let totalFailed = 0;
          let imageIndex = 0;

          const migrateSingleImageSpy = jest.spyOn(migrationService, 'migrateSingleImage');
          
          for (const entitySpec of entitySpecs) {
            for (const imageSpec of entitySpec.base64Images) {
              if (imageSpec.shouldFail) {
                migrateSingleImageSpy.mockResolvedValueOnce({
                  success: false,
                  originalBase64: imageSpec.base64String,
                  error: `Processing failed for image ${imageIndex}`
                });
                totalFailed++;
              } else {
                migrateSingleImageSpy.mockResolvedValueOnce({
                  success: true,
                  originalBase64: imageSpec.base64String,
                  newUrl: `/api/images/success_${imageIndex}.webp`,
                  metadata: {
                    fileSize: 1000,
                    dimensions: { width: 100, height: 100 },
                    mimeType: 'image/webp'
                  }
                });
                totalSuccessful++;
              }
              imageIndex++;
            }
          }

          // Mock database replacement
          jest.spyOn(migrationService as any, 'replaceBase64InDatabase').mockResolvedValue(undefined);

          // Act: Perform batch migration
          const result = await migrationService.batchMigration({
            skipErrors: true,
            batchSize: 2, // Small batch size
            dryRun: false
          });

          // Assert: Should handle mixed results gracefully
          expect(result.success).toBe(true);
          expect(result.successCount).toBe(totalSuccessful);
          expect(result.failedCount).toBe(totalFailed);
          expect(result.totalProcessed).toBe(totalSuccessful + totalFailed);
          
          // Should process all entities
          expect(result.progress.processedEntities).toBe(entitySpecs.length);
          
          // Error count should match failed images
          expect(result.errors.length).toBe(totalFailed);
          
          // URLs should match successful images
          expect(result.newUrls.length).toBe(totalSuccessful);
        }
      ),
      { numRuns: 15 }
    );
  }, 10000);
});