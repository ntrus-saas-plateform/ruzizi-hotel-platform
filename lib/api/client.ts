/**
 * Unified API Client with automatic token management
 * Uses UnifiedTokenManager for consistent token handling across the application
 */

import { unifiedTokenManager } from '@/lib/auth/unified-token-manager';
import { retryMechanism } from '@/lib/utils/retry-mechanism';
import { errorLogger } from '@/lib/utils/error-logger';
import { createAuthErrorFromResponse, createNetworkError, isAuthError } from '@/lib/errors/auth-errors';
import type { AuthTokens } from '@/types/user.types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 30000; // 30 seconds
  private isRefreshing = false;
  private refreshSubscribers: ((token: string | null) => void)[] = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Set authentication tokens (delegates to UnifiedTokenManager)
   */
  public setTokens(tokens: AuthTokens): void {
    unifiedTokenManager.setTokens(tokens);
  }

  /**
   * Get current access token (delegates to UnifiedTokenManager)
   */
  public getAccessToken(): string | null {
    return unifiedTokenManager.getAccessToken();
  }

  /**
   * Clear all tokens (delegates to UnifiedTokenManager)
   */
  public clearTokens(): void {
    unifiedTokenManager.clearTokens();
  }

  /**
   * Subscribe to token refresh events
   */
  private subscribeTokenRefresh(callback: (token: string | null) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers when token is refreshed
   */
  private onTokenRefreshed(token: string | null): void {
    this.refreshSubscribers.forEach(callback => {
      try {
        callback(token);
      } catch (error) {
        console.error('Error in token refresh subscriber:', error);
      }
    });
    this.refreshSubscribers = [];
  }

  /**
   * Refresh access token using UnifiedTokenManager
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      return await unifiedTokenManager.refreshTokenIfNeeded();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Make HTTP request with automatic token management, retry logic, and comprehensive error handling
   */
  public async request<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { skipAuth, timeout, ...fetchOptions } = options;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Use retry mechanism for network requests
    return retryMechanism.retryNetworkRequest(async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        timeout || this.defaultTimeout
      );

      try {
        // Prepare headers
        const headers = new Headers(fetchOptions.headers);
        
        // Set default content type if not provided and there's a body
        if (fetchOptions.body && !headers.get('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }

        // Add authentication if not skipped
        if (!skipAuth) {
          const accessToken = this.getAccessToken();
          if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
          }
        }

        // Make the request
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized - attempt token refresh
        if (response.status === 401 && !skipAuth) {
          // If refresh is already in progress, wait for it
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.subscribeTokenRefresh(async (newToken: string | null) => {
                if (!newToken) {
                  const authError = createAuthErrorFromResponse(response, await response.json().catch(() => ({})));
                  errorLogger.logAuthError(authError, {
                    operation: 'api_request_retry',
                    endpoint: url,
                  });
                  reject(authError);
                  return;
                }

                try {
                  // Retry the request with new token
                  headers.set('Authorization', `Bearer ${newToken}`);
                  const retryResponse = await fetch(url, { 
                    ...fetchOptions, 
                    headers,
                    signal: controller.signal,
                  });
                  const data = await this.handleResponse<T>(retryResponse, url);
                  resolve(data);
                } catch (error) {
                  reject(error);
                }
              });
            });
          }

          // Start refresh process
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.isRefreshing = false;

            if (newToken) {
              this.onTokenRefreshed(newToken);

              // Retry the request with new token
              headers.set('Authorization', `Bearer ${newToken}`);
              const retryResponse = await fetch(url, { 
                ...fetchOptions, 
                headers,
                signal: controller.signal,
              });
              return await this.handleResponse<T>(retryResponse, url);
            } else {
              this.onTokenRefreshed(null);
              const authError = createAuthErrorFromResponse(response, await response.json().catch(() => ({})));
              errorLogger.logAuthError(authError, {
                operation: 'api_request_after_refresh_failure',
                endpoint: url,
              });
              throw authError;
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.onTokenRefreshed(null);
            
            // Log the refresh error
            errorLogger.logTokenError('refresh_during_api_call', refreshError as Error, {
              operation: 'api_request_token_refresh',
              endpoint: url,
            });
            
            throw refreshError;
          }
        }

        return await this.handleResponse<T>(response, url);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            const timeoutError = new Error('Request timeout');
            errorLogger.logNetworkError(timeoutError, {
              operation: 'api_request',
              endpoint: url,
              timeout: timeout || this.defaultTimeout,
            });
            throw timeoutError;
          }
          
          // Handle network errors
          if (!isAuthError(error)) {
            const networkError = createNetworkError(error);
            errorLogger.logNetworkError(networkError, {
              operation: 'api_request',
              endpoint: url,
            });
            throw networkError;
          }
          
          throw error;
        }
        throw new Error('Unknown error occurred');
      }
    }, url);
  }

  /**
   * Handle API response with proper error formatting and logging
   */
  private async handleResponse<T>(response: Response, url: string): Promise<T> {
    // Handle different content types
    const contentType = response.headers.get('content-type');
    let data: any;

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      errorLogger.logError('API_CLIENT', 'RESPONSE_PARSE_ERROR', 
        'Failed to parse response body', {
          endpoint: url,
          contentType,
          status: response.status,
        }
      );
      throw new Error('Failed to parse server response');
    }

    // Handle error responses
    if (!response.ok) {
      // Create specific error based on response
      const apiError = createAuthErrorFromResponse(response, data);
      
      // Log API error with context
      errorLogger.logError('API_CLIENT', 'API_ERROR', 
        `API request failed: ${response.status}`, {
          endpoint: url,
          status: response.status,
          errorCode: apiError.code,
          errorMessage: apiError.message,
        }
      );

      throw apiError;
    }

    return data;
  }

  /**
   * HTTP method shortcuts
   */
  public async get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

export default apiClient;
