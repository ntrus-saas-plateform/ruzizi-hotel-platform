/**
 * Migration script to move existing images from local storage to Vercel Blob
 * Run with: npx ts-node scripts/migrate-to-blob.ts
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { connectToDatabase } from '@/lib/mongodb';
import { Establishment } from '@/models/Establishment';
import { Accommodation } from '@/models/Accommodation';

interface MigrationResult {
  originalPath: string;
  originalUrl: string;
  newUrl: string;
  size: number;
  optimized: boolean;
}

interface MigrationStats {
  totalFiles: number;
  successful: number;
  failed: number;
  totalSizeBefore: number;
  totalSizeAfter: number;
  results: MigrationResult[];
  errors: string[];
}

class BlobMigrator {
  private stats: MigrationStats = {
    totalFiles: 0,
    successful: 0,
    failed: 0,
    totalSizeBefore: 0,
    totalSizeAfter: 0,
    results: [],
    errors: []
  };

  private dryRun: boolean;
  private verbose: boolean;

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Find all image files in the uploads directory
   */
  async findImageFiles(): Promise<string[]> {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    const imageFiles: string[] = [];

    try {
      const files = await readdir(uploadsDir);
      
      for (const file of files) {
        const filePath = join(uploadsDir, file);
        const fileStat = await stat(filePath);
        
        if (fileStat.isFile() && this.isImageFile(file)) {
          imageFiles.push(filePath);
        }
      }
    } catch (error) {
      console.error('Error reading uploads directory:', error);
    }

    return imageFiles;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * Optimize image for blob storage
   */
  async optimizeImage(buffer: Buffer, filename: string): Promise<{
    optimized: Buffer;
    size: number;
    format: string;
  }> {
    try {
      // Convert to WebP for better compression
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
      console.error(`Optimization failed for ${filename}:`, error);
      // Fallback to original
      return {
        optimized: buffer,
        size: buffer.length,
        format: filename.split('.').pop()?.toLowerCase() || 'jpg'
      };
    }
  }

  /**
   * Upload single file to Vercel Blob
   */
  async uploadToBlob(filePath: string): Promise<MigrationResult | null> {
    try {
      const filename = filePath.split('/').pop() || '';
      const buffer = await readFile(filePath);
      const originalSize = buffer.length;

      this.log(`📤 Processing: ${filename} (${this.formatSize(originalSize)})`);

      // Optimize image
      const { optimized, size, format } = await this.optimizeImage(buffer, filename);
      
      // Generate new filename with WebP extension
      const baseFilename = filename.substring(0, filename.lastIndexOf('.'));
      const newFilename = `${baseFilename}.${format}`;

      if (this.dryRun) {
        this.log(`🔍 [DRY RUN] Would upload: ${newFilename} (${this.formatSize(size)})`);
        
        return {
          originalPath: filePath,
          originalUrl: `/api/images/${filename}`,
          newUrl: `https://blob.vercel-storage.com/${newFilename}`, // Placeholder URL
          size,
          optimized: size < originalSize
        };
      }

      // Upload to Vercel Blob
      const { url } = await put(newFilename, optimized, {
        access: 'public',
        contentType: `image/${format}`,
        cacheControlMaxAge: 31536000, // 1 year cache
      });

      const result: MigrationResult = {
        originalPath: filePath,
        originalUrl: `/api/images/${filename}`,
        newUrl: url,
        size,
        optimized: size < originalSize
      };

      this.log(`✅ Uploaded: ${filename} → ${url}`);
      this.log(`   Size: ${this.formatSize(originalSize)} → ${this.formatSize(size)} (${size < originalSize ? 'optimized' : 'same'})`);

      return result;

    } catch (error) {
      const errorMessage = `Failed to upload ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.stats.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
      return null;
    }
  }

  /**
   * Update database references
   */
  async updateDatabaseReferences(results: MigrationResult[]): Promise<void> {
    if (this.dryRun) {
      this.log('🔍 [DRY RUN] Would update database references');
      return;
    }

    try {
      await connectToDatabase();

      let establishmentUpdates = 0;
      let accommodationUpdates = 0;

      // Update establishments
      const establishments = await Establishment.find({});
      for (const establishment of establishments) {
        let updated = false;
        
        if (establishment.images && Array.isArray(establishment.images)) {
          establishment.images = establishment.images.map((imageUrl: string) => {
            const result = results.find(r => r.originalUrl === imageUrl);
            if (result) {
              updated = true;
              return result.newUrl;
            }
            return imageUrl;
          });
        }

        if (updated) {
          await establishment.save();
          establishmentUpdates++;
          this.log(`📝 Updated establishment: ${establishment.name}`);
        }
      }

      // Update accommodations
      const accommodations = await Accommodation.find({});
      for (const accommodation of accommodations) {
        let updated = false;
        
        if (accommodation.images && Array.isArray(accommodation.images)) {
          accommodation.images = accommodation.images.map((imageUrl: string) => {
            const result = results.find(r => r.originalUrl === imageUrl);
            if (result) {
              updated = true;
              return result.newUrl;
            }
            return imageUrl;
          });
        }

        if (updated) {
          await accommodation.save();
          accommodationUpdates++;
          this.log(`📝 Updated accommodation: ${accommodation.name}`);
        }
      }

      this.log(`✅ Database updated: ${establishmentUpdates} establishments, ${accommodationUpdates} accommodations`);

    } catch (error) {
      console.error('❌ Failed to update database:', error);
      this.stats.errors.push(`Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<MigrationStats> {
    console.log('🚀 Starting Vercel Blob migration...');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`);
    
    if (!process.env.BLOB_READ_WRITE_TOKEN && !this.dryRun) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
    }

    // Find all image files
    const imageFiles = await this.findImageFiles();
    this.stats.totalFiles = imageFiles.length;

    console.log(`📁 Found ${imageFiles.length} image files`);

    if (imageFiles.length === 0) {
      console.log('ℹ️ No images to migrate');
      return this.stats;
    }

    // Process each file
    for (const filePath of imageFiles) {
      const result = await this.uploadToBlob(filePath);
      
      if (result) {
        this.stats.results.push(result);
        this.stats.successful++;
        this.stats.totalSizeAfter += result.size;
      } else {
        this.stats.failed++;
      }

      // Add original file size to stats
      try {
        const buffer = await readFile(filePath);
        this.stats.totalSizeBefore += buffer.length;
      } catch (error) {
        // Ignore error for stats
      }
    }

    // Update database references
    if (this.stats.results.length > 0) {
      await this.updateDatabaseReferences(this.stats.results);
    }

    return this.stats;
  }

  /**
   * Print migration summary
   */
  printSummary(): void {
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total files: ${this.stats.totalFiles}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total size before: ${this.formatSize(this.stats.totalSizeBefore)}`);
    console.log(`Total size after: ${this.formatSize(this.stats.totalSizeAfter)}`);
    
    if (this.stats.totalSizeBefore > 0) {
      const savings = this.stats.totalSizeBefore - this.stats.totalSizeAfter;
      const savingsPercent = (savings / this.stats.totalSizeBefore) * 100;
      console.log(`Size savings: ${this.formatSize(savings)} (${savingsPercent.toFixed(1)}%)`);
    }

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (!this.dryRun && this.stats.successful > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🗑️ You can now safely delete the local uploads directory');
      console.log('🔄 Update your deployment to use the new blob URLs');
    }
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  try {
    const migrator = new BlobMigrator({ dryRun, verbose });
    const stats = await migrator.migrate();
    migrator.printSummary();

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { BlobMigrator };