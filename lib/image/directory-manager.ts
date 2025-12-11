/**
 * Directory management utilities for image storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import { IMAGE_CONFIG } from './config';

/**
 * Generate directory path for establishment images
 */
export function generateImagePath(establishmentId: string, date: Date = new Date()): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  return path.join(
    IMAGE_CONFIG.directories.base,
    establishmentId,
    year,
    month
  );
}

/**
 * Generate full directory structure for an establishment
 */
export function generateFullDirectoryStructure(establishmentId: string, date: Date = new Date()): {
  base: string;
  originals: string;
  webp: string;
  jpeg: string;
  thumbnails: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
} {
  const basePath = generateImagePath(establishmentId, date);
  
  return {
    base: basePath,
    originals: path.join(basePath, IMAGE_CONFIG.directories.subdirs.originals),
    webp: path.join(basePath, IMAGE_CONFIG.directories.subdirs.webp),
    jpeg: path.join(basePath, IMAGE_CONFIG.directories.subdirs.jpeg),
    thumbnails: {
      small: path.join(basePath, IMAGE_CONFIG.directories.subdirs.thumbnails, 'small'),
      medium: path.join(basePath, IMAGE_CONFIG.directories.subdirs.thumbnails, 'medium'),
      large: path.join(basePath, IMAGE_CONFIG.directories.subdirs.thumbnails, 'large'),
      xlarge: path.join(basePath, IMAGE_CONFIG.directories.subdirs.thumbnails, 'xlarge'),
    },
  };
}

/**
 * Ensure directory exists with proper permissions
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { 
      recursive: true, 
      mode: IMAGE_CONFIG.permissions.directories 
    });
  }
}

/**
 * Create complete directory structure for establishment
 */
export async function createEstablishmentDirectories(establishmentId: string, date: Date = new Date()): Promise<void> {
  const directories = generateFullDirectoryStructure(establishmentId, date);
  
  // Create all directories
  const allPaths = [
    directories.base,
    directories.originals,
    directories.webp,
    directories.jpeg,
    directories.thumbnails.small,
    directories.thumbnails.medium,
    directories.thumbnails.large,
    directories.thumbnails.xlarge,
  ];
  
  // Create directories in parallel
  await Promise.all(allPaths.map(dirPath => ensureDirectoryExists(dirPath)));
}

/**
 * Set proper file permissions
 */
export async function setFilePermissions(filePath: string): Promise<void> {
  try {
    await fs.chmod(filePath, IMAGE_CONFIG.permissions.files);
  } catch (error) {
    // Log error but don't fail the operation
    console.warn(`Failed to set permissions for ${filePath}:`, error);
  }
}

/**
 * Validate directory structure exists
 */
export async function validateDirectoryStructure(establishmentId: string, date: Date = new Date()): Promise<boolean> {
  const directories = generateFullDirectoryStructure(establishmentId, date);
  
  const allPaths = [
    directories.base,
    directories.originals,
    directories.webp,
    directories.jpeg,
    directories.thumbnails.small,
    directories.thumbnails.medium,
    directories.thumbnails.large,
    directories.thumbnails.xlarge,
  ];
  
  try {
    // Check all directories exist
    await Promise.all(allPaths.map(async (dirPath) => {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`${dirPath} is not a directory`);
      }
    }));
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Get relative path from absolute path
 */
export function getRelativePath(absolutePath: string): string {
  const workingDir = process.cwd();
  return path.relative(workingDir, absolutePath);
}

/**
 * Get absolute path from relative path
 */
export function getAbsolutePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.join(process.cwd(), relativePath);
}

/**
 * Clean up empty directories
 */
export async function cleanupEmptyDirectories(dirPath: string): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath);
    
    if (entries.length === 0) {
      // Directory is empty, remove it
      await fs.rmdir(dirPath);
      
      // Recursively check parent directory
      const parentDir = path.dirname(dirPath);
      if (parentDir !== dirPath && parentDir !== path.dirname(parentDir)) {
        await cleanupEmptyDirectories(parentDir);
      }
    }
  } catch {
    // Ignore errors (directory might not exist or not be empty)
  }
}