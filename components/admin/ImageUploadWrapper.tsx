/**
 * Image Upload Wrapper Component
 * Automatically chooses between local storage and Vercel Blob based on environment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Cloud, HardDrive, Settings } from 'lucide-react';
import ImageUpload from './ImageUpload';
import ImageUploadBlob from './ImageUploadBlob';

interface ImageUploadWrapperProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

interface UploadConfig {
  blobConfigured: boolean;
  maxFileSize: number;
  allowedFormats: string[];
  optimizationEnabled: boolean;
  cdnEnabled: boolean;
}

export default function ImageUploadWrapper({
  images,
  onImagesChange,
  maxImages = 10,
  className = ''
}: ImageUploadWrapperProps) {
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceLocal, setForceLocal] = useState(false);

  // Check upload configuration on mount
  useEffect(() => {
    async function checkConfig() {
      try {
        // Check Vercel Blob configuration
        const response = await fetch('/api/images/upload-blob');
        const data = await response.json();
        
        if (data.success) {
          setConfig(data.data);
        } else {
          throw new Error(data.error || 'Failed to get configuration');
        }
      } catch (err) {
        console.error('Failed to check blob configuration:', err);
        setError(err instanceof Error ? err.message : 'Configuration check failed');
        
        // Fallback to local configuration
        setConfig({
          blobConfigured: false,
          maxFileSize: 10 * 1024 * 1024,
          allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          optimizationEnabled: false,
          cdnEnabled: false
        });
      } finally {
        setLoading(false);
      }
    }

    checkConfig();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-gray-600">Checking upload configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="font-medium text-red-800">Configuration Error</h3>
        </div>
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <p className="text-xs text-red-600">
          Falling back to local storage. For production, configure BLOB_READ_WRITE_TOKEN.
        </p>
      </div>
    );
  }

  const useBlob = config?.blobConfigured && !forceLocal;
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className={className}>
      {/* Configuration Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {useBlob ? (
              <>
                <Cloud className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Vercel Blob Storage
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Optimized
                </span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Local Storage
                </span>
                {isProduction && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Not Recommended
                  </span>
                )}
              </>
            )}
          </div>
          
          {config?.blobConfigured && (
            <button
              onClick={() => setForceLocal(!forceLocal)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {forceLocal ? 'Use Blob' : 'Use Local'}
            </button>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>Max: {Math.round(config!.maxFileSize / 1024 / 1024)}MB</span>
            <span>Formats: {config!.allowedFormats.join(', ')}</span>
            {config!.optimizationEnabled && <span>✨ Auto-optimization</span>}
            {config!.cdnEnabled && <span>🚀 CDN</span>}
          </div>
        </div>

        {isProduction && !useBlob && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ For production deployment, configure Vercel Blob Storage for better performance and reliability.
          </div>
        )}
      </div>

      {/* Upload Component */}
      {useBlob ? (
        <ImageUploadBlob
          images={images}
          onImagesChange={onImagesChange}
          maxImages={maxImages}
          generateThumbnails={true}
          showProgress={true}
        />
      ) : (
        <ImageUpload
          images={images}
          onImagesChange={onImagesChange}
          maxImages={maxImages}
        />
      )}

      {/* Migration Notice */}
      {!useBlob && images.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800">
              Upgrade to Vercel Blob
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            Get automatic image optimization, CDN delivery, and better performance.
          </p>
          <p className="text-xs text-blue-600">
            Run <code className="bg-blue-100 px-1 rounded">npm run migrate:blob</code> to migrate existing images.
          </p>
        </div>
      )}
    </div>
  );
}