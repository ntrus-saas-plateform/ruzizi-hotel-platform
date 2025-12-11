/**
 * Property-based tests for FileStorageManager
 * **Feature: image-optimization-system, Property 6: File system storage integrity**
 */

import * as fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import { FileStorageManager } from '../file-storage-manager';
import { generateFullDirectoryStructure, ensureDirectoryExists } from '../directory-manager';

describe('FileStorageManager Property Tests', () => {
  let fileStorageManager: FileStorageManager;
  let testDir: string;
  
  beforeEach(async () => {
    fileStorageManager = new FileStorageManager();
    testDir = path.join(process.cwd(), 'temp-test-images', `test-${Date.now()}`);
    
    // Ensure test directory exists
    await fs.mkdir(testDir, { recursive: true });
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
   * **Feature: image-optimization-system, Property 6: File system storage integrity**
   * **Validates: Requirements 2.1**
   * 
   * For any processed image, both original and optimized versions should exist on the file system
   */
  test('Property 6: File system storage integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s}.jpg`),
          imageBuffer: fc.uint8Array({ minLength: 100, maxLength: 10000 }),
          preserveOriginal: fc.boolean()
        }),
        async ({ establishmentId, filename, imageBuffer, preserveOriginal }) => {
          // Override base directory for testing
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const options = { establishmentId, preserveOriginal };
            
            // Store WebP image (this should always exist)
            const webpPath = await fileStorageManager.storeWebPImage(
              Buffer.from(imageBuffer), 
              filename, 
              options
            );
            
            // Store original if preservation is enabled
            let originalPath: string | null = null;
            if (preserveOriginal) {
              originalPath = await fileStorageManager.storeOriginalImage(
                Buffer.from(imageBuffer),
                filename,
                options
              );
            }
            
            // Verify WebP file exists
            const webpExists = await fileStorageManager.fileExists(webpPath);
            expect(webpExists).toBe(true);
            
            // Verify WebP file has correct content
            const storedWebpBuffer = await fs.readFile(webpPath);
            expect(storedWebpBuffer.length).toBeGreaterThan(0);
            
            // Verify original file exists if preservation was enabled
            if (preserveOriginal && originalPath) {
              const originalExists = await fileStorageManager.fileExists(originalPath);
              expect(originalExists).toBe(true);
              
              const storedOriginalBuffer = await fs.readFile(originalPath);
              expect(storedOriginalBuffer.length).toBeGreaterThan(0);
            }
            
            // Verify directory structure is correct
            const directories = generateFullDirectoryStructure(establishmentId);
            
            // WebP should be in webp directory
            expect(webpPath).toContain(path.join(establishmentId));
            expect(webpPath).toContain('webp');
            
            // Original should be in originals directory if preserved
            if (originalPath) {
              expect(originalPath).toContain(path.join(establishmentId));
              expect(originalPath).toContain('originals');
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
   * Additional property test: File storage should maintain file integrity
   */
  test('File storage maintains data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s}.webp`),
          imageBuffer: fc.uint8Array({ minLength: 100, maxLength: 10000 })
        }),
        async ({ establishmentId, filename, imageBuffer }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const options = { establishmentId };
            const originalBuffer = Buffer.from(imageBuffer);
            
            // Store the image
            const storedPath = await fileStorageManager.storeWebPImage(
              originalBuffer,
              filename,
              options
            );
            
            // Read back the stored image
            const retrievedBuffer = await fs.readFile(storedPath);
            
            // Verify the data is identical
            expect(retrievedBuffer.equals(originalBuffer)).toBe(true);
            expect(retrievedBuffer.length).toBe(originalBuffer.length);
            
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
   * Property test: File paths should follow the correct structure
   */
  test('File paths follow correct directory structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          filename: fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s}.webp`),
          imageBuffer: fc.uint8Array({ minLength: 100, maxLength: 1000 })
        }),
        async ({ establishmentId, filename, imageBuffer }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const options = { establishmentId };
            
            // Store the image
            const storedPath = await fileStorageManager.storeWebPImage(
              Buffer.from(imageBuffer),
              filename,
              options
            );
            
            // Verify path structure: should contain establishmentId, year, month, and webp directory
            const pathParts = storedPath.split(path.sep);
            
            // Should contain establishment ID
            expect(pathParts).toContain(establishmentId);
            
            // Should contain webp directory
            expect(pathParts).toContain('webp');
            
            // Should contain year (4 digits)
            const yearPart = pathParts.find(part => /^\d{4}$/.test(part));
            expect(yearPart).toBeDefined();
            
            // Should contain month (2 digits)
            const monthPart = pathParts.find(part => /^\d{2}$/.test(part));
            expect(monthPart).toBeDefined();
            
            // File should have .webp extension
            expect(path.extname(storedPath)).toBe('.webp');
            
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
   * **Feature: image-optimization-system, Property 19: Complete deletion cleanup**
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any deleted image, all associated files (original and thumbnails) and database records should be removed
   */
  test('Property 19: Complete deletion cleanup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
          createOriginal: fc.boolean(),
          createThumbnails: fc.boolean()
        }),
        async ({ establishmentId, imageId, createOriginal, createThumbnails }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            
            // Create test files
            const createdFiles: string[] = [];
            
            // Create WebP file (always created)
            await ensureDirectoryExists(directories.webp);
            const webpPath = path.join(directories.webp, `${imageId}.webp`);
            await fs.writeFile(webpPath, Buffer.from('webp-content'));
            createdFiles.push(webpPath);
            
            // Create original file if requested
            if (createOriginal) {
              await ensureDirectoryExists(directories.originals);
              const originalPath = path.join(directories.originals, `${imageId}.jpg`);
              await fs.writeFile(originalPath, Buffer.from('original-content'));
              createdFiles.push(originalPath);
            }
            
            // Create JPEG fallback
            await ensureDirectoryExists(directories.jpeg);
            const jpegPath = path.join(directories.jpeg, `${imageId}.jpg`);
            await fs.writeFile(jpegPath, Buffer.from('jpeg-content'));
            createdFiles.push(jpegPath);
            
            // Create thumbnail files if requested
            if (createThumbnails) {
              for (const [size, dir] of Object.entries(directories.thumbnails)) {
                await ensureDirectoryExists(dir);
                const thumbnailPath = path.join(dir, `${imageId}_150x150.webp`);
                await fs.writeFile(thumbnailPath, Buffer.from(`thumbnail-${size}`));
                createdFiles.push(thumbnailPath);
              }
            }
            
            // Verify all files exist before deletion
            for (const filePath of createdFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(true);
            }
            
            // Perform complete cleanup
            const cleanupResult = await fileStorageManager.completeCleanup(imageId, establishmentId, date);
            
            // Verify cleanup was successful
            expect(cleanupResult.success).toBe(true);
            expect(cleanupResult.errors.length).toBe(0);
            
            // Verify all files are deleted
            for (const filePath of createdFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(false);
            }
            
            // Verify deleted files are tracked
            expect(cleanupResult.deletedFiles.length).toBeGreaterThan(0);
            
            // Verify that at least the WebP file was reported as deleted
            const deletedWebpFile = cleanupResult.deletedFiles.find(f => f.includes(`${imageId}.webp`));
            expect(deletedWebpFile).toBeDefined();
            
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
   * Property test: Batch cleanup should handle multiple images correctly
   */
  test('Batch cleanup handles multiple images', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          imageIds: fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)), 
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ establishmentId, imageIds }) => {
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            
            // Create test files for each image
            const allCreatedFiles: string[] = [];
            
            for (const imageId of imageIds) {
              await ensureDirectoryExists(directories.webp);
              const webpPath = path.join(directories.webp, `${imageId}.webp`);
              await fs.writeFile(webpPath, Buffer.from(`webp-content-${imageId}`));
              allCreatedFiles.push(webpPath);
            }
            
            // Verify all files exist
            for (const filePath of allCreatedFiles) {
              const exists = await fileStorageManager.fileExists(filePath);
              expect(exists).toBe(true);
            }
            
            // Perform batch cleanup
            const batchResult = await fileStorageManager.batchCleanup(imageIds, establishmentId, date);
            
            // Verify batch results
            expect(batchResult.totalProcessed).toBe(imageIds.length);
            expect(batchResult.successful).toBe(imageIds.length);
            expect(batchResult.failed).toBe(0);
            
            // Verify all files are deleted
            for (const filePath of allCreatedFiles) {
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
      { numRuns: 50 }
    );
  });

  /**
   * Property test: Rollback operations should restore files correctly
   */
  test('Rollback operations restore files correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          establishmentId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          filenames: fc.array(
            fc.string({ minLength: 1, maxLength: 20 })
              .filter(s => /^[a-zA-Z0-9-_]+$/.test(s))
              .map(s => `${s}.webp`), 
            { minLength: 1, maxLength: 3 }
          ),
          fileContents: fc.array(
            fc.uint8Array({ minLength: 10, maxLength: 100 }), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ establishmentId, filenames, fileContents }) => {
          // Ensure arrays have same length
          const minLength = Math.min(filenames.length, fileContents.length);
          const testFilenames = filenames.slice(0, minLength);
          const testContents = fileContents.slice(0, minLength);
          
          const originalConfig = process.env.IMAGE_BASE_DIR;
          process.env.IMAGE_BASE_DIR = testDir;
          
          try {
            const date = new Date();
            const directories = generateFullDirectoryStructure(establishmentId, date);
            await ensureDirectoryExists(directories.webp);
            
            // Create backup directory
            const backupDir = path.join(testDir, 'backup');
            await ensureDirectoryExists(backupDir);
            
            // Create original files and backups
            const originalPaths: string[] = [];
            const backupPaths: string[] = [];
            
            for (let i = 0; i < testFilenames.length; i++) {
              const filename = testFilenames[i];
              const content = Buffer.from(testContents[i]);
              
              // Create original file
              const originalPath = path.join(directories.webp, filename);
              await fs.writeFile(originalPath, content);
              originalPaths.push(originalPath);
              
              // Create backup
              const backupPath = path.join(backupDir, filename);
              await fs.writeFile(backupPath, content);
              backupPaths.push(backupPath);
              
              // Delete original to simulate failure
              await fs.unlink(originalPath);
            }
            
            // Verify files are deleted
            for (const originalPath of originalPaths) {
              const exists = await fileStorageManager.fileExists(originalPath);
              expect(exists).toBe(false);
            }
            
            // Perform rollback
            const rollbackResult = await fileStorageManager.emergencyRollback(backupPaths, originalPaths);
            
            // Verify rollback success
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.errors.length).toBe(0);
            expect(rollbackResult.restored.length).toBe(testFilenames.length);
            
            // Verify files are restored with correct content
            for (let i = 0; i < originalPaths.length; i++) {
              const originalPath = originalPaths[i];
              const expectedContent = Buffer.from(testContents[i]);
              
              const exists = await fileStorageManager.fileExists(originalPath);
              expect(exists).toBe(true);
              
              const restoredContent = await fs.readFile(originalPath);
              expect(restoredContent.equals(expectedContent)).toBe(true);
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
      { numRuns: 50 }
    );
  });
});