/**
 * TypeScript type definitions for image handling system
 */

import { ImageFormat } from './config';

import { ThumbnailSize } from './config';

export type { ThumbnailSize, ImageFormat } from './config';

export interface ImageUploadResult {
  id: string;
  originalPath: string;
  webpPath: string;
  jpegFallbackPath?: string;
  thumbnails: ThumbnailSet;
  metadata: ImageMetadata;
  url: string; // URL to be stored in existing images[] arrays
}

export interface ProcessedImage {
  webpPath: string;
  jpegFallbackPath: string;
  thumbnails: ThumbnailSet;
  metadata: ImageMetadata;
  buffers?: {
    webp: Buffer;
    jpeg: Buffer;
    thumbnails: {
      webp: Record<ThumbnailSize, Buffer>;
      jpeg: Record<ThumbnailSize, Buffer>;
    };
  };
}

export interface ImageMetadata {
  id: string;
  establishmentId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  webpUrl: string;
  jpegFallbackUrl: string;
  thumbnails: ThumbnailSet;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ThumbnailSet {
  small: ThumbnailInfo;
  medium: ThumbnailInfo;
  large: ThumbnailInfo;
  xlarge: ThumbnailInfo;
}

export interface ThumbnailInfo {
  path: string;
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: ImageFormat;
}

export interface ImageResponse {
  buffer: Buffer;
  contentType: string;
  cacheHeaders: Record<string, string>;
  metadata?: ImageMetadata;
}

export interface UploadOptions {
  establishmentId: string;
  userId: string;
  generateThumbnails?: boolean;
  quality?: number;
}

export interface ProcessingOptions {
  format?: ImageFormat;
  quality?: number;
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
}

export interface StorageOptions {
  preserveOriginal?: boolean;
  generateFallback?: boolean;
  customPath?: string;
}