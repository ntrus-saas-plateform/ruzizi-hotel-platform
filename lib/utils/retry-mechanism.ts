/**
 * Retry mechanism for network requests and authentication operations
 * Provides exponential backoff and intelligent retry logic
 */

import { NetworkError, isAuthError } from '../errors/auth-errors';
import { errorLogger } from './error-logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

class RetryMechanism {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryCondition: this.defaultRetryCondition,
    onRetry: this.defaultOnRetry,
  };

  /**
   * Execute a function with retry logic
   */
  public async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition(lastError, attempt)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        // Call retry callback
        config.onRetry(lastError, attempt);

        // Wait before retrying
        await this.delay(jitteredDelay);
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    errorLogger.logError('RETRY', 'MAX_ATTEMPTS_EXCEEDED',
      `Operation failed after ${config.maxAttempts} attempts in ${totalTime}ms`, {
        operation: operation.name || 'anonymous',
        attempts: config.maxAttempts,
        totalTime,
        finalError: lastError!.message,
      }
    );

    throw lastError!;
  }

  /**
   * Execute with detailed result information
   */
  public async executeWithResult<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxAttempts || !config.retryCondition(lastError, attempt)) {
          break;
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        const jitteredDelay = delay + Math.random() * 1000;

        config.onRetry(lastError, attempt);
        await this.delay(jitteredDelay);
      }
    }

    return {
      success: false,
      error: lastError!,
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Retry specifically for authentication operations
   */
  public async retryAuthOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return this.execute(operation, {
      maxAttempts: 2, // Limited retries for auth operations
      baseDelay: 500,
      retryCondition: (error, attempt) => {
        // Only retry network errors and server errors for auth
        if (error instanceof NetworkError) {
          return true;
        }
        if (isAuthError(error) && error.retryable) {
          return true;
        }
        if ((error as any).status >= 500) {
          return true;
        }
        return false;
      },
      onRetry: (error, attempt) => {
        errorLogger.logAuthError(error, {
          operation: operationName,
          attempt: attempt,
        });
      },
    });
  }

  /**
   * Retry for network requests
   */
  public async retryNetworkRequest<T>(
    operation: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    return this.execute(operation, {
      maxAttempts: 3,
      baseDelay: 1000,
      retryCondition: (error, attempt) => {
        // Retry network errors and 5xx server errors
        if (error instanceof NetworkError) {
          return true;
        }
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          return true;
        }
        const status = (error as any).status;
        return status >= 500 || status === 0;
      },
      onRetry: (error, attempt) => {
        errorLogger.logNetworkError(error, {
          endpoint,
          attempt: attempt,
        });
      },
    });
  }

  /**
   * Default retry condition
   */
  private defaultRetryCondition(error: Error, attempt: number): boolean {
    // Don't retry client errors (4xx) except for specific cases
    const status = (error as any).status;
    if (status >= 400 && status < 500) {
      // Retry 408 (timeout), 429 (rate limit), and network errors
      return status === 408 || status === 429 || error instanceof NetworkError;
    }

    // Retry server errors (5xx) and network errors
    return status >= 500 || status === 0 || error instanceof NetworkError;
  }

  /**
   * Default retry callback
   */
  private defaultOnRetry(error: Error, attempt: number): void {
    errorLogger.logError('RETRY', 'RETRY_ATTEMPT',
      `Retrying operation (attempt ${attempt})`, {
        errorMessage: error.message,
        attempt,
      }
    );
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create retry options for different scenarios
   */
  public static createOptions(scenario: 'auth' | 'network' | 'critical'): RetryOptions {
    switch (scenario) {
      case 'auth':
        return {
          maxAttempts: 2,
          baseDelay: 500,
          maxDelay: 2000,
        };
      case 'network':
        return {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        };
      case 'critical':
        return {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 15000,
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
export const retryMechanism = new RetryMechanism();

// Export class for custom instances
export { RetryMechanism };

export default retryMechanism;