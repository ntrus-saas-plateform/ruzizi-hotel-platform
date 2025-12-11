/**
 * Image serving API route - GET /api/images/[id]
 * Serves main images with format detection based on Accept headers
 * Includes establishment-based access control and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import path from 'path';
import { IMAGE_CONFIG } from '@/lib/image/config';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import { imageErrorHandler } from '@/lib/image/error-handler';
import { 
  generateImageResponseHeaders, 
  generatePlaceholderHeaders,
  handleConditionalRequest 
} from '@/lib/image/cache-headers';
import { 
  withImageAccessControl, 
  type ImageAccessContext 
} from '@/lib/image/access-control.middleware';
import { recordImageServing } from '@/lib/image/performance-monitor';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Main image serving handler with access control
async function handleImageServing(
  request: NextRequest, 
  imageId: string, 
  context?: ImageAccessContext
): Promise<NextResponse> {
  const serveStartTime = performance.now();
  
  try {
    // Get image metadata from store
    const metadata = await imageMetadataStore.findById(imageId);
    if (!metadata) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Determine preferred format based on Accept header
    const acceptHeader = request.headers.get('accept') || '';
    const supportsWebP = acceptHeader.includes('image/webp');
    
    // Choose format: WebP for modern browsers, JPEG for fallback
    const useWebP = supportsWebP;
    const imagePath = useWebP ? metadata.webpUrl : metadata.jpegFallbackUrl;
    
    // Convert URL to file system path
    const filePath = path.join(process.cwd(), imagePath.replace('/api/images/', 'uploads/images/'));
    
    try {
      // Check if file exists
      await stat(filePath);
      
      // Read file
      const buffer = await readFile(filePath);
      
      // Check for conditional requests
      const etag = `"${imageId}-${metadata.uploadedAt.getTime()}"`;
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
      const headers = generateImageResponseHeaders(imageMetadata, format, buffer.length);
      
      // Record serving performance
      const serveTime = performance.now() - serveStartTime;
      const cacheHit = conditionalResult.isNotModified;
      recordImageServing(
        serveTime,
        format,
        null, // This is for main image, not thumbnail
        cacheHit,
        request.headers.get('user-agent') || undefined
      );
      
      // Create response with optimized caching headers
      const response = new NextResponse(buffer, {
        status: 200,
        headers,
      });
      
      return response;
    } catch (fileError) {
      console.error('File not found:', filePath, fileError);
      
      // Return placeholder image for missing files using error handler
      return await serveDefaultPlaceholder();
    }
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Serve default placeholder image when original is missing
 * Uses the enhanced error handler for consistent placeholder serving
 */
async function serveDefaultPlaceholder(): Promise<NextResponse> {
  try {
    const placeholder = await imageErrorHandler.getPlaceholderImage();
    const headers = generatePlaceholderHeaders(
      placeholder.contentType.includes('svg') ? 'svg+xml' : 'jpeg',
      placeholder.buffer.length
    );
    
    return new NextResponse(placeholder.buffer as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving placeholder:', error);
    
    // Last resort: return a simple text response
    return new NextResponse('Image not found', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Export the GET handler with access control middleware
export const GET = withImageAccessControl(handleImageServing);

