import { useState, useEffect } from 'react';

interface UseImageLoaderOptions {
  src: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface UseImageLoaderReturn {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

/**
 * Custom hook for handling image loading with fallback and error handling
 * Useful for base64 images that might fail to load
 */
export function useImageLoader({
  src,
  fallbackSrc = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  onLoad,
  onError,
}: UseImageLoaderOptions): UseImageLoaderReturn {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      console.error('Image failed to load:', src.substring(0, 100));
      setIsLoading(false);
      setHasError(true);
      
      // Use fallback if available
      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
      
      onError?.(new Error('Failed to load image'));
    };

    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, retryCount]);

  const retry = () => {
    setRetryCount(prev => prev + 1);
    setImageSrc(src);
  };

  return {
    imageSrc,
    isLoading,
    hasError,
    retry,
  };
}
