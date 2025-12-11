/**
 * Cache headers and optimization utilities for image serving
 * Implements 1-year cache headers, ETag support, and compression optimization
 */

import { ImageMetadata } from './types';

export interface CacheHeaderOptions {
  imageId: string;
  uploadedAt: Date;
  thumbnailSize?: string;
  maxAge?: number;
  isPlaceholder?: boolean;
}

/**
 * Generate cache headers for image responses
 * Implements 1-year cache for images as per requirements
 */
export function generateCacheHeaders(options: CacheHeaderOptions): Record<string, string> {
  const { imageId, uploadedAt, thumbnailSize, maxAge, isPlaceholder } = options;
  
  // Use shorter cache for placeholders
  const cacheMaxAge = isPlaceholder ? 3600 : (maxAge || 31536000); // 1 hour vs 1 year
  
  // Generate ETag for conditional requests
  const etagComponents = [imageId, uploadedAt.getTime()];
  if (thumbnailSize) {
    etagComponents.push(thumbnailSize);
  }
  const etag = `"${etagComponents.join('-')}"`;
  
  return {
    'Cache-Control': `public, max-age=${cacheMaxAge}, immutable`,
    'ETag': etag,
    'Last-Modified': uploadedAt.toUTCString(),
    'Expires': new Date(Date.now() + cacheMaxAge * 1000).toUTCString(),
  };
}

/**
 * Generate security headers for image responses
 */
export function generateSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  };
}

/**
 * Generate compression optimization headers
 */
export function generateCompressionHeaders(
  contentLength: number,
  format: 'webp' | 'jpeg' | 'png' | 'svg+xml'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Length': contentLength.toString(),
    'Content-Type': `image/${format}`,
  };
  
  // Add compression hints for browsers
  if (format === 'webp') {
    headers['X-Content-Encoding'] = 'webp-optimized';
  }
  
  // Add optimization metadata
  headers['X-Image-Optimized'] = 'true';
  
  return headers;
}

/**
 * Check if request supports conditional caching
 */
export function handleConditionalRequest(
  ifNoneMatch: string | null,
  ifModifiedSince: string | null,
  etag: string,
  lastModified: Date
): { isNotModified: boolean; headers: Record<string, string> } {
  const headers: Record<string, string> = {
    'ETag': etag,
    'Last-Modified': lastModified.toUTCString(),
  };
  
  // Check ETag match
  if (ifNoneMatch === etag) {
    return {
      isNotModified: true,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    };
  }
  
  // Check If-Modified-Since
  if (ifModifiedSince) {
    const ifModifiedSinceDate = new Date(ifModifiedSince);
    if (lastModified <= ifModifiedSinceDate) {
      return {
        isNotModified: true,
        headers: {
          ...headers,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      };
    }
  }
  
  return { isNotModified: false, headers };
}

/**
 * Generate complete response headers for image serving
 */
export function generateImageResponseHeaders(
  metadata: ImageMetadata,
  format: 'webp' | 'jpeg' | 'png',
  contentLength: number,
  thumbnailSize?: string
): Record<string, string> {
  const cacheHeaders = generateCacheHeaders({
    imageId: metadata.id,
    uploadedAt: metadata.uploadedAt,
    thumbnailSize,
  });
  
  const securityHeaders = generateSecurityHeaders();
  const compressionHeaders = generateCompressionHeaders(contentLength, format);
  
  const additionalHeaders: Record<string, string> = {};
  
  // Add thumbnail-specific headers
  if (thumbnailSize) {
    additionalHeaders['X-Thumbnail-Size'] = thumbnailSize;
    additionalHeaders['X-Original-Dimensions'] = `${metadata.dimensions.width}x${metadata.dimensions.height}`;
  }
  
  // Add metadata headers
  additionalHeaders['X-Image-ID'] = metadata.id;
  additionalHeaders['X-Establishment-ID'] = metadata.establishmentId;
  
  return {
    ...cacheHeaders,
    ...securityHeaders,
    ...compressionHeaders,
    ...additionalHeaders,
  };
}

/**
 * Generate placeholder response headers
 */
export function generatePlaceholderHeaders(
  format: 'svg+xml' | 'jpeg',
  contentLength: number,
  thumbnailSize?: string
): Record<string, string> {
  const now = new Date();
  
  const cacheHeaders = generateCacheHeaders({
    imageId: 'placeholder',
    uploadedAt: now,
    thumbnailSize,
    isPlaceholder: true,
  });
  
  const securityHeaders = generateSecurityHeaders();
  const compressionHeaders = generateCompressionHeaders(contentLength, format);
  
  const additionalHeaders: Record<string, string> = {
    'X-Image-Placeholder': 'true',
  };
  
  if (thumbnailSize) {
    additionalHeaders['X-Thumbnail-Size'] = thumbnailSize;
  }
  
  return {
    ...cacheHeaders,
    ...securityHeaders,
    ...compressionHeaders,
    ...additionalHeaders,
  };
}

/**
 * Validate and normalize cache control directives
 */
export function validateCacheControl(cacheControl: string): boolean {
  const validDirectives = [
    'public',
    'private',
    'no-cache',
    'no-store',
    'max-age',
    'immutable',
    'must-revalidate',
  ];
  
  const directives = cacheControl.split(',').map(d => d.trim().split('=')[0]);
  
  return directives.every(directive => 
    validDirectives.includes(directive) || directive.startsWith('max-age')
  );
}

/**
 * Calculate optimal cache duration based on image characteristics
 */
export function calculateOptimalCacheDuration(metadata: ImageMetadata): number {
  // Base cache duration: 1 year for images
  let cacheDuration = 31536000; // 1 year in seconds
  
  // Reduce cache time for very recent uploads (allow for corrections)
  const uploadAge = Date.now() - metadata.uploadedAt.getTime();
  const oneHour = 3600000; // 1 hour in milliseconds
  
  if (uploadAge < oneHour) {
    cacheDuration = 3600; // 1 hour for very recent uploads
  } else if (uploadAge < oneHour * 24) {
    cacheDuration = 86400; // 1 day for uploads less than 24 hours old
  }
  
  return cacheDuration;
}