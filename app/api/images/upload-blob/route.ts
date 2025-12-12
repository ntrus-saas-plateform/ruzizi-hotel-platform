/**
 * Vercel Blob Image Upload API Route
 * POST /api/images/upload-blob
 * 
 * Optimized for Vercel deployment using @vercel/blob
 * Handles image uploads with automatic optimization and CDN distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { put, del, list, head } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  optimized: boolean;
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
}

interface UploadResponse {
  success: boolean;
  results: UploadResult[];
  errors?: string[];
  error?: string; // For general errors
}

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Thumbnail sizes
const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 400 }
};

/**
 * Optimize image using Sharp
 */
async function optimizeImage(buffer: Buffer, originalName: string): Promise<{
  optimized: Buffer;
  size: number;
  format: string;
}> {
  try {
    // Convert to WebP for better compression and browser support
    const optimized = await sharp(buffer)
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 85,
        effort: 4 
      })
      .toBuffer();

    return {
      optimized,
      size: optimized.length,
      format: 'webp'
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Fallback to original if optimization fails
    return {
      optimized: buffer,
      size: buffer.length,
      format: originalName.split('.').pop()?.toLowerCase() || 'jpg'
    };
  }
}

/**
 * Generate thumbnails
 */
async function generateThumbnails(buffer: Buffer, baseFilename: string): Promise<{
  small: string;
  medium: string;
  large: string;
}> {
  const thumbnails = {
    small: '',
    medium: '',
    large: ''
  };

  try {
    // Generate each thumbnail size
    for (const [size, dimensions] of Object.entries(THUMBNAIL_SIZES)) {
      const thumbnailBuffer = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailFilename = `thumbnails/${baseFilename}_${size}_${dimensions.width}x${dimensions.height}.webp`;
      
      const { url } = await put(thumbnailFilename, thumbnailBuffer, {
        access: 'public',
        contentType: 'image/webp',
        cacheControlMaxAge: 31536000, // 1 year cache for thumbnails
        addRandomSuffix: false,
      });

      thumbnails[size as keyof typeof thumbnails] = url;
    }
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    // Continue without thumbnails if generation fails
  }

  return thumbnails;
}

/**
 * POST /api/images/upload-blob
 * Upload images to Vercel Blob with optimization
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Vercel Blob image upload API called');
    
    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not configured');
      return NextResponse.json({
        success: false,
        error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.'
      }, { status: 500 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const generateThumbnailsFlag = formData.get('generateThumbnails') === 'true';
    
    console.log('📁 Files received:', files.length);
    console.log('🖼️ Generate thumbnails:', generateThumbnailsFlag);
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }

    // Validate file count
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({
        success: false,
        error: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`
      }, { status: 400 });
    }

    const results: UploadResult[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📤 Processing file ${i + 1}/${files.length}: ${file.name}`);

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`File ${i + 1} (${file.name}): Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`File ${i + 1} (${file.name}): File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
          continue;
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Optimize image
        const { optimized, size, format } = await optimizeImage(buffer, file.name);
        
        // Generate unique filename
        const baseFilename = `${uuidv4()}`;
        const filename = `${baseFilename}.${format}`;
        
        console.log(`🔧 Optimized ${file.name}: ${file.size} → ${size} bytes (${format})`);

        // Upload main image to Vercel Blob with proper metadata
        const { url, downloadUrl, pathname } = await put(filename, optimized, {
          access: 'public',
          contentType: `image/${format}`,
          cacheControlMaxAge: 31536000, // 1 year cache
          addRandomSuffix: false, // We already have UUID
          multipart: file.size > 5 * 1024 * 1024, // Use multipart for files > 5MB
        });

        const result: UploadResult = {
          url,
          filename,
          size,
          optimized: size < file.size
        };

        // Generate thumbnails if requested
        if (generateThumbnailsFlag) {
          console.log(`🖼️ Generating thumbnails for ${filename}`);
          try {
            const thumbnails = await generateThumbnails(optimized, baseFilename);
            result.thumbnails = thumbnails;
          } catch (thumbnailError) {
            console.error(`⚠️ Thumbnail generation failed for ${filename}:`, thumbnailError);
            // Continue without thumbnails
          }
        }

        results.push(result);
        console.log(`✅ Uploaded: ${file.name} → ${url}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`File ${i + 1} (${file.name}): ${errorMessage}`);
        console.error(`❌ Failed to upload ${file.name}:`, error);
      }
    }

    // Check if any files were successfully processed
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All file uploads failed',
        errors
      }, { status: 400 });
    }

    // Prepare response
    const response: UploadResponse = {
      success: true,
      results,
      ...(errors.length > 0 && { errors })
    };

    const statusCode = errors.length > 0 ? 207 : 200; // 207 Multi-Status if partial success
    
    console.log(`🎉 Upload completed: ${results.length} successful, ${errors.length} errors`);
    
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('❌ Blob upload error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during upload'
    }, { status: 500 });
  }
}

/**
 * Check if a blob exists
 */
async function blobExists(url: string): Promise<boolean> {
  try {
    await head(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * DELETE /api/images/upload-blob
 * Delete images from Vercel Blob with validation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urls = searchParams.getAll('url');
    
    if (!urls || urls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No URLs provided for deletion'
      }, { status: 400 });
    }

    // Validate that we only delete from our blob store
    const validUrls = urls.filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('blob.vercel-storage.com') || 
               urlObj.hostname.includes('vercel-storage.com');
      } catch {
        return false;
      }
    });

    if (validUrls.length !== urls.length) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URLs detected. Only Vercel Blob URLs are allowed.'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const url of validUrls) {
      try {
        // Check if blob exists before attempting deletion
        const exists = await blobExists(url);
        if (!exists) {
          results.push({ url, deleted: false, reason: 'File not found' });
          continue;
        }

        await del(url);
        results.push({ url, deleted: true });
        console.log(`🗑️ Deleted: ${url}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ url, error: errorMessage });
        console.error(`❌ Failed to delete ${url}:`, error);
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Blob deletion error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during deletion'
    }, { status: 500 });
  }
}

/**
 * GET /api/images/upload-blob
 * Get upload configuration and limits
 */
export async function GET() {
  try {
    const config = {
      maxFileSize: MAX_FILE_SIZE,
      maxFilesPerRequest: MAX_FILES_PER_REQUEST,
      allowedFormats: ALLOWED_TYPES,
      thumbnailSizes: THUMBNAIL_SIZES,
      optimizationEnabled: true,
      cdnEnabled: true,
      blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN
    };

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Vercel Blob upload configuration retrieved'
    });
  } catch (error) {
    console.error('Failed to get blob upload configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get upload configuration'
    }, { status: 500 });
  }
}