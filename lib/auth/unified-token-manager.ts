/**
 * Unified Token Manager - Centralized token management system
 * Consolidates all token operations with consistent storage and automatic refresh
 */

import type { AuthTokens, JWTPayload } from '@/types/user.types';

// Storage keys for consistent naming
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ruzizi_access_token',
  REFRESH_TOKEN: 'ruzizi_refresh_token',
  TOKEN_EXPIRY: 'ruzizi_token_expiry',
  REFRESH_EXPIRY: 'ruzizi_refresh_expiry',
} as const;

// Configuration constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export interface TokenInfo {
  payload: JWTPayload | null;
  expiresAt: number;
  timeRemaining: number;
  isExpired: boolean;
  isValid: boolean;
}

export interface TokenManagerEvents {
  onTokenRefreshed?: (newTokens: AuthTokens) => void;
  onTokenExpired?: () => void;
  onRefreshFailed?: (error: Error) => void;
}

/**
 * Unified Token Manager Class
 * Provides consistent token storage, validation, and automatic refresh
 */
export class UnifiedTokenManager {
  private static instance: UnifiedTokenManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthTokens | null> | null = null;
  private refreshSubscribers: ((tokens: AuthTokens | null) => void)[] = [];
  private events: TokenManagerEvents = {};
  private retryCount = 0;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedTokenManager {
    if (!UnifiedTokenManager.instance) {
      UnifiedTokenManager.instance = new UnifiedTokenManager();
    }
    return UnifiedTokenManager.instance;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(events: TokenManagerEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Store tokens with consistent naming and expiry calculation
   */
  setTokens(tokens: AuthTokens): void {
    try {
      if (typeof window === 'undefined') return;

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);

      // Calculate and store expiry times
      const accessTokenInfo = this.decodeToken(tokens.accessToken);
      const refreshTokenInfo = this.decodeToken(tokens.refreshToken);

      if (accessTokenInfo?.exp) {
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (accessTokenInfo.exp * 1000).toString());
      }

      if (refreshTokenInfo?.exp) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_EXPIRY, (refreshTokenInfo.exp * 1000).toString());
      }

      // Reset retry count on successful token storage
      this.retryCount = 0;

