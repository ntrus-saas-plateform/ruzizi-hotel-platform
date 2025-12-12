/**
 * Migration script to move existing images from local storage to Vercel Blob
 * Run with: node scripts/migrate-to-blob.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { readdir, readFile, stat } = require('fs/promises');
const { join } = require('path');
const { put } = require('@vercel/blob');

class BlobMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.stats = {
      totalFiles: 0,
      successful: 0,
      failed: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      results: [],
      errors: []
    };
  }

  /**
   * Find all image files in the uploads directory
   */
  async findImageFiles() {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    const imageFiles = [];

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
      console.log('ℹ️ No local images found to migrate');
    }

    return imageFiles;
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * Upload single file to Vercel Blob
   */
  async uploadToBlob(filePath) {
    try {
      const filename = filePath.split('/').pop() || filePath.split('\\').pop() || '';
      const buffer = await readFile(filePath);
      const originalSize = buffer.length;

      this.log(`📤 Processing: ${filename} (${this.formatSize(originalSize)})`);

      // Generate clean filename (just the UUID part)
      const cleanFilename = filename; // Keep original filename
      const baseFilename = cleanFilename.substring(0, cleanFilename.lastIndexOf('.'));
      const extension = cleanFilename.split('.').pop();
      const newFilename = `${baseFilename}.${extension}`;

      if (this.dryRun) {
        this.log(`🔍 [DRY RUN] Would upload: ${newFilename} (${this.formatSize(originalSize)})`);
        
        return {
          originalPath: filePath,
          originalUrl: `/api/images/${filename}`,
          newUrl: `https://blob.vercel-storage.com/${newFilename}`, // Placeholder URL
          size: originalSize,
          optimized: false
        };
      }

      // Upload to Vercel Blob
      const { url } = await put(newFilename, buffer, {
        access: 'public',
        contentType: `image/${extension}`,
        cacheControlMaxAge: 31536000, // 1 year cache
      });

      const result = {
        originalPath: filePath,
        originalUrl: `/api/images/${filename}`,
        newUrl: url,
        size: originalSize,
        optimized: false
      };

      this.log(`✅ Uploaded: ${filename} → ${url}`);

      return result;

    } catch (error) {
      const errorMessage = `Failed to upload ${filePath}: ${error.message}`;
      this.stats.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
      return null;
    }
  }

  /**
   * Run the migration
   */
  async migrate() {
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

    return this.stats;
  }

  /**
   * Print migration summary
   */
  printSummary() {
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total files: ${this.stats.totalFiles}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total size: ${this.formatSize(this.stats.totalSizeBefore)}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (!this.dryRun && this.stats.successful > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🔄 Update your database with the new URLs:');
      this.stats.results.forEach(result => {
        console.log(`   ${result.originalUrl} → ${result.newUrl}`);
      });
    }
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  formatSize(bytes) {
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
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { BlobMigrator };