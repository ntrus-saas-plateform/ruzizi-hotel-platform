/**
 * Image Upload API Route
 * POST /api/images/upload
 * 
 * Handles single and multiple file uploads with validation, processing, and storage
 * Returns image URLs for database storage (not base64)
 */

import { NextRequest } from 'next/server';
import { imageValidator } from '@/lib/image/image-validator';
import { imageProcessor } from '@/lib/image/image-processor';
import { fileStorageManager } from '@/lib/image/file-storage-manager';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import { imageErrorHandler } from '@/lib/image/error-handler';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { ImageUploadResult, ProcessedImage } from '@/lib/image/types';
import { recordImageUpload } from '@/lib/image/performance-monitor';

interface UploadResponse {
  success: boolean;
  results: ImageUploadResult[];
  errors?: string[];
  warnings?: string[];
}

/**
 * POST /api/images/upload
 * Upload single or multiple images with validation and processing
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    const uploadedFiles: string[] = []; // Track files for rollback
    
    try {
      // Check if request has form data
      const contentType = req.headers.get('content-type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return createErrorResponse(
          'INVALID_CONTENT_TYPE',
          'Request must be multipart/form-data',
          400
        );
      }

      // Parse form data
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      
      if (!files || files.length === 0) {
        return createErrorResponse(
          'NO_FILES',
          'No files provided in request',
          400
        );
      }

      // Validate file count (max 10 files per request)
      if (files.length > 10) {
        return createErrorResponse(
          'TOO_MANY_FILES',
          'Maximum 10 files allowed per request',
          400
        );
      }

      const results: ImageUploadResult[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check disk space before processing any files
      const totalEstimatedSize = files.reduce((sum, file) => sum + file.size, 0) * 3; // Estimate 3x for processing
      const spaceCheck = await imageErrorHandler.validateDiskSpaceForUpload(totalEstimatedSize);
      
      if (!spaceCheck.canUpload) {
        return createErrorResponse(
          spaceCheck.error!.code,
          spaceCheck.error!.userMessage,
          spaceCheck.error!.statusCode,
          spaceCheck.error!.details
        );
      }

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadStartTime = performance.now();
        const fileContext = {
          fileName: file.name,
          fileIndex: i,
          establishmentId: context.establishmentId!,
          userId: context.userId!
        };
        
        try {
          // Validate file
          const validation = await imageValidator.validateFile(file);
          if (!validation.isValid) {
            errors.push(`File ${i + 1} (${file.name}): ${validation.errors.join(', ')}`);
            continue;
          }

          // Add warnings if any
          if (validation.warnings) {
            warnings.push(...validation.warnings.map(w => `File ${i + 1} (${file.name}): ${w}`));
          }

          // Convert file to buffer
          const buffer = Buffer.from(await file.arrayBuffer());

          // Process image with enhanced error handling
          let processed: ProcessedImage;
          try {
            processed = await imageProcessor.processImage(
              buffer,
              file.name,
              context.establishmentId!,
              context.userId!
            );
          } catch (processingError) {
            // Handle processing errors with detailed context
            if (processingError && typeof processingError === 'object' && 'code' in processingError) {
              const imgError = processingError as any;
              errors.push(`File ${i + 1} (${file.name}): ${imgError.userMessage || imgError.message}`);
              imageErrorHandler.logError(imgError, 'image_processing');
            } else {
              const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
              errors.push(`File ${i + 1} (${file.name}): ${errorMessage}`);
            }
            continue;
          }

          // Store files to disk with error handling
          let storedFiles: string[];
          try {
            storedFiles = await storeProcessedImage(processed, context.establishmentId!);
            uploadedFiles.push(...storedFiles);
          } catch (storageError) {
            const imgError = await imageErrorHandler.handleStorageFailure(
              uploadedFiles,
              storageError instanceof Error ? storageError : new Error('Storage failed'),
              fileContext
            );
            errors.push(`File ${i + 1} (${file.name}): ${imgError.userMessage}`);
            continue;
          }

          // Store metadata in database (optional - for extended metadata)
          try {
            await imageMetadataStore.create({
              establishmentId: processed.metadata.establishmentId,
              originalFilename: processed.metadata.originalFilename,
              mimeType: processed.metadata.mimeType,
              fileSize: processed.metadata.fileSize,
              dimensions: processed.metadata.dimensions,
              webpUrl: processed.metadata.webpUrl,
              jpegFallbackUrl: processed.metadata.jpegFallbackUrl,
              thumbnails: processed.metadata.thumbnails,
              uploadedBy: processed.metadata.uploadedBy
            });
          } catch (dbError) {
            console.warn(`Failed to store metadata for ${file.name}:`, dbError);
            warnings.push(`File ${i + 1} (${file.name}): Metadata storage failed, but file was uploaded successfully`);
          }

          // Create result with URL for database storage
          const result: ImageUploadResult = {
            id: processed.metadata.id,
            originalPath: processed.webpPath,
            webpPath: processed.webpPath,
            jpegFallbackPath: processed.jpegFallbackPath,
            thumbnails: processed.thumbnails,
            metadata: processed.metadata,
            url: processed.metadata.webpUrl // This URL goes into existing images[] arrays
          };

          results.push(result);

          // Record successful upload performance
          const uploadTime = performance.now() - uploadStartTime;
          recordImageUpload(
            file.size,
            uploadTime,
            true,
            context.establishmentId!,
            processed.metadata.mimeType
          );

        } catch (error) {
          // Handle any unexpected errors
          const imgError = imageErrorHandler.createError(
            'UNEXPECTED_ERROR',
            error instanceof Error ? error.message : 'Unknown error',
            500,
            fileContext
          );
          
          errors.push(`File ${i + 1} (${file.name}): ${imgError.userMessage}`);
          imageErrorHandler.logError(imgError, 'file_upload');
          
          // Record failed upload performance
          const uploadTime = performance.now() - uploadStartTime;
          recordImageUpload(
            file.size,
            uploadTime,
            false,
            context.establishmentId!,
            file.type || 'unknown'
          );
          
          // Continue processing other files even if one fails
          continue;
        }
      }

      // Check if any files were successfully processed
      if (results.length === 0) {
        // Rollback any partial uploads
        await rollbackUploadedFiles(uploadedFiles);
        
        return createErrorResponse(
          'ALL_UPLOADS_FAILED',
          'All file uploads failed',
          400,
          { errors }
        );
      }

      // Prepare response
      const response: UploadResponse = {
        success: true,
        results,
        ...(errors.length > 0 && { errors }),
        ...(warnings.length > 0 && { warnings })
      };

      const statusCode = errors.length > 0 ? 207 : 200; // 207 Multi-Status if partial success
      return createSuccessResponse(response, 'Images uploaded successfully', statusCode);

    } catch (error) {
      // Rollback any uploaded files on error
      await rollbackUploadedFiles(uploadedFiles);
      
      console.error('Image upload error:', error);
      
      if (error instanceof Error) {
        return createErrorResponse('UPLOAD_ERROR', error.message, 500);
      }
      
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  }, { requireEstablishment: true })(request);
}

/**
 * Store processed image files to disk
 */
