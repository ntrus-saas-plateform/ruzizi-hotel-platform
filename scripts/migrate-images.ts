#!/usr/bin/env ts-node

/**
 * Image Migration CLI Tool
 * 
 * Migrates base64 images to file system storage with WebP conversion
 * 
 * Usage:
 *   npx ts-node scripts/migrate-images.ts [options]
 * 
 * Options:
 *   --dry-run          Run without making changes (default: false)
 *   --batch-size <n>   Number of entities to process per batch (default: 10)
 *   --skip-errors      Continue processing on errors (default: true)
 *   --entity-type <t>  Process only specific entity type: establishment|accommodation|all (default: all)
 *   --entity-id <id>   Process only specific entity ID
 *   --stats            Show migration statistics only
 *   --verify           Verify migration completeness
 *   --rollback <id>    Rollback migration for specific entity (requires backup)
 *   --help             Show this help message
 * 
 * Examples:
 *   npx ts-node scripts/migrate-images.ts --dry-run
 *   npx ts-node scripts/migrate-images.ts --stats
 *   npx ts-node scripts/migrate-images.ts --verify
 *   npx ts-node scripts/migrate-images.ts --entity-type establishment --batch-size 5
 *   npx ts-node scripts/migrate-images.ts --entity-id 507f1f77bcf86cd799439011
 */

import { MongoClient } from 'mongodb';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';

// Types for migration
interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipErrors: boolean;
  entityType: 'establishment' | 'accommodation' | 'all';
  entityId?: string;
  progressCallback?: (progress: MigrationProgress) => void;
  errorCallback?: (error: any) => void;
}

interface MigrationProgress {
  totalEntities: number;
  processedEntities: number;
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  currentEntity?: string;
  currentImage?: string;
  errors: Array<{
    entityId: string;
    entityType: 'establishment' | 'accommodation';
    imageIndex: number;
    base64Data: string;
    error: string;
    timestamp: Date;
  }>;
}

interface Base64ImageInfo {
  type: 'establishment' | 'accommodation';
  id: string;
  base64Images: string[];
  entityName?: string;
}

interface CLIOptions {
  dryRun: boolean;
  batchSize: number;
  skipErrors: boolean;
  entityType: 'establishment' | 'accommodation' | 'all';
  entityId?: string;
  stats: boolean;
  verify: boolean;
  rollback?: string;
  help: boolean;
  verbose: boolean;
}

class ImageMigrationCLI {
  private options: CLIOptions;
  private startTime: Date = new Date();
  private logFile: string;
  private client: MongoClient | null = null;

