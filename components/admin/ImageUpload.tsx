'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  label = "Images"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setUploading(true);
    setError('');

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = Array.from(files).map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(initialProgress);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Update progress to show processing
      setUploadProgress(prev => prev.map(p => ({ ...p, status: 'processing', progress: 50 })));

      // Upload files to Vercel Blob API
      const response = await fetch('/api/images/upload-blob', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      // Extract URLs from successful uploads
      const newImageUrls: string[] = [];
      if (result.results) {
        result.results.forEach((uploadResult: any) => {
          if (uploadResult.url) {
            newImageUrls.push(uploadResult.url);
          }
        });
      }

      // Update progress to complete
      setUploadProgress(prev => prev.map(p => ({ ...p, status: 'complete', progress: 100 })));

      // Add new image URLs to existing images
      onImagesChange([...images, ...newImageUrls]);

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Upload warnings:', result.warnings);
      }

      // Show errors for failed uploads
      if (result.errors && result.errors.length > 0) {
        setError(`Some uploads failed: ${result.errors.join(', ')}`);
      }

    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des images');
      
      // Update progress to show error
      setUploadProgress(prev => prev.map(p => ({ 
        ...p, 
        status: 'error', 
        error: err instanceof Error ? err.message : 'Upload failed'
      })));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onImagesChange(newImages);
  };

  // Check if an image URL is a base64 string (for backward compatibility)
  const isBase64Image = (url: string): boolean => {
    return url.startsWith('data:image/');
  };

  // Get the appropriate image source for display
  const getImageSrc = (imageUrl: string): string => {
    if (isBase64Image(imageUrl)) {
      // Legacy base64 image - display as is
      return imageUrl;
    } else {
      // New file system image - use the URL directly
      return imageUrl;
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} ({images.length}/{maxImages})
      </label>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-lg  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Chargement...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter des images
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Formats acceptés: JPG, PNG, GIF, WebP. Taille max: 10MB par image.
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploadProgress.map((progress, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {progress.fileName}
                </span>
                <span className="text-xs text-gray-500">
                  {progress.status === 'uploading' && 'Téléchargement...'}
                  {progress.status === 'processing' && 'Traitement...'}
                  {progress.status === 'complete' && 'Terminé'}
                  {progress.status === 'error' && 'Erreur'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'error' ? 'bg-red-500' : 
                    progress.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={getImageSrc(image)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTAuNTg2IDkuNDE0QzExLjM2NyA4LjYzMyAxMi42MzMgOC42MzMgMTMuNDE0IDkuNDE0TDE2IDEyTTE0IDEwTDE1LjU4NiA4LjQxNEMxNi4zNjcgNy42MzMgMTcuNjMzIDcuNjMzIDE4LjQxNCA4LjQxNEwyMCAxME0xOCA4SDZDNC44OTU0MyA4IDQgOC44OTU0MyA0IDEwVjE4QzQgMTkuMTA0NiA0Ljg5NTQzIDIwIDYgMjBIMThDMTkuMTA0NiAyMCAyMCAxOS4xMDQ2IDIwIDE4VjEwQzIwIDguODk1NDMgMTkuMTA0NiA4IDE4IDhaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                  }}
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'left')}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                    title="Déplacer à gauche"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4 text-luxury-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'right')}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                    title="Déplacer à droite"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Badge for main image */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-luxury-gold text-luxury-cream text-xs font-medium rounded">
                  Image principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-luxury-text text-sm">Aucune image ajoutée</p>
          <p className="text-gray-500 text-xs mt-1">Cliquez sur "Ajouter des images" pour commencer</p>
        </div>
      )}
    </div>
  );
}
