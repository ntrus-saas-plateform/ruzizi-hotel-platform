/**
 * Sharp utility functions for image processing
 */

import sharp from 'sharp';
import { IMAGE_CONFIG, ThumbnailSize, ImageFormat } from './config';
import { ProcessingOptions, OptimizationResult, ThumbnailInfo } from './types';

/**
 * Initialize Sharp with optimal settings
 */
export function initializeSharp() {
  // Configure Sharp for optimal performance
  sharp.cache({ files: 0 }); // Disable file caching to prevent memory issues
  sharp.concurrency(1); // Limit concurrency for stability
}

/**
 * Convert image to WebP format with specified quality
 * Includes error handling and validation
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  quality: number = IMAGE_CONFIG.webp.quality
): Promise<Buffer> {
  try {
    // Validate input buffer first
    if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
      throw new Error('Invalid input buffer for WebP conversion');
    }

    // Validate quality parameter
    if (quality < 0 || quality > 100) {
      throw new Error(`Invalid quality parameter: ${quality}. Must be between 0 and 100.`);
    }

    const result = await sharp(inputBuffer)
      .webp({
        quality,
        effort: IMAGE_CONFIG.webp.effort,
        lossless: IMAGE_CONFIG.webp.lossless,
      })
      .toBuffer();

    // Validate output
    if (!result || result.length === 0) {
      throw new Error('WebP conversion produced empty result');
    }

    return result;
  } catch (error) {
    console.error('WebP conversion failed:', error);
    throw new Error(`WebP conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert image to JPEG format (fallback)
 * Includes error handling and validation
 */
export async function convertToJPEG(
  inputBuffer: Buffer,
  quality: number = IMAGE_CONFIG.jpeg.quality
): Promise<Buffer> {
  try {
    // Validate input buffer first
    if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
      throw new Error('Invalid input buffer for JPEG conversion');
    }

    // Validate quality parameter
    if (quality < 0 || quality > 100) {
      throw new Error(`Invalid quality parameter: ${quality}. Must be between 0 and 100.`);
    }

    const result = await sharp(inputBuffer)
      .jpeg({
        quality,
        progressive: IMAGE_CONFIG.jpeg.progressive,
        mozjpeg: IMAGE_CONFIG.jpeg.mozjpeg,
      })
      .toBuffer();

    // Validate output
    if (!result || result.length === 0) {
      throw new Error('JPEG conversion produced empty result');
    }

    return result;
  } catch (error) {
    console.error('JPEG conversion failed:', error);
    throw new Error(`JPEG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate thumbnail for specific size
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  size: ThumbnailSize,
  format: ImageFormat = 'webp'
): Promise<Buffer> {
  const { width, height } = IMAGE_CONFIG.thumbnailSizes[size];
  
  let pipeline = sharp(inputBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    });

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp(IMAGE_CONFIG.webp);
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg(IMAGE_CONFIG.jpeg);
      break;
    case 'png':
      pipeline = pipeline.png(IMAGE_CONFIG.png);
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Generate all required thumbnails
 */
export async function generateAllThumbnails(
  inputBuffer: Buffer,
  format: ImageFormat = 'webp'
): Promise<Record<ThumbnailSize, Buffer>> {
  const thumbnails: Record<ThumbnailSize, Buffer> = {} as any;
  
  for (const size of Object.keys(IMAGE_CONFIG.thumbnailSizes) as ThumbnailSize[]) {
    thumbnails[size] = await generateThumbnail(inputBuffer, size, format);
  }
  
  return thumbnails;
}

/**
 * Extract image metadata
 */
export async function extractMetadata(inputBuffer: Buffer) {
  const metadata = await sharp(inputBuffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format,
    size: metadata.size || inputBuffer.length,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    channels: metadata.channels,
  };
}

/**
 * Optimize image with specified options
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<{ buffer: Buffer; result: OptimizationResult }> {
  const originalSize = inputBuffer.length;
  let pipeline = sharp(inputBuffer);
  
  // Apply resize if specified
  if (options.resize) {
    pipeline = pipeline.resize(options.resize.width, options.resize.height, {
      fit: options.resize.fit || 'cover',
    });
  }
  
  // Apply format conversion
  const format = options.format || 'webp';
  const quality = options.quality || IMAGE_CONFIG[format].quality;
  
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ ...IMAGE_CONFIG.webp, quality });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ ...IMAGE_CONFIG.jpeg, quality });
      break;
    case 'png':
      pipeline = pipeline.png({ ...IMAGE_CONFIG.png, quality });
      break;
  }
  
  const buffer = await pipeline.toBuffer();
  const optimizedSize = buffer.length;
  
  return {
    buffer,
    result: {
      originalSize,
      optimizedSize,
      compressionRatio: (originalSize - optimizedSize) / originalSize,
      format,
    },
  };
}

/**
 * Validate image buffer using Sharp
 */
export async function validateImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!(metadata.width && metadata.height && metadata.format);
  } catch {
    return false;
  }
}