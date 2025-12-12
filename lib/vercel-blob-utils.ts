/**
 * Vercel Blob Utilities
 * Helper functions for optimal Vercel Blob usage
 */

import { put, del, list, head, copy } from '@vercel/blob';

export interface BlobMetadata {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  cacheControl?: string;
}

export interface BlobUploadOptions {
  contentType?: string;
  cacheControlMaxAge?: number;
  addRandomSuffix?: boolean;
  multipart?: boolean;
  access?: 'public' | 'private';
}

export interface BlobListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
}

/**
 * Enhanced blob upload with automatic optimization
 */
export async function uploadBlob(
  pathname: string,
  body: Buffer | Uint8Array | string,
  options: BlobUploadOptions = {}
): Promise<BlobMetadata> {
  const {
    contentType,
    cacheControlMaxAge = 31536000, // 1 year default
    addRandomSuffix = false,
    multipart = false,
    access = 'public'
  } = options;

  try {
    const result = await put(pathname, body, {
      access,
      contentType,
      cacheControlMaxAge,
      addRandomSuffix,
      multipart,
    });

    return {
      url: result.url,
      pathname: result.pathname,
      size: result.size,
      contentType: result.contentType || contentType || 'application/octet-stream',
      uploadedAt: result.uploadedAt,
      cacheControl: `max-age=${cacheControlMaxAge}`,
    };
  } catch (error) {
    console.error('Failed to upload blob:', error);
    throw new Error(`Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple blobs with validation
 */
export async function deleteBlobs(urls: string[]): Promise<{
  successful: string[];
  failed: Array<{ url: string; error: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  // Validate URLs are from Vercel Blob
  const validUrls = urls.filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('blob.vercel-storage.com') || 
             urlObj.hostname.includes('vercel-storage.com');
    } catch {
      failed.push({ url, error: 'Invalid URL format' });
      return false;
    }
  });

  // Delete in parallel with error handling
  const deletePromises = validUrls.map(async (url) => {
    try {
      await del(url);
      successful.push(url);
    } catch (error) {
      failed.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  await Promise.allSettled(deletePromises);

  return { successful, failed };
}

/**
 * List blobs with enhanced filtering
 */
export async function listBlobs(options: BlobListOptions = {}): Promise<{
  blobs: BlobMetadata[];
  hasMore: boolean;
  cursor?: string;
}> {
  const { limit = 100, prefix, cursor } = options;

  try {
    const result = await list({
      limit,
      prefix,
      cursor,
    });

    const blobs: BlobMetadata[] = result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      contentType: blob.contentType || 'application/octet-stream',
      uploadedAt: blob.uploadedAt,
    }));

    return {
      blobs,
      hasMore: result.hasMore || false,
      cursor: result.cursor,
    };
  } catch (error) {
    console.error('Failed to list blobs:', error);
    throw new Error(`Blob listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get blob metadata
 */
export async function getBlobMetadata(url: string): Promise<BlobMetadata | null> {
  try {
    const result = await head(url);
    
    return {
      url,
      pathname: new URL(url).pathname,
      size: result.size,
      contentType: result.contentType || 'application/octet-stream',
      uploadedAt: result.uploadedAt,
      cacheControl: result.cacheControl,
    };
  } catch (error) {
    console.error('Failed to get blob metadata:', error);
    return null;
  }
}

/**
 * Copy blob to new location
 */
export async function copyBlob(
  fromUrl: string,
  toPathname: string,
  options: BlobUploadOptions = {}
): Promise<BlobMetadata> {
  try {
    const result = await copy(fromUrl, toPathname, {
      access: options.access || 'public',
      addRandomSuffix: options.addRandomSuffix || false,
    });

    return {
      url: result.url,
      pathname: result.pathname,
      size: result.size,
      contentType: result.contentType || 'application/octet-stream',
      uploadedAt: result.uploadedAt,
    };
  } catch (error) {
    console.error('Failed to copy blob:', error);
    throw new Error(`Blob copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  imageFiles: number;
  thumbnails: number;
  averageSize: number;
  sizeByType: Record<string, { count: number; size: number }>;
}> {
  try {
    const { blobs } = await listBlobs({ limit: 1000 });
    
    const stats = {
      totalFiles: blobs.length,
      totalSize: blobs.reduce((sum, blob) => sum + blob.size, 0),
      imageFiles: blobs.filter(blob => blob.contentType.startsWith('image/')).length,
      thumbnails: blobs.filter(blob => blob.pathname.includes('thumbnails/')).length,
      averageSize: blobs.length > 0 ? Math.round(blobs.reduce((sum, blob) => sum + blob.size, 0) / blobs.length) : 0,
      sizeByType: {} as Record<string, { count: number; size: number }>,
    };

    // Group by content type
    blobs.forEach(blob => {
      const type = blob.contentType;
      if (!stats.sizeByType[type]) {
        stats.sizeByType[type] = { count: 0, size: 0 };
      }
      stats.sizeByType[type].count++;
      stats.sizeByType[type].size += blob.size;
    });

    return stats;
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    throw new Error(`Storage stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up old or unused blobs
 */
export async function cleanupBlobs(options: {
  olderThanDays?: number;
  prefix?: string;
  dryRun?: boolean;
} = {}): Promise<{
  deleted: string[];
  errors: Array<{ url: string; error: string }>;
  totalSize: number;
}> {
  const { olderThanDays = 30, prefix, dryRun = false } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const { blobs } = await listBlobs({ prefix, limit: 1000 });
    
    const oldBlobs = blobs.filter(blob => blob.uploadedAt < cutoffDate);
    const totalSize = oldBlobs.reduce((sum, blob) => sum + blob.size, 0);

    if (dryRun) {
      return {
        deleted: oldBlobs.map(blob => blob.url),
        errors: [],
        totalSize,
      };
    }

    const { successful, failed } = await deleteBlobs(oldBlobs.map(blob => blob.url));

    return {
      deleted: successful,
      errors: failed,
      totalSize,
    };
  } catch (error) {
    console.error('Failed to cleanup blobs:', error);
    throw new Error(`Blob cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate blob URL
 */
export function isValidBlobUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('blob.vercel-storage.com') || 
           urlObj.hostname.includes('vercel-storage.com');
  } catch {
    return false;
  }
}

/**
 * Extract pathname from blob URL
 */
export function extractPathnameFromBlobUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return null;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate optimized filename
 */
export function generateOptimizedFilename(originalName: string, options: {
  addTimestamp?: boolean;
  addUuid?: boolean;
  forceWebP?: boolean;
} = {}): string {
  const { addTimestamp = false, addUuid = true, forceWebP = true } = options;
  
  let name = originalName.toLowerCase();
  
  // Remove extension
  const lastDotIndex = name.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
  
  // Clean filename
  const cleanName = baseName
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  let filename = cleanName;
  
  if (addTimestamp) {
    filename += `-${Date.now()}`;
  }
  
  if (addUuid) {
    const { v4: uuidv4 } = require('uuid');
    filename += `-${uuidv4().split('-')[0]}`;
  }
  
  // Add extension
  const extension = forceWebP ? 'webp' : (originalName.split('.').pop() || 'jpg');
  filename += `.${extension}`;
  
  return filename;
}