/**
 * Error Display Component
 * Shows user-friendly error messages with retry and action buttons
 */

import React from 'react';
import type { ErrorHandlingResult } from '@/lib/auth/error-handler';

export interface ErrorDisplayProps {
  error: ErrorHandlingResult | null;
  onRetry?: () => void;
  onLogin?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
  className?: string;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  isRetrying?: boolean;
}

/**
 * Error Display Component
 */
export function ErrorDisplay({
  error,
  onRetry,
  onLogin,
  onContactSupport,
  onDismiss,
  className = '',
  showRetryButton = true,
  showDismissButton = true,
  isRetrying = false
}: ErrorDisplayProps) {
  if (!error) {
    return null;
  }

  const getErrorIcon = () => {
    switch (error.actionRequired) {
      case 'login':
        return '🔐';
      case 'contact_support':
        return '📞';
      case 'retry':
        return '🔄';
      default:
        return '⚠️';
    }
  };

  const getErrorSeverity = () => {
    if (error.actionRequired === 'contact_support') {
      return 'error';
    }
    if (error.actionRequired === 'login') {
      return 'warning';
    }
    return 'info';
  };

  const getSeverityClasses = () => {
    const severity = getErrorSeverity();
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    const severity = getErrorSeverity();
    const baseClasses = 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200';
    
    if (variant === 'primary') {
      switch (severity) {
        case 'error':
          return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
        case 'warning':
          return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`;
        case 'info':
          return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
        default:
          return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`;
      }
    } else {
      return `${baseClasses} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500`;
    }
  };

  const handleActionClick = () => {
    switch (error.actionRequired) {
      case 'login':
        onLogin?.();
        break;
      case 'contact_support':
        onContactSupport?.();
        break;
      case 'retry':
        onRetry?.();
        break;
      default:
        break;
    }
  };

  const getActionButtonText = () => {
    if (isRetrying && error.actionRequired === 'retry') {
      return 'Retrying...';
    }
    
    switch (error.actionRequired) {
      case 'login':
        return 'Log In';
      case 'contact_support':
        return 'Contact Support';
      case 'retry':
        return 'Try Again';
      default:
        return 'OK';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getSeverityClasses()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg" role="img" aria-label="Error icon">
            {getErrorIcon()}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {error.actionRequired === 'contact_support' ? 'Support Required' :
             error.actionRequired === 'login' ? 'Authentication Required' :
             error.actionRequired === 'retry' ? 'Connection Issue' :
             'Error'}
          </h3>
          <div className="mt-2 text-sm">
            <p>{error.userMessage}</p>
          </div>
          <div className="mt-4 flex space-x-3">
            {/* Primary action button */}
            {error.actionRequired !== 'none' && (
              <button
                type="button"
                className={getButtonClasses('primary')}
                onClick={handleActionClick}
                disabled={isRetrying}
              >
                {getActionButtonText()}
              </button>
            )}
            
            {/* Retry button (separate from primary action) */}
            {showRetryButton && error.canRetry && error.actionRequired !== 'retry' && onRetry && (
              <button
                type="button"
                className={getButtonClasses('secondary')}
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            
            {/* Dismiss button */}
            {showDismissButton && onDismiss && (
              <button
                type="button"
                className={getButtonClasses('secondary')}
                onClick={onDismiss}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Error Display for inline use
 */
export function CompactErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  isRetrying = false
}: Pick<ErrorDisplayProps, 'error' | 'onRetry' | 'onDismiss' | 'className' | 'isRetrying'>) {
  if (!error) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-md bg-red-50 border border-red-200 ${className}`}>
      <div className="flex items-center">
        <span className="text-red-400 mr-2">⚠️</span>
        <span className="text-sm text-red-800">{error.userMessage}</span>
      </div>
      <div className="flex items-center space-x-2">
        {error.canRetry && onRetry && (
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-800 font-medium"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="text-sm text-red-400 hover:text-red-600"
            onClick={onDismiss}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorDisplay;