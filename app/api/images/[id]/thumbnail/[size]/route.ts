/**
 * Thumbnail serving API route - GET /api/images/[id]/thumbnail/[size]
 * Serves thumbnails with format detection and size selection
 * Includes establishment-based access control and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import path from 'path';
import { IMAGE_CONFIG, ThumbnailSize } from '@/lib/image/config';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import { 
  generateImageResponseHeaders, 
  generatePlaceholderHeaders,
  handleConditionalRequest 
} from '@/lib/image/cache-headers';
import { 
  withThumbnailAccessControl, 
  type ImageAccessContext 
} from '@/lib/image/access-control.middleware';

interface RouteParams {
  params: {
    id: string;
    size: string;
  };
}

// Thumbnail serving handler with access control
async function handleThumbnailServing(
  request: NextRequest, 
  imageId: string, 
  size: string,
  context?: ImageAccessContext
): Promise<NextResponse> {
  try {
    // Validate thumbnail size
    const thumbnailSize = validateThumbnailSize(size);
    if (!thumbnailSize) {
      return new NextResponse('Invalid thumbnail size', { status: 400 });
    }
    
    // Get image metadata from store
    const metadata = await imageMetadataStore.findById(imageId);
    if (!metadata) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Get thumbnail info for the requested size
    const thumbnailInfo = metadata.thumbnails[thumbnailSize];
    if (!thumbnailInfo) {
      return new NextResponse('Thumbnail not found', { status: 404 });
    }
    
    // Determine preferred format based on Accept header
    const acceptHeader = request.headers.get('accept') || '';
    const supportsWebP = acceptHeader.includes('image/webp');
    
    // Choose format: WebP for modern browsers, JPEG for fallback
    const useWebP = supportsWebP;
    
    // Build thumbnail file path
    const thumbnailPath = buildThumbnailPath(metadata.establishmentId.toString(), imageId, thumbnailSize, useWebP);
    
    try {
      // Check if file exists
      await stat(thumbnailPath);
      
      // Read thumbnail file
      const buffer = await readFile(thumbnailPath);
      
      // Check for conditional requests
      const etag = `"${imageId}-${thumbnailSize}-${metadata.uploadedAt.getTime()}"`;
      const conditionalResult = handleConditionalRequest(
        request.headers.get('if-none-match'),
        request.headers.get('if-modified-since'),
        etag,
        metadata.uploadedAt
      );
      
      if (conditionalResult.isNotModified) {
        return new NextResponse(null, {
          status: 304,
          headers: conditionalResult.headers,
        });
      }
      
      // Generate optimized headers
      const format = useWebP ? 'webp' : 'jpeg';
      
      // Convert IThumbnailSet to ThumbnailSet by adding url property
      const thumbnailsWithUrls = {
        small: {
          ...metadata.thumbnails.small,
          url: `/api/images/${imageId}/thumbnail/small`
        },
        medium: {
          ...metadata.thumbnails.medium,
          url: `/api/images/${imageId}/thumbnail/medium`
        },
        large: {
          ...metadata.thumbnails.large,
          url: `/api/images/${imageId}/thumbnail/large`
        },
        xlarge: {
          ...metadata.thumbnails.xlarge,
          url: `/api/images/${imageId}/thumbnail/xlarge`
        }
      };
      
      const imageMetadata = {
        id: metadata._id?.toString() || imageId,
        establishmentId: metadata.establishmentId.toString(),
        originalFilename: metadata.originalFilename,
        mimeType: metadata.mimeType,
        fileSize: metadata.fileSize,
        dimensions: metadata.dimensions,
        webpUrl: metadata.webpUrl,
        jpegFallbackUrl: metadata.jpegFallbackUrl,
        thumbnails: thumbnailsWithUrls,
        uploadedAt: metadata.uploadedAt,
        uploadedBy: metadata.uploadedBy.toString(),
      };
      const headers = generateImageResponseHeaders(imageMetadata, format, buffer.length, thumbnailSize);
      
      // Create response with optimized caching headers
      const response = new NextResponse(buffer, {
        status: 200,
        headers,
      });
      
      return response;
    } catch (fileError) {
      console.error('Thumbnail file not found:', thumbnailPath, fileError);
      
      // Return placeholder thumbnail for missing files
      return await serveThumbnailPlaceholder(thumbnailSize);
    }
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Validate and normalize thumbnail size parameter
 */
function validateThumbnailSize(size: string): ThumbnailSize | null {
  const validSizes: ThumbnailSize[] = ['small', 'medium', 'large', 'xlarge'];
  
  // Normalize size parameter
  const normalizedSize = size.toLowerCase() as ThumbnailSize;
  
  if (validSizes.includes(normalizedSize)) {
    return normalizedSize;
  }
  
  // Handle numeric sizes (map to closest standard size)
  const numericSize = parseInt(size);
  if (!isNaN(numericSize) && numericSize > 0) {
    if (numericSize <= 150) return 'small';
    if (numericSize <= 300) return 'medium';
    if (numericSize <= 600) return 'large';
    return 'xlarge';
  }
  
  return null;
}

/**
 * Build thumbnail file path based on directory structure
 */
function buildThumbnailPath(
  establishmentId: string,
  imageId: string,
  size: ThumbnailSize,
  useWebP: boolean
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const format = useWebP ? 'webp' : 'jpeg';
  const extension = useWebP ? 'webp' : 'jpg';
  
  const { width, height } = IMAGE_CONFIG.thumbnailSizes[size];
  const filename = `${imageId}_${width}x${height}.${extension}`;
  
  return path.join(
    process.cwd(),
    IMAGE_CONFIG.directories.base,
    establishmentId,
    year.toString(),
    month,
    IMAGE_CONFIG.directories.subdirs.thumbnails,
    size,
    filename
  );
}

/**
 * Serve placeholder thumbnail when original is missing
 */
async function serveThumbnailPlaceholder(size: ThumbnailSize): Promise<NextResponse> {
  try {
    const { width, height } = IMAGE_CONFIG.thumbnailSizes[size];
    
    // Create SVG placeholder with appropriate dimensions
    const svgPlaceholder = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="12" fill="#666">
          ${width}×${height}
        </text>
      </svg>
    `;
    
    const headers = generatePlaceholderHeaders('svg+xml', Buffer.byteLength(svgPlaceholder), size);
    
    return new NextResponse(svgPlaceholder, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving thumbnail placeholder:', error);
    return new NextResponse('Thumbnail not found', { status: 404 });
  }
}

// Export the GET handler with thumbnail access control middleware
export const GET = withThumbnailAccessControl(handleThumbnailServing);

