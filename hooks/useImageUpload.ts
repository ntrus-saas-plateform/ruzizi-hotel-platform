/**
 * Custom hook for image upload using Vercel Blob
 * Provides optimized image upload with progress tracking and error handling
 * Enhanced with blob-specific features and better error handling
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  optimized: boolean;
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
}

interface UploadResponse {
  success: boolean;
  results: UploadResult[];
  errors?: string[];
  error?: string; // For general errors
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseImageUploadOptions {
  generateThumbnails?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  validateBeforeUpload?: boolean;
  retryAttempts?: number;
}

interface UseImageUploadReturn {
  upload: (files: File[]) => Promise<UploadResult[]>;
  deleteImages: (urls: string[]) => Promise<boolean>;
  checkBlobExists: (url: string) => Promise<boolean>;
  getBlobInfo: (url: string) => Promise<any>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  clearError: () => void;
  isConfigured: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    generateThumbnails = false,
    onProgress,
    onSuccess,
    onError,
    maxFiles = 10,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    validateBeforeUpload = true,
    retryAttempts = 2
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if Vercel Blob is configured
  useEffect(() => {
    async function checkConfiguration() {
      try {
        const data = await apiClient.get('/api/images/upload-blob') as any;
        setIsConfigured(data.success && data.data?.blobConfigured);
      } catch (error) {
        setIsConfigured(false);
      }
    }
    checkConfiguration();
  }, []);

  const checkBlobExists = useCallback(async (url: string): Promise<boolean> => {
    try {
      const data = await apiClient.get(`/api/images/blob-info?action=check&url=${encodeURIComponent(url)}`) as any;
      return data.success && data.data?.exists;
    } catch (error) {
      console.error('Failed to check blob existence:', error);
      return false;
    }
  }, []);

  const getBlobInfo = useCallback(async (url: string) => {
    try {
      const data = await apiClient.get(`/api/images/blob-info?action=check&url=${encodeURIComponent(url)}`) as any;
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get blob info:', error);
      return null;
    }
  }, []);

  const validateFiles = useCallback((files: File[]): string | null => {
    if (!files || files.length === 0) {
      return 'No files selected';
    }

    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP`;
      }

      if (file.size > maxFileSize) {
        return `File too large: ${file.name}. Maximum size: ${maxFileSize / 1024 / 1024}MB`;
      }
    }

    return null;
  }, [maxFiles, maxFileSize]);

  const uploadWithRetry = useCallback(async (files: File[], attempt: number = 1): Promise<UploadResult[]> => {
    try {
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (generateThumbnails) {
        formData.append('generateThumbnails', 'true');
      }

      // Upload with progress tracking
      const data: UploadResponse = await apiClient.request('/api/images/upload-blob', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData - let browser set it with boundary
        headers: {},
      });

      if (!data.success) {
        // Use the first error from errors array, or a generic message
        const errorMessage = data.error || (data.errors && data.errors[0]) || 'Upload failed';
        throw new Error(errorMessage);
      }

      return data.results;

    } catch (err) {
      if (attempt < retryAttempts) {
        console.warn(`Upload attempt ${attempt} failed, retrying...`, err);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return uploadWithRetry(files, attempt + 1);
      }
      throw err;
    }
  }, [generateThumbnails, retryAttempts]);

  const upload = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    // Clear previous error
    setError(null);

    // Validate files
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      throw new Error(validationError);
    }

    // Check if blob is configured (skip in production to show better error)
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    if (validateBeforeUpload && !isConfigured && !isProduction) {
      const configError = 'Vercel Blob is not configured. Please set BLOB_READ_WRITE_TOKEN.';
      setError(configError);
      onError?.(configError);
      throw new Error(configError);
    }

    setIsUploading(true);
    setProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      // Simulate progress for better UX (since fetch doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (!prev || prev.percentage >= 90) return prev;
          const newPercentage = Math.min(prev.percentage + 10, 90);
          const newProgress = {
            loaded: newPercentage,
            total: 100,
            percentage: newPercentage
          };
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 200);

      const results = await uploadWithRetry(files);

      clearInterval(progressInterval);
      setProgress({ loaded: 100, total: 100, percentage: 100 });

      onSuccess?.(results);
      
      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      // Clear progress after a short delay
      setTimeout(() => setProgress(null), 1000);
    }
  }, [validateFiles, validateBeforeUpload, isConfigured, onProgress, onSuccess, onError, uploadWithRetry]);

  const deleteImages = useCallback(async (urls: string[]): Promise<boolean> => {
    if (!urls || urls.length === 0) {
      return true;
    }

    try {
      const searchParams = new URLSearchParams();
      urls.forEach(url => searchParams.append('url', url));

      const data = await apiClient.delete(`/api/images/upload-blob?${searchParams.toString()}`) as any;
      return data.success;

    } catch (err) {
      console.error('Failed to delete images:', err);
      return false;
    }
  }, []);

  return {
    upload,
    deleteImages,
    checkBlobExists,
    getBlobInfo,
    isUploading,
    progress,
    error,
    clearError,
    isConfigured
  };
}

// Utility function to get thumbnail URL
export function getThumbnailUrl(result: UploadResult, size: 'small' | 'medium' | 'large' = 'medium'): string {
  return result.thumbnails?.[size] || result.url;
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}