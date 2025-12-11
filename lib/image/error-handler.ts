/**
 * Image Upload Error Handler
 * Provides comprehensive error handling for image operations with fallback mechanisms
 */

import { promises as fs } from 'fs';
import path from 'path';
import { convertToJPEG, convertToWebP } from './sharp-utils';
import { IMAGE_CONFIG } from './config';

export interface ImageError {
  code: string;
  message: string;
  details?: any;
  userMessage: string;
  statusCode: number;
}

export interface UploadErrorContext {
  fileName?: string;
  fileIndex?: number;
  establishmentId?: string;
  userId?: string;
}

export interface FallbackResult {
  success: boolean;
  buffer?: Buffer;
  format: 'webp' | 'jpeg';
  error?: string;
}

export interface DiskSpaceInfo {
  available: number;
  total: number;
  used: number;
  percentUsed: number;
}

export class ImageErrorHandler {
  private static readonly MIN_DISK_SPACE_MB = 500; // Minimum 500MB required
  private static readonly PLACEHOLDER_SVG = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#666">
        Image not available
      </text>
    </svg>
  `;

  /**
   * Attempt WebP to JPEG conversion fallback
   * Property 23: Conversion fallback behavior
   */
  async attemptConversionFallback(inputBuffer: Buffer): Promise<FallbackResult> {
    try {
      // First try WebP conversion
      try {
        const webpBuffer = await convertToWebP(inputBuffer, IMAGE_CONFIG.webp.quality);
        return {
          success: true,
          buffer: webpBuffer,
          format: 'webp'
        };
      } catch (webpError) {
        console.warn('WebP conversion failed, attempting JPEG fallback:', webpError);
        
        // Fallback to JPEG conversion
        try {
          const jpegBuffer = await convertToJPEG(inputBuffer, IMAGE_CONFIG.jpeg.quality);
          return {
            success: true,
            buffer: jpegBuffer,
            format: 'jpeg'
          };
        } catch (jpegError) {
          console.error('Both WebP and JPEG conversion failed:', jpegError);
          return {
            success: false,
            format: 'jpeg',
            error: `Conversion failed: WebP (${webpError}), JPEG (${jpegError})`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        format: 'jpeg',
        error: `Fallback conversion failed: ${error}`
      };
    }
  }

  /**
   * Get placeholder image buffer for missing files
   * Property 25: Missing image placeholder
   */
  async getPlaceholderImage(): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      // Try to serve a default placeholder image file
      const placeholderPath = path.join(process.cwd(), 'public', 'placeholder-image.jpg');
      
      try {
        const buffer = await fs.readFile(placeholderPath);
        return {
          buffer,
          contentType: 'image/jpeg'
        };
      } catch {
        // If no placeholder file exists, return SVG placeholder
        const svgBuffer = Buffer.from(ImageErrorHandler.PLACEHOLDER_SVG, 'utf-8');
        return {
          buffer: svgBuffer,
          contentType: 'image/svg+xml'
        };
      }
    } catch (error) {
      console.error('Failed to generate placeholder image:', error);
      // Return minimal SVG as last resort
      const svgBuffer = Buffer.from(ImageErrorHandler.PLACEHOLDER_SVG, 'utf-8');
      return {
        buffer: svgBuffer,
        contentType: 'image/svg+xml'
      };
    }
  }

  /**
   * Check disk space and prevent uploads if space is low
   * Property 26: Disk space protection
   */
  async checkDiskSpace(uploadPath?: string): Promise<{ 
    hasSpace: boolean; 
    info: DiskSpaceInfo; 
    warning?: string 
  }> {
    try {
      const checkPath = uploadPath || process.cwd();
      const stats = await fs.statfs ? fs.statfs(checkPath) : null;
      
      if (!stats) {
        // Fallback method for systems without statfs
        return await this.checkDiskSpaceFallback(checkPath);
      }

      const availableSize = (await stats).bavail * (await stats).bsize;
      const totalSize = (await stats).blocks * (await stats).bsize;
      const usedSize = totalSize - availableSize;
      const availableMB = availableSize / (1024 * 1024);
      const percentUsed = (usedSize / totalSize) * 100;

      const hasSpace = availableMB > ImageErrorHandler.MIN_DISK_SPACE_MB;
      
      const result: { 
        hasSpace: boolean; 
        info: DiskSpaceInfo; 
        warning?: string 
      } = {
        hasSpace,
        info: {
          available: availableSize,
          total: totalSize,
          used: usedSize,
          percentUsed
        }
      };

      if (!hasSpace) {
        result.warning = `Low disk space: ${availableMB.toFixed(2)}MB available (minimum ${ImageErrorHandler.MIN_DISK_SPACE_MB}MB required)`;
      } else if (percentUsed > 90) {
        result.warning = `Disk usage high: ${percentUsed.toFixed(1)}% used`;
      }

      return result;
    } catch (error) {
      console.error('Failed to check disk space:', error);
      // If we can't check disk space, assume we have space but log warning
      return {
        hasSpace: true,
        info: {
          available: 0,
          total: 0,
          used: 0,
          percentUsed: 0
        },
        warning: 'Unable to check disk space'
      };
    }
  }

  /**
   * Fallback disk space check for systems without statfs
   */
  private async checkDiskSpaceFallback(checkPath: string): Promise<{ 
    hasSpace: boolean; 
    info: DiskSpaceInfo; 
    warning?: string 
  }> {
    try {
      // Try to write a small test file to check if we have write access
      const testFile = path.join(checkPath, '.disk-space-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      // If we can write, assume we have space (conservative approach)
      return {
        hasSpace: true,
        info: {
          available: 0,
          total: 0,
          used: 0,
          percentUsed: 0
        },
        warning: 'Disk space check unavailable on this system'
      };
    } catch (error) {
      // If we can't write, assume no space
      return {
        hasSpace: false,
        info: {
          available: 0,
          total: 0,
          used: 0,
          percentUsed: 100
        },
        warning: 'Unable to write to disk - may be full or permission denied'
      };
    }
  }

  /**
   * Create standardized error response
   */
  createError(
    code: string,
    message: string,
    statusCode: number = 500,
    context?: UploadErrorContext,
    details?: any
  ): ImageError {
    let userMessage = message;
    
    // Create user-friendly messages based on error codes
    switch (code) {
      case 'DISK_SPACE_LOW':
        userMessage = 'Upload failed: insufficient disk space. Please try again later.';
        break;
      case 'CONVERSION_FAILED':
        userMessage = 'Image processing failed. Please try a different image format.';
        break;
      case 'FILE_TOO_LARGE':
        userMessage = `File "${context?.fileName}" is too large. Maximum size is ${IMAGE_CONFIG.validation.maxFileSize / (1024 * 1024)}MB.`;
        break;
      case 'INVALID_FORMAT':
        userMessage = `File "${context?.fileName}" is not a supported image format.`;
        break;
      case 'STORAGE_FAILED':
        userMessage = 'Failed to save image. Please try again.';
        break;
      case 'PLACEHOLDER_SERVED':
        userMessage = 'Original image not found, placeholder served.';
        break;
      default:
        userMessage = message;
    }

    return {
      code,
      message,
      userMessage,
      statusCode,
      details: {
        ...details,
        context,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Log comprehensive error information
   */
  logError(error: ImageError, operation: string): void {
    const logData = {
      operation,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode
      },
      context: error.details?.context,
      timestamp: error.details?.timestamp || new Date().toISOString()
    };

    console.error(`Image operation failed [${operation}]:`, logData);
    
    // In production, you might want to send this to a logging service
    // Example: await logService.error('image_operation_failed', logData);
  }

  /**
   * Handle storage failure with rollback
   */
  async handleStorageFailure(
    filePaths: string[],
    error: Error,
    context?: UploadErrorContext
  ): Promise<ImageError> {
    try {
      // Attempt to clean up any partially created files
      for (const filePath of filePaths) {
        try {
          await fs.unlink(filePath);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup file ${filePath}:`, cleanupError);
        }
      }
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    const imageError = this.createError(
      'STORAGE_FAILED',
      `Storage operation failed: ${error.message}`,
      500,
      context,
      { 
        originalError: error.message,
        failedFiles: filePaths,
        rollbackAttempted: true
      }
    );

    this.logError(imageError, 'storage_failure_rollback');
    return imageError;
  }

  /**
   * Handle conversion errors with fallback attempts
   */
  async handleConversionError(
    inputBuffer: Buffer,
    originalError: Error,
    context?: UploadErrorContext
  ): Promise<{ success: boolean; result?: FallbackResult; error?: ImageError }> {
    try {
      // Attempt fallback conversion
      const fallbackResult = await this.attemptConversionFallback(inputBuffer);
      
      if (fallbackResult.success) {
        console.warn(`Conversion fallback successful for ${context?.fileName}:`, {
          originalError: originalError.message,
          fallbackFormat: fallbackResult.format
        });
        
        return {
          success: true,
          result: fallbackResult
        };
      } else {
        const imageError = this.createError(
          'CONVERSION_FAILED',
          `Image conversion failed: ${originalError.message}`,
          400,
          context,
          {
            originalError: originalError.message,
            fallbackError: fallbackResult.error,
            fallbackAttempted: true
          }
        );

        this.logError(imageError, 'conversion_failure');
        return {
          success: false,
          error: imageError
        };
      }
    } catch (fallbackError) {
      const imageError = this.createError(
        'CONVERSION_FAILED',
        `Both conversion and fallback failed: ${originalError.message}`,
        500,
        context,
        {
          originalError: originalError.message,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'
        }
      );

      this.logError(imageError, 'conversion_and_fallback_failure');
      return {
        success: false,
        error: imageError
      };
    }
  }

  /**
   * Validate disk space before upload
   */
  async validateDiskSpaceForUpload(
    estimatedSize: number,
    uploadPath?: string
  ): Promise<{ canUpload: boolean; error?: ImageError }> {
    const spaceCheck = await this.checkDiskSpace(uploadPath);
    
    if (!spaceCheck.hasSpace) {
      const error = this.createError(
        'DISK_SPACE_LOW',
        'Insufficient disk space for upload',
        507, // HTTP 507 Insufficient Storage
        undefined,
        {
          diskInfo: spaceCheck.info,
          estimatedSize,
          warning: spaceCheck.warning
        }
      );

      this.logError(error, 'disk_space_validation');
      return {
        canUpload: false,
        error
      };
    }

    // Log warning if space is getting low
    if (spaceCheck.warning) {
      console.warn('Disk space warning:', spaceCheck.warning);
    }

    return { canUpload: true };
  }
}

// Export singleton instance
export const imageErrorHandler = new ImageErrorHandler();