/**
 * Enhanced Image Upload Component using Vercel Blob
 * Optimized for production deployment with automatic image optimization
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useImageUpload, getThumbnailUrl, formatFileSize } from '@/hooks/useImageUpload';

interface ImageUploadBlobProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  generateThumbnails?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface UploadedImage {
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

export default function ImageUploadBlob({
  images,
  onImagesChange,
  maxImages = 10,
  generateThumbnails = true,
  showProgress = true,
  className = ''
}: ImageUploadBlobProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const {
    upload,
    deleteImages,
    isUploading,
    progress,
    error,
    clearError
  } = useImageUpload({
    generateThumbnails,
    maxFiles: maxImages,
    onSuccess: (results) => {
      const newImages = results.map(result => result.url);
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);
      
      // Store additional metadata
      const newUploadedImages = results.map(result => ({
        url: result.url,
        filename: result.filename,
        size: result.size,
        optimized: result.optimized,
        thumbnails: result.thumbnails
      }));
      setUploadedImages(prev => [...prev, ...newUploadedImages]);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    try {
      await upload(fileArray);
    } catch (error) {
      // Error is already handled by the hook
    }
  }, [upload, images.length, maxImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);

    // Remove from uploaded images metadata
    setUploadedImages(prev => prev.filter(img => img.url !== imageUrl));

    // Attempt to delete from blob storage
    try {
      await deleteImages([imageUrl]);
    } catch (error) {
      console.error('Failed to delete image from blob storage:', error);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const getImageMetadata = (url: string) => {
    return uploadedImages.find(img => img.url === url);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-50'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-700">Uploading images...</p>
                <p className="text-sm text-gray-500">Optimizing and generating thumbnails</p>
              </div>
              {showProgress && progress && (
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, WebP up to 10MB • {maxImages - images.length} remaining
                </p>
                {generateThumbnails && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✨ Auto-optimization and thumbnails enabled
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Images ({images.length}/{maxImages})
            </h3>
            {generateThumbnails && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Optimized & CDN Ready</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => {
              const metadata = getImageMetadata(imageUrl);
              const thumbnailUrl = metadata ? getThumbnailUrl(metadata, 'medium') : imageUrl;

              return (
                <div
                  key={index}
                  className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={thumbnailUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        {/* Move Left */}
                        {index > 0 && (
                          <button
                            onClick={() => moveImage(index, index - 1)}
                            className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                            title="Move left"
                          >
                            <span className="text-xs">←</span>
                          </button>
                        )}
                        
                        {/* Remove */}
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        {/* Move Right */}
                        {index < images.length - 1 && (
                          <button
                            onClick={() => moveImage(index, index + 1)}
                            className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                            title="Move right"
                          >
                            <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  {metadata && (
                    <div className="p-2 bg-gray-50">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="truncate flex-1">
                          {metadata.filename || `Image ${index + 1}`}
                        </span>
                        {metadata.size && (
                          <span className="ml-2 flex-shrink-0">
                            {formatFileSize(metadata.size)}
                          </span>
                        )}
                      </div>
                      {metadata.optimized && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Optimized</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}