      console.log('✅ Tokens stored successfully with unified naming');
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('❌ Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('❌ Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Get both tokens (with backward compatibility for old storage format)
   */
  getTokens(): AuthTokens | null {
    // First try the new individual key format
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    // Fallback to old storage format for backward compatibility
    try {
      if (typeof window === 'undefined') return null;
      
      const oldTokensStr = localStorage.getItem('ruzizi_auth_tokens');
      if (oldTokensStr) {
        const oldTokens = JSON.parse(oldTokensStr) as AuthTokens;
        if (oldTokens.accessToken && oldTokens.refreshToken) {
          // Migrate to new format
          this.setTokens(oldTokens);
          // Remove old format
          localStorage.removeItem('ruzizi_auth_tokens');
          return oldTokens;
        }
      }
    } catch (error) {
      console.error('❌ Failed to retrieve tokens from old format:', error);
    }

    return null;
  }

  /**
   * Clear all tokens and related data
   */
  clearTokens(): void {
    try {
      if (typeof window === 'undefined') return;

      // Clear all token-related storage (new format)
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Also clear legacy keys for backward compatibility
      const legacyKeys = [
        'accessToken', 
        'refreshToken', 
        'user', 
        'ruzizi_auth_tokens', 
        'ruzizi_user'
      ];
      legacyKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Stop auto-refresh
      this.stopAutoRefresh();

      console.log('✅ All tokens cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  /**
   * Validate token format and signature (client-side validation)
   */
  isTokenValid(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Check JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Try to decode the payload
      const payload = this.decodeToken(token);
      return payload !== null && typeof payload === 'object';
    } catch {
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo.isExpired;
  }

  /**
   * Get comprehensive token information
   */
  getTokenInfo(token: string): TokenInfo {
    const defaultInfo: TokenInfo = {
      payload: null,
      expiresAt: 0,
      timeRemaining: 0,
      isExpired: true,
      isValid: false,
    };

    if (!this.isTokenValid(token)) {
      return defaultInfo;
    }

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return defaultInfo;
      }

      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeRemaining = Math.max(0, expiresAt - currentTime);
      const isExpired = timeRemaining <= 0;

      return {
        payload,
        expiresAt,
        timeRemaining,
        isExpired,
        isValid: !isExpired,
      };
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      return defaultInfo;
    }
  }

  /**
   * Decode JWT token payload (without verification)
   */
  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as JWTPayload;
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token needs refresh (within threshold)
   */
  private needsRefresh(token: string): boolean {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo.timeRemaining <= TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Start automatic token refresh monitoring
   */
  startAutoRefresh(): void {
    // Stop existing timer
    this.stopAutoRefresh();

    // Check immediately
    this.checkAndRefreshToken();

    // Set up periodic checking
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, TOKEN_CHECK_INTERVAL);

    console.log('✅ Auto-refresh started');
  }

  /**
   * Stop automatic token refresh monitoring
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('✅ Auto-refresh stopped');
    }
  }

  /**
   * Check and refresh token if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      const accessToken = this.getAccessToken();
      
      if (!accessToken) {
        return;
      }

      if (this.isTokenExpired(accessToken) || this.needsRefresh(accessToken)) {
        await this.refreshTokenIfNeeded();
      }
    } catch (error) {
      console.error('❌ Error during token check:', error);
    }
  }

  /**
   * Refresh token if needed with proper error handling
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      console.log('🚨 Missing tokens, cannot refresh');
      return null;
    }

    // Check if refresh token is expired first - immediate cleanup if expired
    if (this.isTokenExpired(refreshToken)) {
      console.log('🚨 Refresh token is expired, triggering immediate cleanup');
      this.handleRefreshFailure(new Error('Refresh token expired'));
      return null;
    }

    // If access token is still valid and doesn't need refresh, return it
    if (!this.isTokenExpired(accessToken) && !this.needsRefresh(accessToken)) {
      return accessToken;
    }

    // If refresh is already in progress, wait for it
    if (this.isRefreshing && this.refreshPromise) {
      const result = await this.refreshPromise;
      return result?.accessToken || null;
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result?.accessToken || null;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh with retry logic
   */
  private async performTokenRefresh(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.handleRefreshFailure(new Error('No refresh token available'));
      return null;
    }

    // Check if refresh token is expired - immediate cleanup if expired
    if (this.isTokenExpired(refreshToken)) {
      console.log('🚨 Refresh token is expired, triggering immediate cleanup');
      this.handleRefreshFailure(new Error('Refresh token expired'));
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
        
        // Distinguish between different types of errors
        if (response.status === 401 || response.status === 403) {
          // Authentication/authorization errors - likely expired/invalid refresh token
          console.log('🚨 Authentication error during refresh, triggering cleanup');
          this.handleRefreshFailure(error);
          return null;
        }
        
        // For other errors (network, server), allow retry
        throw error;
      }

      const data = await response.json();

      if (data.success && data.data?.tokens) {
        const newTokens = data.data.tokens as AuthTokens;
        
        // Store new tokens
        this.setTokens(newTokens);

        // Notify subscribers
        this.notifyRefreshSubscribers(newTokens);

        // Call event handler
        if (this.events.onTokenRefreshed) {
          this.events.onTokenRefreshed(newTokens);
        }

        console.log('✅ Tokens refreshed successfully');
        return newTokens;
      } else {
        throw new Error('Invalid refresh response format');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Check if this is a non-retryable error (auth-related)
      const errorMessage = (error as Error).message.toLowerCase();
      if (errorMessage.includes('refresh token') || errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        console.log('🚨 Non-retryable token error, triggering immediate cleanup');
        this.handleRefreshFailure(error as Error);
        return null;
      }
      
      // Retry logic for network/server errors only
      if (this.retryCount < MAX_RETRY_ATTEMPTS) {
        this.retryCount++;
        console.log(`🔄 Retrying token refresh (attempt ${this.retryCount}/${MAX_RETRY_ATTEMPTS})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * this.retryCount));
        
        return this.performTokenRefresh();
      }

      // Max retries reached, handle failure
      this.handleRefreshFailure(error as Error);
      return null;
    }
  }

  /**
   * Handle refresh failure with proper cleanup and logging
   */
  private handleRefreshFailure(error: Error): void {
    console.error('❌ Token refresh failed permanently:', error);

    // Import error logging utility dynamically to avoid circular dependencies
    import('../utils/error-logger').then(({ errorLogger }) => {
      errorLogger.logTokenError('refresh_failure', error, {
        operation: 'token_refresh_failure',
        retryCount: this.retryCount,
      });
    });

    // Clear all tokens immediately
    this.clearTokens();

    // Stop auto-refresh immediately
    this.stopAutoRefresh();

    // Reset retry count
    this.retryCount = 0;

    // Notify subscribers of failure
    this.notifyRefreshSubscribers(null);

    // Call event handlers
    if (this.events.onRefreshFailed) {
      this.events.onRefreshFailed(error);
    }

    if (this.events.onTokenExpired) {
      this.events.onTokenExpired();
    }

    // Redirect to login if in browser environment
    if (typeof window !== 'undefined' && window.location) {
      console.log('🔄 Redirecting to login due to token refresh failure');
      // Use setTimeout to avoid potential issues with immediate redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }

  /**
   * Subscribe to token refresh events
   */
  subscribeToRefresh(callback: (tokens: AuthTokens | null) => void): () => void {
    this.refreshSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.refreshSubscribers.indexOf(callback);
      if (index > -1) {
        this.refreshSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all refresh subscribers
   */
  private notifyRefreshSubscribers(tokens: AuthTokens | null): void {
    this.refreshSubscribers.forEach(callback => {
      try {
        callback(tokens);
      } catch (error) {
        console.error('❌ Error in refresh subscriber:', error);
      }
    });
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): {
    isAuthenticated: boolean;
    hasValidTokens: boolean;
    needsRefresh: boolean;
    timeUntilExpiry: number;
  } {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return {
        isAuthenticated: false,
        hasValidTokens: false,
        needsRefresh: false,
        timeUntilExpiry: 0,
      };
    }

    const accessTokenInfo = this.getTokenInfo(accessToken);
    const refreshTokenInfo = this.getTokenInfo(refreshToken);

    return {
      isAuthenticated: accessTokenInfo.isValid,
      hasValidTokens: accessTokenInfo.isValid && refreshTokenInfo.isValid,
      needsRefresh: this.needsRefresh(accessToken),
      timeUntilExpiry: accessTokenInfo.timeRemaining,
    };
  }
}

// Export singleton instance
export const unifiedTokenManager = UnifiedTokenManager.getInstance();