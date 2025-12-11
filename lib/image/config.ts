/**
 * Image processing configuration for Sharp library
 */

export const IMAGE_CONFIG = {
  // WebP conversion settings
  webp: {
    quality: 85,
    effort: 4, // Balance between compression and speed (0-6)
    lossless: false,
  },
  
  // JPEG fallback settings
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true,
  },
  
  // PNG settings
  png: {
    quality: 85,
    compressionLevel: 6,
    progressive: true,
  },
  
  // Thumbnail sizes as per requirements
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 400 },
    xlarge: { width: 1200, height: 800 },
  },
  
  // File validation settings
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
    allowedMimeTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  
  // Directory structure settings
  directories: {
    base: 'uploads/images',
    subdirs: {
      originals: 'originals',
      webp: 'webp',
      jpeg: 'jpeg',
      thumbnails: 'thumbnails',
    }
  },
  
  // File permissions
  permissions: {
    files: 0o644,
    directories: 0o755,
  }
} as const;

export type ThumbnailSize = keyof typeof IMAGE_CONFIG.thumbnailSizes;
export type ImageFormat = 'webp' | 'jpeg' | 'png';