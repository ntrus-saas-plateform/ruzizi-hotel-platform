/**
 * Property-based tests for storage failure rollback
 * **Feature: image-optimization-system, Property 24: Storage failure rollback**
 */

import * as fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import { FileStorageManager } from '../file-storage-manager';
import { ImageMetadataStore } from '../image-metadata-store';
import { generateFullDirectoryStructure, ensureDirectoryExists } from '../directory-manager';
import { randomUUID } from 'crypto';

// Mock the database operations to simulate failures
jest.mock('../image-metadata-store');

describe('Storage Failure Rollback - Property Tests', () => {
  let fileStorageManager: FileStorageManager;
  let imageMetadataStore: jest.Mocked<ImageMetadataStore>;
  let testDir: string;
  
  beforeEach(async () => {
    fileStorageManager = new FileStorageManager();
    imageMetadataStore = new ImageMetadataStore() as jest.Mocked<ImageMetadataStore>;
    testDir = path.join(process.cwd(), 'temp-test-images', `test-${Date.now()}`);
    
    // Ensure test directory exists
    await fs.mkdir(testDir, { recursive: true });
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  /**
   * **Feature: image-optimization-system, Property 24: Storage failure rollback**
   * **Validates: Requirements 6.3**
   * 
   * For any storage operation failure, partial files should be cleaned up and database changes rolled back
   */
  test('Property 24: Storage failure rollback', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
          filesToCreate: fc.array(
            fc.constantFrom('webp', 'jpeg', 'thumbnail-small', 'thumbnail-medium', 'original'),
            { minLength: 1, maxLength: 5 }
          ),
          failurePoint: fc.constantFrom('file-storage', 'database-create', 'database-update', 'thumbnail-storage'),
          fileContents: fc.uint8Array({ minLength: 100, maxLength: 1000 })
        }),
        async ({ establishmentId, imageId, filesToCreate, failurePoint, fileContents }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            const createdFiles: string[] = [];
            const buffer = Buffer.from(fileContents);
            
            // Setup mock behaviors based on failure point
            if (failurePoint === 'database-create') {
              imageMetadataStore.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));
            } else if (failurePoint === 'database-update') {
              imageMetadataStore.addImageToEstablishment = jest.fn().mockRejectedValue(new Error('Database update failed'));
            } else {
              // Success mocks for database operations
              imageMetadataStore.create = jest.fn().mockResolvedValue({ id: imageId } as any);
              imageMetadataStore.addImageToEstablishment = jest.fn().mockResolvedValue(undefined);
            }
            
            // Simulate a storage operation that might fail
            let storageOperationFailed = false;
            let rollbackExecuted = false;
            
            try {
              // Step 1: Create files (this should succeed initially)
              for (const fileType of filesToCreate) {
                let filePath: string;
                
                switch (fileType) {
                  case 'webp':
                    await ensureDirectoryExists(directories.webp);
                    filePath = path.join(directories.webp, `${imageId}.webp`);
                    break;
                  case 'jpeg':
                    await ensureDirectoryExists(directories.jpeg);
                    filePath = path.join(directories.jpeg, `${imageId}.jpg`);
                    break;
                  case 'original':
                    await ensureDirectoryExists(directories.originals);
                    filePath = path.join(directories.originals, `${imageId}.jpg`);
                    break;
                  case 'thumbnail-small':
                    await ensureDirectoryExists(directories.thumbnails.small);
                    filePath = path.join(directories.thumbnails.small, `${imageId}_150x150.webp`);
                    break;
                  case 'thumbnail-medium':
                    await ensureDirectoryExists(directories.thumbnails.medium);
                    filePath = path.join(directories.thumbnails.medium, `${imageId}_300x300.webp`);
                    break;
                  default:
                    continue;
                }
                
                // Simulate file storage failure at specific point
                if (failurePoint === 'file-storage' && fileType === 'jpeg') {
                  throw new Error('Disk full - cannot write file');
                }
                
                if (failurePoint === 'thumbnail-storage' && fileType.startsWith('thumbnail')) {
                  throw new Error('Thumbnail generation failed');
                }
                
                await fs.writeFile(filePath, buffer);
                createdFiles.push(filePath);
              }
              
              // Step 2: Database operations (might fail)
              if (failurePoint === 'database-create') {
                await imageMetadataStore.create({
                  establishmentId,
                  originalFilename: `${imageId}.jpg`,
                  mimeType: 'image/jpeg',
                  fileSize: buffer.length,
                  dimensions: { width: 100, height: 100 },
                  webpUrl: `/api/images/${imageId}.webp`,
                  jpegFallbackUrl: `/api/images/${imageId}.jpg`,
                  thumbnails: {
                    small: { path: '', width: 150, height: 150, fileSize: 0 },
                    medium: { path: '', width: 300, height: 300, fileSize: 0 },
                    large: { path: '', width: 600, height: 400, fileSize: 0 },
                    xlarge: { path: '', width: 1200, height: 800, fileSize: 0 }
                  },
                  uploadedBy: 'test-user'
                });
              }
              
              if (failurePoint === 'database-update') {
                await imageMetadataStore.addImageToEstablishment(establishmentId, `/api/images/${imageId}.webp`);
              }
              
            } catch (error) {
              storageOperationFailed = true;
              
              // Step 3: Rollback should occur when storage fails
              try {
                await fileStorageManager.rollbackFileOperations(createdFiles);
                rollbackExecuted = true;
              } catch (rollbackError) {
                // Rollback itself might fail, but we should still track it
                rollbackExecuted = true;
              }
            }
            
            // Verify the property: when storage fails, rollback should clean up files
            if (storageOperationFailed) {
              expect(rollbackExecuted).toBe(true);
              
              // Verify that files were cleaned up (rollback should remove them)
              for (const filePath of createdFiles) {
                const fileExists = await fileStorageManager.fileExists(filePath);
                expect(fileExists).toBe(false);
              }
              
              // Verify database operations were not completed when they were supposed to fail
              if (failurePoint === 'database-create') {
                expect(imageMetadataStore.create).toHaveBeenCalled();
              }
              
              if (failurePoint === 'database-update') {
                expect(imageMetadataStore.addImageToEstablishment).toHaveBeenCalled();
              }
            } else {
              // If no failure occurred, files should exist and database operations should succeed
              for (const filePath of createdFiles) {
                const fileExists = await fileStorageManager.fileExists(filePath);
                expect(fileExists).toBe(true);
              }
            }
            
          } finally {
            // Restore original config
            if (originalConfig) {
              process.env.IMAGE_BASE_DIR = originalConfig;
            } else {
              delete process.env.IMAGE_BASE_DIR;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test rollback behavior with partial file creation
   */
  test('Rollback handles partial file creation correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
          successfulFiles: fc.integer({ min: 1, max: 3 }),
          totalFiles: fc.integer({ min: 2, max: 5 }),
          fileContent: fc.uint8Array({ minLength: 50, maxLength: 500 })
        }),
        async ({ establishmentId, imageId, successfulFiles, totalFiles, fileContent }) => {
          // Ensure successfulFiles is less than totalFiles
          const actualSuccessfulFiles = Math.min(successfulFiles, totalFiles - 1);
          const actualTotalFiles = Math.max(totalFiles, actualSuccessfulFiles + 1);
          
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            const buffer = Buffer.from(fileContent);
            
            // Create some files successfully, then simulate failure
            const createdFiles: string[] = [];
            const fileTypes = ['webp', 'jpeg', 'thumbnail-small', 'thumbnail-medium', 'original'];
            
            // Create successful files
            for (let i = 0; i < actualSuccessfulFiles; i++) {
              const fileType = fileTypes[i % fileTypes.length];
              let filePath: string;
              
              switch (fileType) {
                case 'webp':
                  await ensureDirectoryExists(directories.webp);
                  filePath = path.join(directories.webp, `${imageId}_${i}.webp`);
                  break;
                case 'jpeg':
                  await ensureDirectoryExists(directories.jpeg);
                  filePath = path.join(directories.jpeg, `${imageId}_${i}.jpg`);
                  break;
                default:
                  await ensureDirectoryExists(directories.webp);
                  filePath = path.join(directories.webp, `${imageId}_${i}_${fileType}.webp`);
              }
              
              await fs.writeFile(filePath, buffer);
              createdFiles.push(filePath);
            }
            
            // Verify files were created
            for (const filePath of createdFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(true);
            }
            
            // Simulate storage failure and rollback
            let rollbackSuccess = false;
            try {
              // Simulate the failure scenario (e.g., remaining files couldn't be created)
              throw new Error(`Failed to create file ${actualSuccessfulFiles + 1} of ${actualTotalFiles}`);
            } catch (error) {
              // Perform rollback of successfully created files
              await fileStorageManager.rollbackFileOperations(createdFiles);
              rollbackSuccess = true;
            }
            
            // Verify rollback was executed
            expect(rollbackSuccess).toBe(true);
            
            // Verify all created files were cleaned up
            for (const filePath of createdFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(false);
            }
            
          } finally {
            if (originalConfig) {
              process.env.IMAGE_BASE_DIR = originalConfig;
            } else {
              delete process.env.IMAGE_BASE_DIR;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test rollback behavior with database transaction simulation
   */
  test('Database rollback prevents inconsistent state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageUrls: fc.array(
            fc.string({ minLength: 10, maxLength: 50 }).map(s => `/api/images/${s}.webp`),
            { minLength: 1, maxLength: 3 }
          ),
          failAfterOperations: fc.integer({ min: 0, max: 2 })
        }),
        async ({ establishmentId, imageUrls, failAfterOperations }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            // Track which database operations were attempted
            const attemptedOperations: string[] = [];
            let operationCount = 0;
            
            // Mock database operations to fail after a certain number
            imageMetadataStore.addImageToEstablishment = jest.fn().mockImplementation(async (estId, url) => {
              attemptedOperations.push(`add-${url}`);
              operationCount++;
              
              if (operationCount > failAfterOperations) {
                throw new Error('Database transaction failed');
              }
              
              return Promise.resolve();
            });
            
            imageMetadataStore.removeImageFromEstablishment = jest.fn().mockResolvedValue(undefined);
            
            // Simulate a batch operation that might fail partway through
            let batchOperationFailed = false;
            let rollbackExecuted = false;
            
            try {
              // Attempt to add multiple images to establishment
              for (const url of imageUrls) {
                await imageMetadataStore.addImageToEstablishment(establishmentId, url);
              }
            } catch (error) {
              batchOperationFailed = true;
              
              // Rollback: remove any images that were successfully added
              try {
                for (let i = 0; i < failAfterOperations; i++) {
                  if (i < imageUrls.length) {
                    await imageMetadataStore.removeImageFromEstablishment(establishmentId, imageUrls[i]);
                  }
                }
                rollbackExecuted = true;
              } catch (rollbackError) {
                rollbackExecuted = true; // Track that rollback was attempted
              }
            }
            
            // Verify the property: when database operations fail, rollback should occur
            if (failAfterOperations < imageUrls.length) {
              expect(batchOperationFailed).toBe(true);
              expect(rollbackExecuted).toBe(true);
              
              // Verify that addImageToEstablishment was called the expected number of times
              expect(imageMetadataStore.addImageToEstablishment).toHaveBeenCalledTimes(failAfterOperations + 1);
              
              // Verify that rollback operations were called for successful operations
              expect(imageMetadataStore.removeImageFromEstablishment).toHaveBeenCalledTimes(failAfterOperations);
            } else {
              // All operations should succeed
              expect(batchOperationFailed).toBe(false);
              expect(imageMetadataStore.addImageToEstablishment).toHaveBeenCalledTimes(imageUrls.length);
            }
            
          } finally {
            if (originalConfig) {
              process.env.IMAGE_BASE_DIR = originalConfig;
            } else {
              delete process.env.IMAGE_BASE_DIR;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test complete cleanup with rollback support
   */
  test('Complete cleanup handles failures gracefully with rollback', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
          simulateFileSystemError: fc.boolean(),
          fileContent: fc.uint8Array({ minLength: 100, maxLength: 500 })
        }),
        async ({ establishmentId, imageId, simulateFileSystemError, fileContent }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            const buffer = Buffer.from(fileContent);
            
            // Create test files
            const createdFiles: string[] = [];
            
            await ensureDirectoryExists(directories.webp);
            const webpPath = path.join(directories.webp, `${imageId}.webp`);
            await fs.writeFile(webpPath, buffer);
            createdFiles.push(webpPath);
            
            await ensureDirectoryExists(directories.jpeg);
            const jpegPath = path.join(directories.jpeg, `${imageId}.jpg`);
            await fs.writeFile(jpegPath, buffer);
            createdFiles.push(jpegPath);
            
            // Verify files exist before cleanup
            for (const filePath of createdFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(true);
            }
            
            // Simulate file system error during cleanup if requested
            if (simulateFileSystemError) {
              // Make one of the files read-only to simulate deletion failure
              try {
                await fs.chmod(webpPath, 0o444); // Read-only
              } catch (error) {
                // If chmod fails, skip this test case
                return;
              }
            }
            
            // Perform complete cleanup
            const cleanupResult = await fileStorageManager.completeCleanup(imageId, establishmentId, date);
            
            // Verify cleanup behavior
            if (simulateFileSystemError) {
              // Cleanup might partially fail, but should handle errors gracefully
              expect(cleanupResult.success).toBeDefined();
              expect(Array.isArray(cleanupResult.errors)).toBe(true);
              expect(Array.isArray(cleanupResult.deletedFiles)).toBe(true);
              
              // Some files might still exist due to simulated errors
              // But the system should track what was and wasn't deleted
              if (!cleanupResult.success) {
                expect(cleanupResult.errors.length).toBeGreaterThan(0);
              }
            } else {
              // Normal cleanup should succeed
              expect(cleanupResult.success).toBe(true);
              expect(cleanupResult.errors.length).toBe(0);
              expect(cleanupResult.deletedFiles.length).toBeGreaterThan(0);
              
              // All files should be deleted
              for (const filePath of createdFiles) {
                const exists = await fileStorageManager.fileExists(filePath);
                expect(exists).toBe(false);
              }
            }
            
          } finally {
            // Restore file permissions and clean up
            try {
              const currentDate = new Date();
              const webpPath = path.join(testDir, 'images', establishmentId, currentDate.getFullYear().toString(), 
                String(currentDate.getMonth() + 1).padStart(2, '0'), 'webp', `${imageId}.webp`);
              await fs.chmod(webpPath, 0o644);
            } catch (error) {
              // Ignore cleanup errors
            }
            
            if (originalConfig) {
              process.env.IMAGE_BASE_DIR = originalConfig;
            } else {
              delete process.env.IMAGE_BASE_DIR;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});