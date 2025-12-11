/**
 * Property-based test for conversion fallback behavior
 * **Feature: image-optimization-system, Property 23: Conversion fallback behavior**
 * **Validates: Requirements 6.2**
 * 
 * Tests that when WebP conversion fails, the system attempts JPEG fallback and logs the error
 */

import * as fc from 'fast-check';
import { imageErrorHandler } from '../error-handler';
import { convertToWebP, convertToJPEG } from '../sharp-utils';

// Mock Sharp to simulate conversion failures
jest.mock('../sharp-utils', () => ({
  convertToWebP: jest.fn(),
  convertToJPEG: jest.fn(),
}));

const mockConvertToWebP = convertToWebP as jest.MockedFunction<typeof convertToWebP>;
const mockConvertToJPEG = convertToJPEG as jest.MockedFunction<typeof convertToJPEG>;

describe('Property 23: Conversion fallback behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.warn mock
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property: For any valid image buffer, when WebP conversion fails, 
   * the system should attempt JPEG fallback and log the error
   */
  it('should attempt JPEG fallback when WebP conversion fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random buffer data to simulate image buffers
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }), // Error message
        fc.string({ minLength: 1, maxLength: 50 }), // Filename
        async (bufferData, webpErrorMessage, filename) => {
          const inputBuffer = Buffer.from(bufferData);
          const webpError = new Error(webpErrorMessage);
          const jpegBuffer = Buffer.from('fake-jpeg-data');

          // Setup mocks: WebP fails, JPEG succeeds
          mockConvertToWebP.mockRejectedValueOnce(webpError);
          mockConvertToJPEG.mockResolvedValueOnce(jpegBuffer);

          // Test the fallback mechanism
          const result = await imageErrorHandler.attemptConversionFallback(inputBuffer);

          // Verify fallback was attempted and succeeded
          expect(result.success).toBe(true);
          expect(result.format).toBe('jpeg');
          expect(result.buffer).toEqual(jpegBuffer);
          expect(result.error).toBeUndefined();

          // Verify both conversions were attempted
          expect(mockConvertToWebP).toHaveBeenCalledWith(inputBuffer, 85);
          expect(mockConvertToJPEG).toHaveBeenCalledWith(inputBuffer, 85);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any image buffer, when both WebP and JPEG conversions fail,
   * the system should return failure with error details
   */
  it('should return failure when both conversions fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }), // WebP error
        fc.string({ minLength: 1, maxLength: 50 }), // JPEG error
        async (bufferData, webpErrorMessage, jpegErrorMessage) => {
          const inputBuffer = Buffer.from(bufferData);
          const webpError = new Error(webpErrorMessage);
          const jpegError = new Error(jpegErrorMessage);

          // Setup mocks: Both conversions fail
          mockConvertToWebP.mockRejectedValueOnce(webpError);
          mockConvertToJPEG.mockRejectedValueOnce(jpegError);

          // Test the fallback mechanism
          const result = await imageErrorHandler.attemptConversionFallback(inputBuffer);

          // Verify failure is properly handled
          expect(result.success).toBe(false);
          expect(result.format).toBe('jpeg');
          expect(result.buffer).toBeUndefined();
          expect(result.error).toContain('Conversion failed');
          expect(result.error).toContain(webpErrorMessage);
          expect(result.error).toContain(jpegErrorMessage);

          // Verify both conversions were attempted
          expect(mockConvertToWebP).toHaveBeenCalledWith(inputBuffer, 85);
          expect(mockConvertToJPEG).toHaveBeenCalledWith(inputBuffer, 85);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any image buffer, when WebP succeeds, 
   * JPEG fallback should not be attempted
   */
  it('should not attempt JPEG fallback when WebP succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (bufferData) => {
          const inputBuffer = Buffer.from(bufferData);
          const webpBuffer = Buffer.from('fake-webp-data');

          // Setup mocks: WebP succeeds
          mockConvertToWebP.mockResolvedValueOnce(webpBuffer);

          // Test the conversion
          const result = await imageErrorHandler.attemptConversionFallback(inputBuffer);

          // Verify WebP success
          expect(result.success).toBe(true);
          expect(result.format).toBe('webp');
          expect(result.buffer).toEqual(webpBuffer);
          expect(result.error).toBeUndefined();

          // Verify only WebP was attempted
          expect(mockConvertToWebP).toHaveBeenCalledWith(inputBuffer, 85);
          expect(mockConvertToJPEG).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any invalid input (empty buffer, null, etc.),
   * the system should handle gracefully and return failure
   */
  it('should handle invalid inputs gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(Buffer.alloc(0)), // Empty buffer
          fc.constant(null as any),     // Null
          fc.constant(undefined as any) // Undefined
        ),
        async (invalidInput) => {
          // Mock conversions to throw for invalid input
          mockConvertToWebP.mockRejectedValue(new Error('Invalid input'));
          mockConvertToJPEG.mockRejectedValue(new Error('Invalid input'));

          const result = await imageErrorHandler.attemptConversionFallback(invalidInput);

          // Should handle gracefully and return failure
          expect(result.success).toBe(false);
          expect(result.format).toBe('jpeg');
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error logging should occur when conversions fail
   */
  it('should log errors when conversions fail', async () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    const consoleErrorSpy = jest.spyOn(console, 'error');

    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (bufferData, errorMessage) => {
          const inputBuffer = Buffer.from(bufferData);
          const error = new Error(errorMessage);

          // Setup: WebP fails, JPEG succeeds
          mockConvertToWebP.mockRejectedValueOnce(error);
          mockConvertToJPEG.mockResolvedValueOnce(Buffer.from('jpeg-data'));

          await imageErrorHandler.attemptConversionFallback(inputBuffer);

          // Verify warning was logged for WebP failure
          expect(consoleSpy).toHaveBeenCalledWith(
            'WebP conversion failed, attempting JPEG fallback:',
            error
          );
        }
      ),
      { numRuns: 50 }
    );

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});