  constructor() {
    this.options = this.parseArguments();
    this.logFile = `migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  }

  /**
   * Connect to MongoDB
   */
  private async connectToDatabase(): Promise<void> {
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.log('✅ Database connected', 'success');
    } catch (error) {
      this.log(`Failed to connect to database: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Close database connection
   */
  private async closeDatabaseConnection(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Check if a string is a base64 image
   */
  private isBase64Image(imageString: string): boolean {
    if (!imageString || typeof imageString !== 'string') {
      return false;
    }
    
    // Check if it matches the full base64 image pattern
    const base64ImagePattern = /^data:image\/[a-zA-Z0-9+\-.]+;base64,/;
    return base64ImagePattern.test(imageString) && imageString.split(';base64,')[1]?.length > 0;
  }

  /**
   * Detect all base64 images in the database
   */
  private async detectBase64Images(): Promise<Base64ImageInfo[]> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    try {
      const db = this.client.db();
      const results: Base64ImageInfo[] = [];

      // Find establishments with base64 images
      const establishments = await db.collection('establishments').find({
        images: { $regex: /^data:image\// }
      }).toArray();

      for (const establishment of establishments) {
        const base64Images = establishment.images?.filter((image: string) => 
          this.isBase64Image(image)
        ) || [];
        
        if (base64Images.length > 0) {
          results.push({
            type: 'establishment',
            id: establishment._id.toString(),
            entityName: establishment.name,
            base64Images,
          });
        }
      }

      // Find accommodations with base64 images
      const accommodations = await db.collection('accommodations').find({
        images: { $regex: /^data:image\// }
      }).toArray();

      for (const accommodation of accommodations) {
        const base64Images = accommodation.images?.filter((image: string) => 
          this.isBase64Image(image)
        ) || [];
        
        if (base64Images.length > 0) {
          results.push({
            type: 'accommodation',
            id: accommodation._id.toString(),
            entityName: accommodation.name,
            base64Images,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to detect base64 images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse command line arguments
   */
  private parseArguments(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {
      dryRun: false,
      batchSize: 10,
      skipErrors: true,
      entityType: 'all',
      stats: false,
      verify: false,
      help: false,
      verbose: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 10;
          break;
        case '--skip-errors':
          options.skipErrors = args[++i]?.toLowerCase() !== 'false';
          break;
        case '--entity-type':
          const entityType = args[++i] as 'establishment' | 'accommodation' | 'all';
          if (['establishment', 'accommodation', 'all'].includes(entityType)) {
            options.entityType = entityType;
          }
          break;
        case '--entity-id':
          options.entityId = args[++i];
          break;
        case '--stats':
          options.stats = true;
          break;
        case '--verify':
          options.verify = true;
          break;
        case '--rollback':
          options.rollback = args[++i];
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--help':
          options.help = true;
          break;
        default:
          if (arg.startsWith('--')) {
            this.log(`⚠️  Unknown option: ${arg}`, 'warn');
          }
          break;
      }
    }

    return options;
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    const helpText = `
🖼️  Image Migration CLI Tool

Migrates base64 images to file system storage with WebP conversion

USAGE:
  npx ts-node scripts/migrate-images.ts [options]

OPTIONS:
  --dry-run              Run without making changes (default: false)
  --batch-size <n>       Number of entities to process per batch (default: 10)
  --skip-errors          Continue processing on errors (default: true)
  --entity-type <type>   Process only specific entity type:
                         establishment | accommodation | all (default: all)
  --entity-id <id>       Process only specific entity ID
  --stats                Show migration statistics only
  --verify               Verify migration completeness
  --rollback <id>        Rollback migration for specific entity (requires backup)
  --verbose              Enable verbose logging
  --help                 Show this help message

EXAMPLES:
  # Show statistics
  npx ts-node scripts/migrate-images.ts --stats

  # Dry run to see what would be migrated
  npx ts-node scripts/migrate-images.ts --dry-run --verbose

  # Verify migration completeness
  npx ts-node scripts/migrate-images.ts --verify

  # Migrate all entities with small batch size
  npx ts-node scripts/migrate-images.ts --batch-size 5

  # Migrate only establishments
  npx ts-node scripts/migrate-images.ts --entity-type establishment

  # Migrate specific entity
  npx ts-node scripts/migrate-images.ts --entity-id 507f1f77bcf86cd799439011

  # Production migration (careful!)
  npx ts-node scripts/migrate-images.ts --skip-errors true --batch-size 20

SAFETY:
  - Always run with --dry-run first to preview changes
  - Use --verify to check migration completeness
  - Backup your database before running migration
  - Monitor disk space during migration
  - Use smaller batch sizes for large datasets

LOG FILES:
  Migration logs are saved to: migration-YYYY-MM-DDTHH-mm-ss.log
`;

    console.log(helpText);
  }

  /**
   * Log message with timestamp and level
   */
  private log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
    const timestamp = new Date().toISOString();
    const icons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };
    
    const logMessage = `[${timestamp}] ${icons[level]} ${message}`;
    
    // Console output with colors
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'success':
        console.log(logMessage);
        break;
      default:
        console.log(logMessage);
    }

    // TODO: Write to log file in production
    // fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  /**
   * Show progress bar
   */
  private showProgress(current: number, total: number, label: string = ''): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r${label} [${bar}] ${percentage}% (${current}/${total})`);
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Show migration statistics
   */
  async showStatistics(): Promise<void> {
    try {
      this.log('📊 Gathering migration statistics...', 'info');
      
      const base64Images = await this.detectBase64Images();
      const totalBase64Images = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
      const establishmentsWithBase64 = base64Images.filter(entity => entity.type === 'establishment').length;
      const accommodationsWithBase64 = base64Images.filter(entity => entity.type === 'accommodation').length;
      
      // Estimate migration time (assuming 2 seconds per image)
      const estimatedMigrationTime = Math.ceil(totalBase64Images * 2 / 60);
      
      // Estimate storage size (assuming average 500KB per processed image with thumbnails)
      const estimatedStorageSize = totalBase64Images * 500 * 1024;
      
      console.log('\n📈 MIGRATION STATISTICS');
      console.log('═'.repeat(50));
      console.log(`Total Base64 Images:           ${totalBase64Images.toLocaleString()}`);
      console.log(`Entities with Base64:          ${base64Images.length.toLocaleString()}`);
      console.log(`  - Establishments:            ${establishmentsWithBase64.toLocaleString()}`);
      console.log(`  - Accommodations:            ${accommodationsWithBase64.toLocaleString()}`);
      console.log(`Estimated Migration Time:      ${estimatedMigrationTime} minutes`);
      console.log(`Estimated Storage Required:    ${this.formatFileSize(estimatedStorageSize)}`);
      
      console.log('\n🔍 MIGRATION STATUS');
      console.log('═'.repeat(50));
      const isComplete = totalBase64Images === 0;
      console.log(`Migration Complete:            ${isComplete ? '✅ Yes' : '❌ No'}`);
      console.log(`Remaining Base64 Images:       ${totalBase64Images.toLocaleString()}`);
      
      if (base64Images.length > 0) {
        console.log('\n📋 ENTITIES NEEDING MIGRATION');
        console.log('═'.repeat(50));
        
        base64Images.slice(0, 10).forEach((entity, index) => {
          console.log(`${index + 1}. ${entity.type}: ${entity.entityName || entity.id}`);
          console.log(`   Base64 Images: ${entity.base64Images.length}`);
        });
        
        if (base64Images.length > 10) {
          console.log(`   ... and ${base64Images.length - 10} more entities`);
        }
      }
      
      console.log('\n💡 RECOMMENDATIONS');
      console.log('═'.repeat(50));
      if (isComplete) {
        console.log('1. Migration is complete - all base64 images have been converted');
        console.log('2. Consider running cleanup operations to remove orphaned files');
      } else {
        console.log('1. Run the migration process to convert remaining base64 images');
        console.log('2. Use migration CLI tool for detailed progress tracking');
        if (base64Images.length < 10) {
          console.log('3. Consider migrating entities individually for better error handling');
        }
      }
      
    } catch (error) {
      this.log(`Failed to get statistics: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Verify migration completeness
   */
  async verifyMigration(): Promise<void> {
    try {
      this.log('🔍 Verifying migration completeness...', 'info');
      
      const base64Images = await this.detectBase64Images();
      const totalBase64Images = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
      
      console.log('\n🔍 MIGRATION VERIFICATION REPORT');
      console.log('═'.repeat(60));
      
      if (totalBase64Images === 0) {
        this.log('Migration is COMPLETE! 🎉', 'success');
        console.log(`✅ No base64 images found in the database`);
        console.log(`✅ All images have been successfully converted`);
      } else {
        this.log('Migration is INCOMPLETE', 'warn');
        console.log(`❌ ${base64Images.length} entities still need migration`);
        console.log(`❌ ${totalBase64Images} base64 images remain`);
        
        console.log('\n📋 INCOMPLETE ENTITIES:');
        base64Images.forEach((entity, index) => {
          console.log(`${index + 1}. ${entity.type}: ${entity.entityName || entity.id}`);
          console.log(`   📊 ${entity.base64Images.length} base64 images`);
        });
      }
      
      console.log('\n📊 SUMMARY:');
      console.log(`Entities with Base64:  ${base64Images.length}`);
      console.log(`Base64 Images:         ${totalBase64Images}`);
      
      console.log('\n💡 RECOMMENDATIONS:');
      if (totalBase64Images === 0) {
        console.log('1. Migration is complete - all base64 images have been converted');
        console.log('2. Consider running cleanup operations to remove orphaned files');
      } else {
        console.log('1. Run batch migration to convert remaining base64 images');
        console.log('2. Use migration CLI tool for detailed progress tracking');
        if (base64Images.length < 10) {
          console.log('3. Consider migrating entities individually for better error handling');
        }
      }
      
    } catch (error) {
      this.log(`Verification failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Progress callback for migration
   */
  private createProgressCallback(): (progress: MigrationProgress) => void {
    let lastUpdate = 0;
    
    return (progress: MigrationProgress) => {
      const now = Date.now();
      
      // Update progress every 1 second to avoid spam
      if (now - lastUpdate < 1000) return;
      lastUpdate = now;
      
      if (this.options.verbose) {
        console.log(`\n📊 Progress Update:`);
        console.log(`   Entities: ${progress.processedEntities}/${progress.totalEntities}`);
        console.log(`   Images: ${progress.processedImages}/${progress.totalImages}`);
        console.log(`   Success: ${progress.successfulImages}, Failed: ${progress.failedImages}`);
        if (progress.currentEntity) {
          console.log(`   Current: ${progress.currentEntity}`);
        }
        if (progress.currentImage) {
          console.log(`   Image: ${progress.currentImage}`);
        }
      } else {
        // Show simple progress bar
        this.showProgress(
          progress.processedImages,
          progress.totalImages,
          '🖼️  Migrating images'
        );
      }
    };
  }

  /**
   * Error callback for migration
   */
  private createErrorCallback(): (error: any) => void {
    return (error: any) => {
      if (this.options.verbose) {
        this.log(`Migration error: ${error}`, 'error');
      }
    };
  }

  /**
   * Run migration for specific entity
   */
  async migrateEntity(entityType: 'establishment' | 'accommodation', entityId: string): Promise<void> {
    try {
      this.log(`🎯 Migrating specific ${entityType}: ${entityId}`, 'info');
      
      // First, detect base64 images for this entity
      const allBase64Images = await this.detectBase64Images();
      const entityInfo = allBase64Images.find(
        entity => entity.type === entityType && entity.id === entityId
      );
      
      if (!entityInfo) {
        this.log(`No base64 images found for ${entityType} ${entityId}`, 'warn');
        return;
      }
      
      this.log(`Found ${entityInfo.base64Images.length} base64 images to migrate`, 'info');
      
      if (this.options.dryRun) {
        this.log('DRY RUN: Would migrate the following images:', 'info');
        entityInfo.base64Images.forEach((img, index) => {
          const preview = img.substring(0, 50) + '...';
          console.log(`  ${index + 1}. ${preview} (${(img.length / 1024).toFixed(1)}KB)`);
        });
        return;
      }
      
      // Placeholder for actual migration - would need full migration service
      this.log('⚠️  Actual migration requires the full image processing service', 'warn');
      this.log('   This CLI tool currently provides detection and verification only', 'info');
      this.log('   To perform migration, use the full application with migration services', 'info');
      
    } catch (error) {
      this.log(`Entity migration failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Run batch migration
   */
  async runBatchMigration(): Promise<void> {
    try {
      this.log('🚀 Starting batch migration...', 'info');
      
      // Show initial statistics
      const base64Images = await this.detectBase64Images();
      const totalBase64Images = base64Images.reduce((sum, entity) => sum + entity.base64Images.length, 0);
      
      if (totalBase64Images === 0) {
        this.log('✅ No base64 images found - migration already complete!', 'success');
        return;
      }
      
      const estimatedMigrationTime = Math.ceil(totalBase64Images * 2 / 60);
      const estimatedStorageSize = totalBase64Images * 500 * 1024;
      
      console.log(`\n📊 Migration Overview:`);
      console.log(`   Base64 Images: ${totalBase64Images}`);
      console.log(`   Entities: ${base64Images.length}`);
      console.log(`   Estimated Time: ${estimatedMigrationTime} minutes`);
      console.log(`   Estimated Storage: ${this.formatFileSize(estimatedStorageSize)}`);
      
      if (this.options.dryRun) {
        this.log('🧪 DRY RUN MODE - Showing what would be migrated:', 'info');
        
        base64Images.forEach((entity, index) => {
          console.log(`\n${index + 1}. ${entity.type}: ${entity.entityName || entity.id}`);
          console.log(`   Images to migrate: ${entity.base64Images.length}`);
          
          if (this.options.verbose) {
            entity.base64Images.slice(0, 3).forEach((img, imgIndex) => {
              const preview = img.substring(0, 50) + '...';
              console.log(`     ${imgIndex + 1}. ${preview} (${(img.length / 1024).toFixed(1)}KB)`);
            });
            
            if (entity.base64Images.length > 3) {
              console.log(`     ... and ${entity.base64Images.length - 3} more images`);
            }
          }
        });
        
        return;
      }
      
      // Placeholder for actual migration - would need full migration service
      this.log('⚠️  Actual migration requires the full image processing service', 'warn');
      this.log('   This CLI tool currently provides detection and verification only', 'info');
      this.log('   To perform migration, integrate with the base64MigrationService', 'info');
      this.log('   from the main application context', 'info');
      
    } catch (error) {
      this.log(`Batch migration failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback migration for specific entity
   */
  async rollbackMigration(entityId: string): Promise<void> {
    try {
      this.log(`🔄 Rolling back migration for entity: ${entityId}`, 'info');
      
      // This is a placeholder - actual rollback would require backup data
      this.log('⚠️  Rollback functionality requires backup data', 'warn');
      this.log('   This feature is not yet implemented', 'warn');
      this.log('   To rollback, restore from database backup', 'info');
      
    } catch (error) {
      this.log(`Rollback failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    try {
      // Show help if requested
      if (this.options.help) {
        this.showHelp();
        return;
      }
      
      // Connect to database
      this.log('🔌 Connecting to database...', 'info');
      await this.connectToDatabase();
      
      // Handle different modes
      if (this.options.stats) {
        await this.showStatistics();
        return;
      }
      
      if (this.options.verify) {
        await this.verifyMigration();
        return;
      }
      
      if (this.options.rollback) {
        await this.rollbackMigration(this.options.rollback);
        return;
      }
      
      // Handle entity-specific migration
      if (this.options.entityId) {
        if (this.options.entityType === 'all') {
          this.log('⚠️  Must specify --entity-type when using --entity-id', 'error');
          return;
        }
        await this.migrateEntity(this.options.entityType, this.options.entityId);
        return;
      }
      
      // Run batch migration
      await this.runBatchMigration();
      
    } catch (error) {
      this.log(`CLI execution failed: ${error}`, 'error');
      process.exit(1);
    } finally {
      await this.closeDatabaseConnection();
      const duration = Date.now() - this.startTime.getTime();
      this.log(`⏱️  Total execution time: ${this.formatDuration(duration)}`, 'info');
    }
  }
}

// Execute CLI
const cli = new ImageMigrationCLI();
cli.run().catch((error) => {
  console.error('💥 CLI failed:', error);
  process.exit(1);
});

export default ImageMigrationCLI;