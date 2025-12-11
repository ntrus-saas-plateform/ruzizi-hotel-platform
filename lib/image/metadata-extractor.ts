/**
 * Image metadata extraction service
 * Handles extraction of dimensions, file size, format information, and UUID-based filename generation
 */

import { randomUUID } from 'crypto';
import path from 'path';
import { extractMetadata } from './sharp-utils';
import { ImageMetadata, ThumbnailSet } from './types';

export class MetadataExtractor {
  /**
   * Extract complete metadata from image buffer
   */
  async extractImageMetadata(
    inputBuffer: Buffer,
    originalFilename: string,
    establishmentId: string,
    userId: string,
    webpUrl: string,
    jpegFallbackUrl: string,
    thumbnails: ThumbnailSet
  ): Promise<ImageMetadata> {
    // Extract basic metadata using Sharp
    const sharpMetadata = await extractMetadata(inputBuffer);
    
    // Generate unique ID for this image
    const imageId = randomUUID();
    
    // Determine MIME type from Sharp format
    const mimeType = this.formatToMimeType(sharpMetadata.format || 'jpeg');
    
    // Create complete metadata object with all required fields
    const metadata: ImageMetadata = {
      id: imageId,
      establishmentId,
      originalFilename,
      mimeType,
      fileSize: sharpMetadata.size,
      dimensions: {
        width: sharpMetadata.width,
        height: sharpMetadata.height
      },
      webpUrl,
      jpegFallbackUrl,
      thumbnails,
      uploadedAt: new Date(),
      uploadedBy: userId
    };
    
    return metadata;
  }

  /**
   * Generate UUID-based filename to prevent conflicts
   */
  generateUniqueFilename(originalFilename?: string): string {
    const uuid = randomUUID();
    
    if (originalFilename) {
      const ext = path.extname(originalFilename).toLowerCase();
      // Sanitize extension to prevent issues
      const sanitizedExt = this.sanitizeExtension(ext);
      return `${uuid}${sanitizedExt}`;
    }
    
    return uuid;
  }

  /**
   * Generate unique ID for image
   */
  generateImageId(): string {
    return randomUUID();
  }

  /**
   * Extract basic image information without full processing
   */
  async extractBasicInfo(inputBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    channels: number;
  }> {
    const metadata = await extractMetadata(inputBuffer);
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
      size: metadata.size,
      hasAlpha: metadata.hasAlpha || false,
      channels: metadata.channels || 3
    };
  }

  /**
   * Convert Sharp format to MIME type
   */
  private formatToMimeType(format: string): string {
    const formatMap: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'tiff': 'image/tiff',
      'bmp': 'image/bmp'
    };
    
    return formatMap[format.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Sanitize file extension to prevent security issues
   */
  private sanitizeExtension(ext: string): string {
    // Remove any dangerous characters and ensure it's a valid image extension
    const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp'];
    
    if (allowedExtensions.includes(cleanExt)) {
      return cleanExt;
    }
    
    // Default to .jpg if extension is not recognized
    return '.jpg';
  }

  /**
   * Create metadata object for existing images (migration support)
   */
  createMetadataFromExisting(
    imageId: string,
    establishmentId: string,
    originalFilename: string,
    fileSize: number,
    dimensions: { width: number; height: number },
    format: string,
    userId: string,
    webpUrl: string,
    jpegFallbackUrl: string,
    thumbnails: ThumbnailSet,
    uploadedAt?: Date
  ): ImageMetadata {
    return {
      id: imageId,
      establishmentId,
      originalFilename,
      mimeType: this.formatToMimeType(format),
      fileSize,
      dimensions,
      webpUrl,
      jpegFallbackUrl,
      thumbnails,
      uploadedAt: uploadedAt || new Date(),
      uploadedBy: userId
    };
  }

  /**
   * Validate metadata completeness
   */
  validateMetadata(metadata: ImageMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!metadata.id) errors.push('Missing image ID');
    if (!metadata.establishmentId) errors.push('Missing establishment ID');
    if (!metadata.originalFilename) errors.push('Missing original filename');
    if (!metadata.mimeType) errors.push('Missing MIME type');
    if (!metadata.fileSize || metadata.fileSize <= 0) errors.push('Invalid file size');
    if (!metadata.dimensions.width || metadata.dimensions.width <= 0) errors.push('Invalid width');
    if (!metadata.dimensions.height || metadata.dimensions.height <= 0) errors.push('Invalid height');
    if (!metadata.webpUrl) errors.push('Missing WebP URL');
    if (!metadata.jpegFallbackUrl) errors.push('Missing JPEG fallback URL');
    if (!metadata.thumbnails) errors.push('Missing thumbnails');
    if (!metadata.uploadedAt) errors.push('Missing upload date');
    if (!metadata.uploadedBy) errors.push('Missing uploader ID');
    
    // Validate thumbnails
    if (metadata.thumbnails) {
      const requiredSizes = ['small', 'medium', 'large', 'xlarge'];
      for (const size of requiredSizes) {
        const thumbnail = metadata.thumbnails[size as keyof ThumbnailSet];
        if (!thumbnail) {
          errors.push(`Missing ${size} thumbnail`);
        } else {
          if (!thumbnail.path) errors.push(`Missing ${size} thumbnail path`);
          if (!thumbnail.url) errors.push(`Missing ${size} thumbnail URL`);
          if (!thumbnail.width || thumbnail.width <= 0) errors.push(`Invalid ${size} thumbnail width`);
          if (!thumbnail.height || thumbnail.height <= 0) errors.push(`Invalid ${size} thumbnail height`);
          if (!thumbnail.fileSize || thumbnail.fileSize <= 0) errors.push(`Invalid ${size} thumbnail file size`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const metadataExtractor = new MetadataExtractor();