async function storeProcessedImage(
  processed: ProcessedImage,
  establishmentId: string
): Promise<string[]> {
  const storedFiles: string[] = [];
  
  try {
    // Check if buffers are available
    if (!processed.buffers) {
      throw new Error('No image buffers available for storage');
    }

    const storageOptions = { establishmentId };

    // Store WebP file
    const webpPath = await fileStorageManager.storeWebPImage(
      processed.buffers.webp,
      `${processed.metadata.id}.webp`,
      storageOptions
    );
    storedFiles.push(webpPath);

    // Store JPEG fallback
    const jpegPath = await fileStorageManager.storeJPEGImage(
      processed.buffers.jpeg,
      `${processed.metadata.id}.jpg`,
      storageOptions
    );
    storedFiles.push(jpegPath);

    // Store thumbnails
    const thumbnailPaths = await fileStorageManager.storeThumbnails(
      processed.buffers.thumbnails.webp,
      `${processed.metadata.id}.webp`,
      storageOptions
    );
    storedFiles.push(...Object.values(thumbnailPaths));

    return storedFiles;
    
  } catch (error) {
    // If storage fails, clean up any files that were created
    await rollbackUploadedFiles(storedFiles);
    throw error;
  }
}

/**
 * Rollback uploaded files in case of error
 */
async function rollbackUploadedFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return;
  
  try {
    await fileStorageManager.rollbackFileOperations(filePaths);
  } catch (rollbackError) {
    console.error('Failed to rollback uploaded files:', rollbackError);
  }
}

/**
 * GET /api/images/upload
 * Get upload configuration and limits
 */
export async function GET() {
  try {
    const config = {
      maxFileSize: imageValidator.getMaxFileSize(),
      allowedFormats: imageValidator.getAllowedFormats(),
      maxFilesPerRequest: 10,
      supportedThumbnailSizes: ['small', 'medium', 'large', 'xlarge'],
      thumbnailDimensions: {
        small: { width: 150, height: 150 },
        medium: { width: 300, height: 300 },
        large: { width: 600, height: 400 },
        xlarge: { width: 1200, height: 800 }
      }
    };

    return createSuccessResponse(config, 'Upload configuration retrieved');
  } catch (error) {
    console.error('Failed to get upload configuration:', error);
    return createErrorResponse('SERVER_ERROR', 'Failed to get upload configuration', 500);
  }
}