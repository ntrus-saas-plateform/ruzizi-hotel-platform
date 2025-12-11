/**
 * Property-based test for disk space protection
 * **Feature: image-optimization-system, Property 26: Disk space protection**
 * **Validates: Requirements 6.5**
 * 
 * Tests that when disk space is low, the system prevents uploads and logs warnings
 */

import * as fc from 'fast-check';
import { promises as fs } from 'fs';
import { imageErrorHandler } from '../error-handler';

// Mock fs to simulate disk space scenarios
jest.mock('fs', () => ({
  promises: {
    statfs: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
  }
}));

const mockStatfs = fs.statfs as jest.MockedFunction<typeof fs.statfs>;
const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
const mockUnlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>;

describe('Property 26: Disk space protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property: For any disk space below minimum threshold, 
   * uploads should be prevented
   */
  it('should prevent uploads when disk space is below minimum', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 499 }), // Available space in MB (below 500MB threshold)
        fc.integer({ min: 1000, max: 10000 }), // Total space in MB
        fc.integer({ min: 100, max: 1000 }), // Block size
        async (availableMB, totalMB, blockSize) => {
          const availableBytes = availableMB * 1024 * 1024;
          const totalBytes = totalMB * 1024 * 1024;
          const usedBytes = totalBytes - availableBytes;

          // Mock statfs to return low disk space
          const availableBlocks = Math.floor(availableBytes / blockSize);
          const totalBlocks = Math.floor(totalBytes / blockSize);
          
          mockStatfs.mockResolvedValueOnce({
            bavail: availableBlocks,
            bsize: blockSize,
            blocks: totalBlocks,
            bfree: availableBlocks,
            files: 1000,
            ffree: 500,
            type: 0
          } as any);
          
          // Recalculate expected values based on what the handler will actually compute
          const expectedAvailable = availableBlocks * blockSize;
          const expectedTotal = totalBlocks * blockSize;
          const expectedUsed = expectedTotal - expectedAvailable;

          const result = await imageErrorHandler.checkDiskSpace();

          // Should indicate insufficient space
          expect(result.hasSpace).toBe(false);
          expect(result.info.available).toBe(expectedAvailable);
          expect(result.info.total).toBe(expectedTotal);
          expect(result.info.used).toBe(expectedUsed);
          expect(result.warning).toContain('Low disk space');
          expect(result.warning).toContain(`${availableMB}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any disk space above minimum threshold, 
   * uploads should be allowed
   */
  it('should allow uploads when disk space is sufficient', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 501, max: 5000 }), // Available space in MB (above 500MB threshold)
        fc.integer({ min: 6000, max: 20000 }), // Total space in MB
        fc.integer({ min: 100, max: 1000 }), // Block size
        async (availableMB, totalMB, blockSize) => {
          const availableBytes = availableMB * 1024 * 1024;
          const totalBytes = totalMB * 1024 * 1024;
          const usedBytes = totalBytes - availableBytes;
          const percentUsed = (usedBytes / totalBytes) * 100;

          // Mock statfs to return sufficient disk space
          const availableBlocks = Math.floor(availableBytes / blockSize);
          const totalBlocks = Math.floor(totalBytes / blockSize);
          
          mockStatfs.mockResolvedValueOnce({
            bavail: availableBlocks,
            bsize: blockSize,
            blocks: totalBlocks,
            bfree: availableBlocks,
            files: 1000,
            ffree: 500,
            type: 0
          } as any);
          
          // Recalculate expected values based on what the handler will actually compute
          const expectedAvailable = availableBlocks * blockSize;
          const expectedTotal = totalBlocks * blockSize;
          const expectedUsed = expectedTotal - expectedAvailable;
          const expectedPercentUsed = (expectedUsed / expectedTotal) * 100;

          const result = await imageErrorHandler.checkDiskSpace();

          // Should indicate sufficient space
          expect(result.hasSpace).toBe(true);
          expect(result.info.available).toBe(expectedAvailable);
          expect(result.info.total).toBe(expectedTotal);
          expect(result.info.used).toBe(expectedUsed);
          expect(result.info.percentUsed).toBeCloseTo(expectedPercentUsed, 1);
          
          // Warning should only appear if usage is high (>90%)
          if (percentUsed > 90) {
            expect(result.warning).toContain('Disk usage high');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Upload validation should respect disk space limits
   */
  it('should validate upload size against available disk space', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 499 }), // Available space in MB (low)
        fc.integer({ min: 1, max: 100 }), // Upload size in MB
        fc.integer({ min: 100, max: 1000 }), // Block size
        async (availableMB, uploadSizeMB, blockSize) => {
          const availableBytes = availableMB * 1024 * 1024;
          const uploadSizeBytes = uploadSizeMB * 1024 * 1024;
          const totalBytes = availableBytes + (1000 * 1024 * 1024); // Add 1GB used space

          // Mock low disk space
          mockStatfs.mockResolvedValueOnce({
            bavail: Math.floor(availableBytes / blockSize),
            bsize: blockSize,
            blocks: Math.floor(totalBytes / blockSize),
            bfree: Math.floor(availableBytes / blockSize),
            files: 1000,
            ffree: 500,
            type: 0
          } as any);

          const result = await imageErrorHandler.validateDiskSpaceForUpload(uploadSizeBytes);

          // Should prevent upload due to low disk space
          expect(result.canUpload).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error!.code).toBe('DISK_SPACE_LOW');
          expect(result.error!.statusCode).toBe(507); // HTTP 507 Insufficient Storage
          expect(result.error!.userMessage).toContain('insufficient disk space');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: When statfs is unavailable, fallback method should be used
   */
  it('should use fallback method when statfs is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // Path to check
        fc.boolean(), // Whether write test succeeds
        async (checkPath, canWrite) => {
          // Mock statfs as unavailable
          mockStatfs.mockImplementation(() => {
            throw new Error('statfs not available');
          });

          if (canWrite) {
            mockWriteFile.mockResolvedValueOnce(undefined);
            mockUnlink.mockResolvedValueOnce(undefined);
          } else {
            mockWriteFile.mockRejectedValueOnce(new Error('Cannot write'));
          }

          const result = await imageErrorHandler.checkDiskSpace(checkPath);

          // Should handle gracefully
          expect(result).toBeDefined();
          expect(result.hasSpace).toBe(canWrite);
          expect(result.warning).toBeDefined();
          
          if (canWrite) {
            expect(result.warning).toContain('Disk space check unavailable');
          } else {
            expect(result.warning).toContain('Unable to write to disk');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: High disk usage should generate warnings even when space is available
   */
  it('should warn when disk usage is high even with available space', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 501, max: 1000 }), // Available space in MB (sufficient)
        fc.float({ min: Math.fround(90.1), max: Math.fround(99.9) }), // High usage percentage
        fc.integer({ min: 100, max: 1000 }), // Block size
        async (availableMB, usagePercent, blockSize) => {
          const availableBytes = availableMB * 1024 * 1024;
          // Calculate total bytes to achieve desired usage percentage
          const totalBytes = Math.floor(availableBytes / (1 - usagePercent / 100));
          const usedBytes = totalBytes - availableBytes;

          // Mock statfs with high usage
          mockStatfs.mockResolvedValueOnce({
            bavail: Math.floor(availableBytes / blockSize),
            bsize: blockSize,
            blocks: Math.floor(totalBytes / blockSize),
            bfree: Math.floor(availableBytes / blockSize),
            files: 1000,
            ffree: 500,
            type: 0
          } as any);

          const result = await imageErrorHandler.checkDiskSpace();

          // Should allow uploads but warn about high usage
          expect(result.hasSpace).toBe(true);
          expect(result.warning).toContain('Disk usage high');
          expect(result.warning).toContain(`${usagePercent.toFixed(1)}%`);
          expect(result.info.percentUsed).toBeGreaterThan(90);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error handling should be graceful for all error conditions
   */
  it('should handle all disk space check errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('ENOENT'), // No such file or directory
          fc.constant('EACCES'), // Permission denied
          fc.constant('EIO'),    // I/O error
          fc.string({ minLength: 1, maxLength: 50 }) // Random error
        ),
        async (errorType) => {
          // Mock statfs error
          const error = new Error(`Disk check failed: ${errorType}`);
          (error as any).code = errorType;
          mockStatfs.mockRejectedValueOnce(error);

          // Mock fallback also failing
          mockWriteFile.mockRejectedValueOnce(error);

          const result = await imageErrorHandler.checkDiskSpace();

          // Should handle gracefully - when both statfs and fallback fail, assume we have space (conservative)
          expect(result).toBeDefined();
          expect(result.hasSpace).toBe(true);
          expect(result.warning).toBeDefined();
          expect(result.info).toBeDefined();
          expect(result.info.available).toBe(0);
          expect(result.info.total).toBe(0);
          expect(result.info.used).toBe(0);
          expect(result.info.percentUsed).toBe(100);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Disk space calculations should be mathematically consistent
   */
  it('should maintain mathematical consistency in disk space calculations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 100000 }), // Available blocks
        fc.integer({ min: 1000, max: 200000 }), // Total blocks  
        fc.integer({ min: 512, max: 4096 }), // Block size
        async (availableBlocks, totalBlocks, blockSize) => {
          // Ensure available <= total
          const actualAvailable = Math.min(availableBlocks, totalBlocks);
          const actualTotal = Math.max(totalBlocks, availableBlocks);

          mockStatfs.mockResolvedValueOnce({
            bavail: actualAvailable,
            bsize: blockSize,
            blocks: actualTotal,
            bfree: actualAvailable,
            files: 1000,
            ffree: 500,
            type: 0
          } as any);

          const result = await imageErrorHandler.checkDiskSpace();

          // Verify mathematical consistency
          expect(result.info.available).toBe(actualAvailable * blockSize);
          expect(result.info.total).toBe(actualTotal * blockSize);
          expect(result.info.used).toBe((actualTotal - actualAvailable) * blockSize);
          expect(result.info.available + result.info.used).toBe(result.info.total);
          expect(result.info.percentUsed).toBeGreaterThanOrEqual(0);
          expect(result.info.percentUsed).toBeLessThanOrEqual(100);
          
          // Verify space availability logic
          const availableMB = result.info.available / (1024 * 1024);
          expect(result.hasSpace).toBe(availableMB > 500);
        }
      ),
      { numRuns: 100 }
    );
  });
});