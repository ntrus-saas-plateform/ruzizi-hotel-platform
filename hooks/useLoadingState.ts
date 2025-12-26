import { useState, useCallback, useMemo } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingStateReturn {
  isLoading: (key?: string) => boolean;
  isAnyLoading: boolean;
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  clearAllLoading: () => void;
}

/**
 * Hook for managing multiple loading states efficiently
 * Helps prevent unnecessary re-renders by batching loading state updates
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => {
      if (prev[key] === loading) {
        return prev; // No change, prevent re-render
      }
      
      if (loading) {
        return { ...prev, [key]: true };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const isAnyLoading = useMemo(() => {
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  return {
    isLoading,
    isAnyLoading,
    setLoading,
    startLoading,
    stopLoading,
    clearAllLoading,
  };
}