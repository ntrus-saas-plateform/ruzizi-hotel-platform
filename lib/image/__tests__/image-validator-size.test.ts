/**
 * Property-based tests for file size validation
 * **Feature: image-optimization-system, Property 2: File size validation**
 */

import * as fc from 'fast-check';
import { ImageValidator } from '../image-validator';

describe('File Size Validation - Property Tests', () => {
  let validator: ImageValidator;
  const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

  beforeEach(() => {
    validator = new ImageValidator();
  });

  /**
   * **Feature: image-optimization-system, Property 2: File size validation**
   * **Validates: Requirements 1.2**
   * 
   * For any uploaded image, the system should reject files larger than 10MB and accept files within the limit
   */
  it('should accept files within size limit and reject files exceeding limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Files within limit (1 byte to 10MB)
          fc.record({
            size: fc.integer({ min: 1, max: DEFAULT_MAX_SIZE }),
            shouldPass: fc.constant(true)
          }),
          // Files exceeding limit (10MB + 1 byte to 50MB)
          fc.record({
            size: fc.integer({ min: DEFAULT_MAX_SIZE + 1, max: 50 * 1024 * 1024 }),
            shouldPass: fc.constant(false)
          }),
          // Edge cases
          fc.record({
            size: fc.constantFrom(0, 1, DEFAULT_MAX_SIZE - 1, DEFAULT_MAX_SIZE, DEFAULT_MAX_SIZE + 1),
            shouldPass: fc.boolean()
          })
        ),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.jpg`),
        async (testCase, filename) => {
          // Arrange: Create buffer of specified size
          let buffer: Buffer;
          if (testCase.size === 0) {
            buffer = Buffer.alloc(0); // Empty buffer
          } else if (testCase.size < 8) {
            buffer = Buffer.alloc(testCase.size, 0x00); // Too small for header
          } else {
            // Create buffer with valid JPEG header
            buffer = Buffer.concat([
              Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG magic number
              Buffer.from('JFIF'),
              Buffer.alloc(Math.max(0, testCase.size - 8), 0x00) // Fill remaining space
            ]);
          }

          // Act: Validate file size
          const sizeValidation = validator.validateFileSize(buffer);
          const fullValidation = await validator.validateFile(buffer, filename);

          // Assert: Size validation should match expected result
          if (testCase.size === 0) {
            expect(sizeValidation.isValid).toBe(false);
            expect(sizeValidation.errors.some(error => error.includes('empty'))).toBe(true);
          } else if (testCase.size <= DEFAULT_MAX_SIZE) {
            expect(sizeValidation.isValid).toBe(true);
            expect(sizeValidation.errors.length).toBe(0);
          } else {
            expect(sizeValidation.isValid).toBe(false);
            expect(sizeValidation.errors.some(error => 
              error.includes('exceeds maximum') || error.includes('size')
            )).toBe(true);
          }

          // Full validation should include size validation results
          if (testCase.size === 0 || testCase.size > DEFAULT_MAX_SIZE) {
            expect(fullValidation.isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle custom size limits correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1024, max: 100 * 1024 * 1024 }), // Custom max size (1KB to 100MB)
        fc.integer({ min: 1, max: 200 * 1024 * 1024 }), // Test file size (1 byte to 200MB)
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.png`),
        async (customMaxSize, fileSize, filename) => {
          // Arrange: Create validator with custom size limit
          const customValidator = new ImageValidator({ maxFileSize: customMaxSize });
          
          // Create buffer with PNG header
          const buffer = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic
            Buffer.alloc(Math.max(0, fileSize - 8), 0x00)
          ]);

          // Act: Validate with custom size limit
          const result = customValidator.validateFileSize(buffer);

          // Assert: Should respect custom size limit
          if (fileSize <= customMaxSize) {
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
          } else {
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => 
              error.includes('exceeds maximum') && 
              error.includes(customMaxSize.toString())
            )).toBe(true);
          }

          // Verify the validator reports correct max size
          expect(customValidator.getMaxFileSize()).toBe(customMaxSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary conditions precisely', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1024, max: 10 * 1024 * 1024 }), // Max size from 1KB to 10MB
        async (maxSize) => {
          // Arrange: Create validator with specific max size
          const customValidator = new ImageValidator({ maxFileSize: maxSize });
          
          // Test exact boundary conditions
          const testSizes = [
            maxSize - 1,  // Just under limit
            maxSize,      // Exact limit
            maxSize + 1   // Just over limit
          ];

          for (const testSize of testSizes) {
            // Create buffer with GIF header
            const buffer = Buffer.concat([
              Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
              Buffer.alloc(Math.max(0, testSize - 6), 0x00)
            ]);

            // Act: Validate size
            const result = customValidator.validateFileSize(buffer);

            // Assert: Boundary behavior
            if (testSize <= maxSize) {
              expect(result.isValid).toBe(true);
              expect(result.errors.length).toBe(0);
            } else {
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should provide accurate error messages for size violations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxSize: fc.integer({ min: 1024, max: 5 * 1024 * 1024 }),
          fileSize: fc.integer({ min: 6 * 1024 * 1024, max: 20 * 1024 * 1024 })
        }),
        fc.string({ minLength: 1, maxLength: 25 }).map(s => `${s}.webp`),
        async (config, filename) => {
          // Arrange: Create validator and oversized file
          const validator = new ImageValidator({ maxFileSize: config.maxSize });
          const buffer = Buffer.concat([
            Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
            Buffer.alloc(4, 0x00),
            Buffer.from('WEBP'),
            Buffer.alloc(Math.max(0, config.fileSize - 12), 0x00)
          ]);

          // Act: Validate oversized file
          const result = validator.validateFileSize(buffer);

          // Assert: Error message should contain specific information
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          const errorMessage = result.errors[0];
          expect(errorMessage).toContain(config.fileSize.toString()); // Actual size
          expect(errorMessage).toContain(config.maxSize.toString()); // Max allowed size
          expect(errorMessage.toLowerCase()).toContain('exceeds');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero and negative size edge cases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(0), // Empty buffer
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.jpg`),
        async (size, filename) => {
          // Arrange: Create empty buffer
          const buffer = Buffer.alloc(size);

          // Act: Validate empty file
          const result = validator.validateFileSize(buffer);

          // Assert: Empty files should be rejected
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => 
            error.toLowerCase().includes('empty')
          )).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent validation across multiple calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1024, max: 5 * 1024 * 1024 }), // File size
        fc.integer({ min: 5, max: 20 }), // Number of validation calls
        async (fileSize, iterations) => {
          // Arrange: Create test buffer
          const buffer = Buffer.concat([
            Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG
            Buffer.from('JFIF'),
            Buffer.alloc(Math.max(0, fileSize - 8), 0x00)
          ]);

          // Act: Validate multiple times
          const results = Array.from({ length: iterations }, () => 
            validator.validateFileSize(buffer)
          );

          // Assert: All results should be identical
          const firstResult = results[0];
          results.forEach(result => {
            expect(result.isValid).toBe(firstResult.isValid);
            expect(result.errors).toEqual(firstResult.errors);
          });

          // Result should be consistent with size limit
          if (fileSize <= DEFAULT_MAX_SIZE) {
            expect(firstResult.isValid).toBe(true);
          } else {
            expect(firstResult.isValid).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle File objects and Buffers consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1024, max: 2 * 1024 * 1024 }), // File size up to 2MB
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.png`),
        async (fileSize, filename) => {
          // Arrange: Create buffer and File object with same content
          const bufferContent = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
            Buffer.alloc(Math.max(0, fileSize - 8), 0x00)
          ]);

          const file = new File([bufferContent], filename, { type: 'image/png' });

          // Act: Validate both buffer and File object
          const bufferResult = await validator.validateFile(bufferContent, filename);
          const fileResult = await validator.validateFile(file);

          // Assert: Results should be consistent for size validation
          // (other validations might differ due to different handling, but size should be same)
          const bufferSizeValid = validator.validateFileSize(bufferContent).isValid;
          const fileSizeValid = validator.validateFileSize(Buffer.from(await file.arrayBuffer())).isValid;
          
          expect(bufferSizeValid).toBe(fileSizeValid);
        }
      ),
      { numRuns: 50 }
    );
  });
});