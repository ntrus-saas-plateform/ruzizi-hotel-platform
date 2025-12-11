/**
 * Property-based tests for directory management utilities
 * **Feature: image-optimization-system, Property 5: Directory structure consistency**
 */

import * as fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import {
  generateImagePath,
  generateFullDirectoryStructure,
  createEstablishmentDirectories,
  validateDirectoryStructure,
  ensureDirectoryExists,
  cleanupEmptyDirectories,
} from '../directory-manager';
import { IMAGE_CONFIG } from '../config';

// Test data generators
const establishmentId = fc.uuid();
const validDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

// Helper to create temporary test directory
const createTempTestDir = () => {
  const tempDir = path.join(process.cwd(), 'temp-test-images', Date.now().toString());
  return tempDir;
};

// Helper to cleanup test directories
const cleanupTestDir = async (dirPath: string) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
};

describe('Directory Manager - Property Tests', () => {
  /**
   * **Feature: image-optimization-system, Property 5: Directory structure consistency**
   * **Validates: Requirements 1.5, 2.3**
   * 
   * For any stored image, the file path should follow the pattern `/uploads/images/{establishmentId}/{year}/{month}/`
   */
  it('should generate consistent directory paths for any establishment and date', async () => {
    await fc.assert(
      fc.property(establishmentId, validDate, (estId, date) => {
        // Act: Generate path
        const imagePath = generateImagePath(estId, date);
        
        // Assert: Path should follow expected pattern
        const expectedYear = date.getFullYear().toString();
        const expectedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const expectedPath = path.join(IMAGE_CONFIG.directories.base, estId, expectedYear, expectedMonth);
        
        expect(imagePath).toBe(expectedPath);
        
        // Path should contain establishment ID
        expect(imagePath).toContain(estId);
        
        // Path should contain year and month
        expect(imagePath).toContain(expectedYear);
        expect(imagePath).toContain(expectedMonth);
        
        // Path should include base directory components
        expect(imagePath).toContain('uploads');
        expect(imagePath).toContain('images');
      }),
      { numRuns: 100 }
    );
  });

  it('should generate complete directory structure with all required subdirectories', async () => {
    await fc.assert(
      fc.property(establishmentId, validDate, (estId, date) => {
        // Act: Generate full structure
        const structure = generateFullDirectoryStructure(estId, date);
        
        // Assert: All required directories should be present
        expect(structure.base).toBeDefined();
        expect(structure.originals).toBeDefined();
        expect(structure.webp).toBeDefined();
        expect(structure.jpeg).toBeDefined();
        expect(structure.thumbnails.small).toBeDefined();
        expect(structure.thumbnails.medium).toBeDefined();
        expect(structure.thumbnails.large).toBeDefined();
        expect(structure.thumbnails.xlarge).toBeDefined();
        
        // All paths should be under the base path
        expect(structure.originals.startsWith(structure.base)).toBe(true);
        expect(structure.webp.startsWith(structure.base)).toBe(true);
        expect(structure.jpeg.startsWith(structure.base)).toBe(true);
        expect(structure.thumbnails.small.startsWith(structure.base)).toBe(true);
        expect(structure.thumbnails.medium.startsWith(structure.base)).toBe(true);
        expect(structure.thumbnails.large.startsWith(structure.base)).toBe(true);
        expect(structure.thumbnails.xlarge.startsWith(structure.base)).toBe(true);
        
        // Subdirectories should contain expected names
        expect(structure.originals).toContain('originals');
        expect(structure.webp).toContain('webp');
        expect(structure.jpeg).toContain('jpeg');
        expect(structure.thumbnails.small).toContain('small');
        expect(structure.thumbnails.medium).toContain('medium');
        expect(structure.thumbnails.large).toContain('large');
        expect(structure.thumbnails.xlarge).toContain('xlarge');
      }),
      { numRuns: 100 }
    );
  });

  it('should create and validate directory structure consistently', async () => {
    const tempDir = createTempTestDir();
    
    // Override base directory for testing
    const originalBase = IMAGE_CONFIG.directories.base;
    (IMAGE_CONFIG.directories as any).base = tempDir;
    
    try {
      await fc.assert(
        fc.asyncProperty(establishmentId, validDate, async (estId, date) => {
          // Act: Create directories
          await createEstablishmentDirectories(estId, date);
          
          // Assert: Validation should pass
          const isValid = await validateDirectoryStructure(estId, date);
          expect(isValid).toBe(true);
          
          // All directories should exist
          const structure = generateFullDirectoryStructure(estId, date);
          const allPaths = [
            structure.base,
            structure.originals,
            structure.webp,
            structure.jpeg,
            structure.thumbnails.small,
            structure.thumbnails.medium,
            structure.thumbnails.large,
            structure.thumbnails.xlarge,
          ];
          
          for (const dirPath of allPaths) {
            const stats = await fs.stat(dirPath);
            expect(stats.isDirectory()).toBe(true);
          }
        }),
        { numRuns: 20 } // Reduced runs for file system operations
      );
    } finally {
      // Restore original config and cleanup
      (IMAGE_CONFIG.directories as any).base = originalBase;
      await cleanupTestDir(tempDir);
    }
  });

  it('should handle directory creation idempotently', async () => {
    const tempDir = createTempTestDir();
    const originalBase = IMAGE_CONFIG.directories.base;
    (IMAGE_CONFIG.directories as any).base = tempDir;
    
    try {
      await fc.assert(
        fc.asyncProperty(establishmentId, validDate, async (estId, date) => {
          // Act: Create directories multiple times
          await createEstablishmentDirectories(estId, date);
          await createEstablishmentDirectories(estId, date);
          await createEstablishmentDirectories(estId, date);
          
          // Assert: Should still be valid after multiple creations
          const isValid = await validateDirectoryStructure(estId, date);
          expect(isValid).toBe(true);
        }),
        { numRuns: 10 }
      );
    } finally {
      (IMAGE_CONFIG.directories as any).base = originalBase;
      await cleanupTestDir(tempDir);
    }
  });

  it('should ensure individual directories exist correctly', async () => {
    const tempDir = createTempTestDir();
    
    try {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          async (pathSegments) => {
            // Arrange: Create nested path
            const testPath = path.join(tempDir, ...pathSegments.map(s => s.replace(/[<>:"|?*]/g, '_')));
            
            // Act: Ensure directory exists
            await ensureDirectoryExists(testPath);
            
            // Assert: Directory should exist
            const stats = await fs.stat(testPath);
            expect(stats.isDirectory()).toBe(true);
            
            // Should be idempotent
            await ensureDirectoryExists(testPath);
            const stats2 = await fs.stat(testPath);
            expect(stats2.isDirectory()).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      await cleanupTestDir(tempDir);
    }
  });

  it('should generate unique paths for different establishments and dates', async () => {
    await fc.assert(
      fc.property(
        establishmentId,
        establishmentId,
        validDate,
        validDate,
        (estId1, estId2, date1, date2) => {
          // Skip if inputs are identical
          fc.pre(estId1 !== estId2 || date1.getTime() !== date2.getTime());
          
          // Act: Generate paths
          const path1 = generateImagePath(estId1, date1);
          const path2 = generateImagePath(estId2, date2);
          
          // Assert: Paths should be different for different inputs
          expect(path1).not.toBe(path2);
        }
      ),
      { numRuns: 100 }
    );
  });
});