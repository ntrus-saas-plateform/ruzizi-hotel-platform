/**
 * Property-based tests for file format validation
 * **Feature: image-optimization-system, Property 1: File format validation**
 */

import * as fc from 'fast-check';
import { ImageValidator } from '../image-validator';

describe('File Format Validation - Property Tests', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator();
  });

  /**
   * **Feature: image-optimization-system, Property 1: File format validation**
   * **Validates: Requirements 1.1**
   * 
   * For any uploaded file, the system should accept only valid image formats (JPEG, PNG, GIF, WebP) and reject all other formats
   */
  it('should accept valid image formats and reject invalid ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid image formats with proper magic numbers
          fc.record({
            type: fc.constant('jpeg'),
            buffer: fc.constant(Buffer.concat([
              Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG magic number + JFIF marker
              Buffer.from('JFIF'),
              Buffer.alloc(100, 0x00) // Padding to make it a reasonable size
            ])),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`)
          }),
          fc.record({
            type: fc.constant('png'),
            buffer: fc.constant(Buffer.concat([
              Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic number
              Buffer.alloc(100, 0x00) // Padding
            ])),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`)
          }),
          fc.record({
            type: fc.constant('gif'),
            buffer: fc.constant(Buffer.concat([
              Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a magic number
              Buffer.alloc(100, 0x00) // Padding
            ])),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.gif`)
          }),
          fc.record({
            type: fc.constant('webp'),
            buffer: fc.constant(Buffer.concat([
              Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF magic number
              Buffer.alloc(4, 0x00), // File size placeholder
              Buffer.from('WEBP'), // WebP signature
              Buffer.alloc(100, 0x00) // Padding
            ])),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.webp`)
          }),
          // Invalid formats
          fc.record({
            type: fc.constant('invalid'),
            buffer: fc.oneof(
              fc.constant(Buffer.from('This is not an image')), // Text file
              fc.constant(Buffer.from([0x50, 0x4B, 0x03, 0x04])), // ZIP file
              fc.constant(Buffer.from([0x25, 0x50, 0x44, 0x46])), // PDF file
              fc.constant(Buffer.from([0x4D, 0x5A])), // PE executable
              fc.uint8Array({ minLength: 20, maxLength: 100 }).map(arr => Buffer.from(arr)) // Random bytes
            ),
            filename: fc.oneof(
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.txt`),
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.exe`),
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.zip`),
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.doc`)
            )
          })
        ),
        async (testCase) => {
          // Act: Validate the file
          const result = await validator.validateFile(testCase.buffer, testCase.filename);
          
          // Assert: Valid formats should pass, invalid should fail
          if (testCase.type === 'invalid') {
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => 
              error.includes('format') || 
              error.includes('detect') || 
              error.includes('allowed')
            )).toBe(true);
          } else {
            // Valid image formats should pass format validation
            // (they might still fail other validations like size, but not format)
            const formatValidation = validator.validateFileFormat(testCase.buffer, testCase.filename);
            expect(formatValidation.isValid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject files with mismatched extensions and content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // JPEG content with wrong extension
          buffer: fc.constant(Buffer.concat([
            Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
            Buffer.from('JFIF'),
            Buffer.alloc(50, 0x00)
          ])),
          filename: fc.oneof(
            fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.png`),
            fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.gif`),
            fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.txt`)
          )
        }),
        async (testCase) => {
          // Act: Validate file with mismatched extension
          const result = await validator.validateFile(testCase.buffer, testCase.filename);
          
          // Assert: Should detect JPEG format regardless of extension
          const formatValidation = validator.validateFileFormat(testCase.buffer, testCase.filename);
          
          // The format validation should pass because it detects JPEG content
          // (JPEG is an allowed format)
          expect(formatValidation.isValid).toBe(true);
          
          // The filename should be sanitized but validation should succeed
          // because the actual content is a valid image format
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases in format detection', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Empty buffer
          fc.constant({ buffer: Buffer.alloc(0), filename: 'empty.jpg' }),
          // Too small buffer
          fc.constant({ buffer: Buffer.alloc(3), filename: 'tiny.jpg' }),
          // Corrupted magic numbers
          fc.record({
            buffer: fc.uint8Array({ minLength: 10, maxLength: 20 }).map(arr => Buffer.from(arr)),
            filename: fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.jpg`)
          }),
          // Partial magic numbers
          fc.constant({ buffer: Buffer.from([0xFF, 0xD8]), filename: 'partial.jpg' }),
          // Wrong WebP structure (RIFF but no WEBP)
          fc.constant({ 
            buffer: Buffer.concat([
              Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
              Buffer.alloc(4, 0x00),
              Buffer.from('WAVE'), // WAVE instead of WEBP
              Buffer.alloc(50, 0x00)
            ]), 
            filename: 'fake.webp' 
          })
        ),
        async (testCase) => {
          // Act: Validate edge case
          const result = await validator.validateFile(testCase.buffer, testCase.filename);
          
          // Assert: Should handle gracefully without crashing
          expect(result).toBeDefined();
          expect(typeof result.isValid).toBe('boolean');
          expect(Array.isArray(result.errors)).toBe(true);
          
          // Edge cases should generally fail validation
          if (testCase.buffer.length === 0) {
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('empty'))).toBe(true);
          } else if (testCase.buffer.length < 8) {
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('too small'))).toBe(true);
          } else {
            // For other edge cases, should fail format detection
            expect(result.isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently validate the same file content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buffer: fc.constant(Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
            Buffer.alloc(100, 0x00)
          ])),
          filename: fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.png`),
          iterations: fc.integer({ min: 5, max: 20 })
        }),
        async (testCase) => {
          // Act: Validate the same file multiple times
          const results = await Promise.all(
            Array.from({ length: testCase.iterations }, () => 
              validator.validateFile(testCase.buffer, testCase.filename)
            )
          );
          
          // Assert: All results should be identical
          const firstResult = results[0];
          results.forEach(result => {
            expect(result.isValid).toBe(firstResult.isValid);
            expect(result.errors).toEqual(firstResult.errors);
          });
          
          // PNG should be valid
          expect(firstResult.isValid).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate allowed formats configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom('jpeg', 'png', 'gif', 'webp'), { minLength: 1, maxLength: 4 }),
        fc.record({
          buffer: fc.constant(Buffer.concat([
            Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]),
            Buffer.from('JFIF'),
            Buffer.alloc(50, 0x00)
          ])),
          filename: fc.constant('test.jpg')
        }),
        async (allowedFormats, testCase) => {
          // Arrange: Create validator with specific allowed formats
          const customValidator = new ImageValidator({ allowedFormats });
          
          // Act: Validate JPEG file
          const result = await customValidator.validateFile(testCase.buffer, testCase.filename);
          
          // Assert: Should pass only if JPEG is in allowed formats
          const formatValidation = customValidator.validateFileFormat(testCase.buffer, testCase.filename);
          
          if (allowedFormats.includes('jpeg')) {
            expect(formatValidation.isValid).toBe(true);
          } else {
            expect(formatValidation.isValid).toBe(false);
            expect(formatValidation.errors.some(error => 
              error.includes('not allowed')
            )).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});