/**
 * React hook for comprehensive error handling
 * Provides user-friendly error messages and retry functionality
 */

import { useState, useCallback } from 'react';
import { AuthErrorHandler, type ErrorHandlingResult } from '@/lib/auth/error-handler';

export interface UseErrorHandlerOptions {
  showUserMessage?: boolean;
  logError?: boolean;
  onError?: (error: ErrorHandlingResult) => void;
  onRetry?: () => void;
}

export interface UseErrorHandlerReturn {
  error: ErrorHandlingResult | null;
  isRetrying: boolean;
  clearError: () => void;
  handleError: (error: unknown, operation: string) => void;
  retry: () => Promise<void>;
  canRetry: boolean;
}

/**
 * Hook for handling errors with user-friendly messages and retry logic
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showUserMessage = true,
    logError = true,
    onError,
    onRetry
  } = options;

  const [error, setError] = useState<ErrorHandlingResult | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const handleError = useCallback((error: unknown, operation: string) => {
    const result = AuthErrorHandler.handleError(error, operation, {
      showUserMessage,
      logError
    });

    setError(result);
    setIsRetrying(false);

    if (onError) {
      onError(result);
    }
  }, [showUserMessage, logError, onError]);

  const retry = useCallback(async () => {
    if (!error || !error.canRetry) {
      return;
    }

    setIsRetrying(true);

    try {
      // Wait for retry delay if specified
      if (error.retryAfter) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      }

      if (onRetry) {
        await onRetry();
      }

      // Clear error on successful retry
      clearError();
    } catch (retryError) {
      // Handle retry failure
      handleError(retryError, 'retry_operation');
    }
  }, [error, onRetry, clearError, handleError]);

  return {
    error,
    isRetrying,
    clearError,
    handleError,
    retry,
    canRetry: error?.canRetry || false
  };
}

/**
 * Hook specifically for authentication operations
 */
export function useAuthErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  return useErrorHandler({
    ...options,
    logError: true, // Always log auth errors
  });
}

/**
 * Hook for API request error handling
 */
export function useApiErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  return useErrorHandler({
    ...options,
    showUserMessage: true,
    logError: true,
  });
}

export default useErrorHandler;