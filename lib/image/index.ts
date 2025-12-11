/**
 * Image processing system exports
 */

// Configuration
export * from './config';

// Types
export * from './types';

// Sharp utilities
export * from './sharp-utils';

// Directory management
export * from './directory-manager';

// Image processor service
export * from './image-processor';

// Metadata extraction service
export * from './metadata-extractor';

// File storage manager service
export * from './file-storage-manager';

// Image validator service
export * from './image-validator';

// Image management service
export * from './image-management-service';

// Performance monitoring
export * from './performance-monitor';

// Initialize Sharp on import
import { initializeSharp } from './sharp-utils';
initializeSharp();