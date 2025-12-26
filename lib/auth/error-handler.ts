/**
 * Enhanced Error Handler for Authentication and Establishment Operations
 * Provides comprehensive error handling with user-friendly messages and retry logic
 */

import { 
  AuthError, 
  isAuthError, 
  InvalidCredentialsError,
  AccountDeactivatedError,
  TokenExpiredError,
  RefreshTokenExpiredError,
  NetworkError,
  ServerError,
  ValidationError,
  InsufficientPermissionsError
} from '../errors/auth-errors';
import { 
  EstablishmentError, 
  isEstablishmentError,
  EstablishmentAccessDeniedError,
  EstablishmentNotFoundError
} from '../errors/establishment-errors';
import { errorLogger } from '../utils/error-logger';
import { retryMechanism } from '../utils/retry-mechanism';

export interface ErrorHandlingOptions {
  showUserMessage?: boolean;
  logError?: boolean;
  retryable?: boolean;
  context?: Record<string, any>;
}

export interface ErrorHandlingResult {
  error: Error;
  userMessage: string;
  canRetry: boolean;
  retryAfter?: number;
  actionRequired?: 'login' | 'contact_support' | 'retry' | 'none';
}

/**
 * Enhanced Error Handler Class
 */
export class AuthErrorHandler {
  /**
   * Handle any error with comprehensive error processing
   */
  public static handleError(
    error: unknown, 
    operation: string,
    options: ErrorHandlingOptions = {}
  ): ErrorHandlingResult {
    const {
      showUserMessage = true,
      logError = true,
      context = {}
    } = options;

    let processedError: Error;
    let userMessage: string;
    let canRetry: boolean = false;
    let retryAfter: number | undefined;
    let actionRequired: 'login' | 'contact_support' | 'retry' | 'none' = 'none';

    // Convert unknown error to Error instance
    if (error instanceof Error) {
      processedError = error;
    } else if (typeof error === 'string') {
      processedError = new Error(error);
    } else {
      processedError = new Error('An unknown error occurred');
    }

    // Handle specific error types
    if (isAuthError(processedError)) {
      const result = this.handleAuthError(processedError, operation);
      userMessage = result.userMessage;
      canRetry = result.canRetry;
      retryAfter = result.retryAfter;
      actionRequired = result.actionRequired;
    } else if (isEstablishmentError(processedError)) {
      const result = this.handleEstablishmentError(processedError, operation);
      userMessage = result.userMessage;
      canRetry = result.canRetry;
      actionRequired = result.actionRequired;
    } else {
      // Handle generic errors
      const result = this.handleGenericError(processedError, operation);
      userMessage = result.userMessage;
      canRetry = result.canRetry;
      retryAfter = result.retryAfter;
      actionRequired = result.actionRequired;
    }

    // Log error if requested
    if (logError) {
      this.logError(processedError, operation, context);
    }

    return {
      error: processedError,
      userMessage: showUserMessage ? userMessage : processedError.message,
      canRetry,
      retryAfter,
      actionRequired
    };
  }

  /**
   * Handle authentication-specific errors
   */
  private static handleAuthError(error: AuthError, operation: string): {
    userMessage: string;
    canRetry: boolean;
    retryAfter?: number;
    actionRequired: 'login' | 'contact_support' | 'retry' | 'none';
  } {
    if (error instanceof InvalidCredentialsError) {
      return {
        userMessage: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        canRetry: true,
        actionRequired: 'none'
      };
    }

    if (error instanceof AccountDeactivatedError) {
      return {
        userMessage: 'Your account has been deactivated. Please contact support for assistance.',
        canRetry: false,
        actionRequired: 'contact_support'
      };
    }

    if (error instanceof TokenExpiredError) {
      return {
        userMessage: 'Your session has expired. Please log in again.',
        canRetry: false,
        actionRequired: 'login'
      };
    }

    if (error instanceof RefreshTokenExpiredError) {
      return {
        userMessage: 'Your session has expired. Please log in again.',
        canRetry: false,
        actionRequired: 'login'
      };
    }

    if (error instanceof NetworkError) {
      return {
        userMessage: 'Connection failed. Please check your internet connection and try again.',
        canRetry: true,
        retryAfter: 3000, // 3 seconds
        actionRequired: 'retry'
      };
    }

    if (error instanceof ServerError) {
      const retryAfter = error.statusCode >= 500 ? 5000 : undefined; // 5 seconds for server errors
      return {
        userMessage: 'A server error occurred. Please try again in a few moments.',
        canRetry: error.retryable,
        retryAfter,
        actionRequired: error.retryable ? 'retry' : 'contact_support'
      };
    }

    if (error instanceof ValidationError) {
      return {
        userMessage: 'Please check your input and try again.',
        canRetry: true,
        actionRequired: 'none'
      };
    }

    if (error instanceof InsufficientPermissionsError) {
      return {
        userMessage: 'You do not have permission to perform this action.',
        canRetry: false,
        actionRequired: 'none'
      };
    }

    // Generic auth error
    return {
      userMessage: error.userMessage || 'Authentication failed. Please try again.',
      canRetry: error.retryable,
      actionRequired: error.retryable ? 'retry' : 'login'
    };
  }

  /**
   * Handle establishment-specific errors
   */
  private static handleEstablishmentError(error: EstablishmentError, operation: string): {
    userMessage: string;
    canRetry: boolean;
    actionRequired: 'login' | 'contact_support' | 'retry' | 'none';
  } {
    if (error instanceof EstablishmentAccessDeniedError) {
      return {
        userMessage: 'Access denied. You can only access resources from your assigned establishment.',
        canRetry: false,
        actionRequired: 'none'
      };
    }

    if (error instanceof EstablishmentNotFoundError) {
      return {
        userMessage: 'The requested establishment could not be found.',
        canRetry: false,
        actionRequired: 'none'
      };
    }

    // Generic establishment error
    return {
      userMessage: 'An establishment-related error occurred. Please contact support if this persists.',
      canRetry: false,
      actionRequired: 'contact_support'
    };
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: Error, operation: string): {
    userMessage: string;
    canRetry: boolean;
    retryAfter?: number;
    actionRequired: 'login' | 'contact_support' | 'retry' | 'none';
  } {
    // Check for network-related errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        userMessage: 'The request timed out. Please try again.',
        canRetry: true,
        retryAfter: 2000, // 2 seconds
        actionRequired: 'retry'
      };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        userMessage: 'Connection failed. Please check your internet connection and try again.',
        canRetry: true,
        retryAfter: 3000, // 3 seconds
        actionRequired: 'retry'
      };
    }

    // Generic error
    return {
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      canRetry: true,
      retryAfter: 2000, // 2 seconds
      actionRequired: 'retry'
    };
  }

  /**
   * Log error with appropriate context
   */
  private static logError(error: Error, operation: string, context: Record<string, any>): void {
    if (isAuthError(error)) {
      errorLogger.logAuthError(error, {
        operation,
        ...context
      });
    } else if (isEstablishmentError(error)) {
      errorLogger.logError('ESTABLISHMENT', error.code, error.message, {
        operation,
        ...context
      });
    } else {
      errorLogger.logError('GENERIC', 'UNKNOWN_ERROR', error.message, {
        operation,
        errorName: error.name,
        ...context
      });
    }
  }

  /**
   * Execute operation with automatic error handling and retry
   */
  public static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ErrorHandlingOptions & { maxRetries?: number } = {}
  ): Promise<T> {
    const { maxRetries = 3, ...errorOptions } = options;

    try {
      // For auth operations, use auth-specific retry logic
      if (operationName.includes('auth') || operationName.includes('login') || operationName.includes('token')) {
        return await retryMechanism.retryAuthOperation(operation, operationName);
      }

      // For network operations, use network-specific retry logic
      if (operationName.includes('api') || operationName.includes('fetch') || operationName.includes('request')) {
        return await retryMechanism.retryNetworkRequest(operation, operationName);
      }

      // For other operations, use general retry logic
      return await retryMechanism.execute(operation, {
        maxAttempts: maxRetries,
        retryCondition: (error, attempt) => {
          const result = this.handleError(error, operationName, { ...errorOptions, logError: false });
          return result.canRetry && attempt < maxRetries;
        },
        onRetry: (error, attempt) => {
          this.logError(error, operationName, { 
            ...errorOptions.context, 
            retryAttempt: attempt 
          });
        }
      });
    } catch (error) {
      // Final error handling - log and re-throw with enhanced error info
      const result = this.handleError(error, operationName, errorOptions);
      throw result.error;
    }
  }

  /**
   * Create user-friendly error message for UI display
   */
  public static createUserMessage(error: unknown, operation: string): string {
    const result = this.handleError(error, operation, { 
      showUserMessage: true, 
      logError: false 
    });
    return result.userMessage;
  }

  /**
   * Check if error is retryable
   */
  public static isRetryable(error: unknown): boolean {
    const result = this.handleError(error, 'check_retryable', { 
      showUserMessage: false, 
      logError: false 
    });
    return result.canRetry;
  }

  /**
   * Get recommended action for error
   */
  public static getRecommendedAction(error: unknown, operation: string): 'login' | 'contact_support' | 'retry' | 'none' {
    const result = this.handleError(error, operation, { 
      showUserMessage: false, 
      logError: false 
    });
    return result.actionRequired ?? 'none';
  }
}

// Export convenience functions
export const handleError = AuthErrorHandler.handleError;
export const executeWithErrorHandling = AuthErrorHandler.executeWithErrorHandling;
export const createUserMessage = AuthErrorHandler.createUserMessage;
export const isRetryable = AuthErrorHandler.isRetryable;
export const getRecommendedAction = AuthErrorHandler.getRecommendedAction;

export default AuthErrorHandler;