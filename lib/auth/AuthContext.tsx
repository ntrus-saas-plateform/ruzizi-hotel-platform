'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserResponse, AuthTokens, SystemPermission } from '@/types/user.types';
import { unifiedTokenManager } from './unified-token-manager';

interface AuthContextType {
  user: UserResponse | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  forceRefreshToken: () => Promise<void>; // For testing purposes
  getAccessToken: () => string | null;
  isAdmin: () => boolean;
  hasPermission: (permission: SystemPermission) => boolean;
  canAccessEstablishment: (establishmentId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'ruzizi_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with unauthenticated state - components should begin unauthenticated
  const [user, setUser] = useState<UserResponse | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and tokens from unified token manager on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        console.log('🔄 Starting session restoration...');
        
        // Debug localStorage access
        console.log('🔄 localStorage type:', typeof localStorage);
        console.log('🔄 localStorage === window.localStorage:', localStorage === window.localStorage);
        console.log('🔄 Direct localStorage.getItem("ruzizi_user"):', localStorage.getItem('ruzizi_user'));
        console.log('🔄 window.localStorage.getItem("ruzizi_user"):', window.localStorage.getItem('ruzizi_user'));
        
        // Get tokens from unified token manager
        const storedTokens = unifiedTokenManager.getTokens();
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        console.log('🔄 Session restoration - storedTokens:', !!storedTokens, 'storedUser:', !!storedUser);
        console.log('🔄 Session restoration - storedTokens details:', storedTokens ? 'HAS_TOKENS' : 'NO_TOKENS');
        console.log('🔄 Session restoration - storedUser details:', storedUser ? `USER_DATA_LENGTH_${storedUser.length}` : 'NO_USER_DATA');

        if (storedTokens && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('🔄 Session restoration - parsed user:', parsedUser.email);
            
            // Convert date strings back to Date objects if they exist
            if (parsedUser.createdAt && typeof parsedUser.createdAt === 'string') {
              parsedUser.createdAt = new Date(parsedUser.createdAt);
            }
            if (parsedUser.updatedAt && typeof parsedUser.updatedAt === 'string') {
              parsedUser.updatedAt = new Date(parsedUser.updatedAt);
            }
            if (parsedUser.lastLogin && typeof parsedUser.lastLogin === 'string') {
              parsedUser.lastLogin = new Date(parsedUser.lastLogin);
            }
            
            // Validate tokens before setting state
            const accessTokenInfo = unifiedTokenManager.getTokenInfo(storedTokens.accessToken);
            const refreshTokenInfo = unifiedTokenManager.getTokenInfo(storedTokens.refreshToken);

            console.log('🔄 Session restoration - access token expired:', accessTokenInfo.isExpired, 'refresh token expired:', refreshTokenInfo.isExpired);

            // If both tokens are expired, clear everything
            if (accessTokenInfo.isExpired && refreshTokenInfo.isExpired) {
              console.log('🚨 Both tokens expired, clearing auth state');
              unifiedTokenManager.clearTokens();
              localStorage.removeItem(USER_STORAGE_KEY);
              return;
            }

            // If access token is expired but refresh token is valid, try to refresh
            if (accessTokenInfo.isExpired && !refreshTokenInfo.isExpired) {
              console.log('🔄 Access token expired, attempting refresh...');
              const refreshResult = await unifiedTokenManager.refreshTokenIfNeeded();
              if (refreshResult) {
                // Get the updated tokens from the manager after refresh
                const updatedTokens = unifiedTokenManager.getTokens();
                if (updatedTokens) {
                  setTokens(updatedTokens);
                  setUser(parsedUser);
                  console.log('� Senssion restoration - tokens refreshed and state set');
                } else {
                  // Refresh failed, clear everything
                  console.log('🚨 Token refresh failed, clearing auth state');
                  return;
                }
              } else {
                // Refresh failed, clear everything
                console.log('🚨 Token refresh failed, clearing auth state');
                return;
              }
            } else {
              // Tokens are valid, set state
              setTokens(storedTokens);
              setUser(parsedUser);
              console.log('🔄 Session restoration - tokens valid, state set');
            }

            // Skip API refresh during testing to avoid network calls
            const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                                      (typeof window !== 'undefined' && window.location.href.includes('test')) ||
                                      typeof jest !== 'undefined';
            
            if (!isTestEnvironment) {
              // Refresh user data from API to get latest info (optional, don't fail if it doesn't work)
              try {
                console.log('🔄 Refreshing user data from API...');
                const currentTokens = unifiedTokenManager.getTokens();
                if (currentTokens) {
                  const response = await fetch('/api/auth/me', {
                    headers: {
                      'Authorization': `Bearer ${currentTokens.accessToken}`,
                    },
                  });

                  if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                      console.log('🔄 Successfully refreshed user data');
                      setUser(data.user);
                      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
                    }
                  }
                }
              } catch (apiError) {
                console.warn('🔄 Failed to refresh user data from API (continuing with stored data):', apiError);
                // Continue with stored data if API fails - this is not critical
              }
            }
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
            unifiedTokenManager.clearTokens();
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        } else {
          console.log('🔄 Session restoration - no stored tokens or user found');
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
        unifiedTokenManager.clearTokens();
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setTokens(null);
      } finally {
        // Always set loading to false when session restoration is complete
        console.log('🔄 Session restoration complete, setting loading to false');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure components start in unauthenticated state first
    const timer = setTimeout(() => {
      loadAuth();
    }, 10);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Set up token manager event handlers and auto-refresh
  useEffect(() => {
    // Set up token manager event handlers
    unifiedTokenManager.setEventHandlers({
      onTokenRefreshed: (newTokens) => {
        console.log('🔄 Token refreshed, updating context state');
        setTokens(newTokens);
      },
      onTokenExpired: () => {
        console.log('🚨 Token expired, clearing auth state');
        setUser(null);
        setTokens(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      },
      onRefreshFailed: (error) => {
        console.error('🚨 Token refresh failed, clearing auth state:', error);
        setUser(null);
        setTokens(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      },
    });

    // Start automatic token refresh (only in browser environment and not during testing)
    const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                              (typeof window !== 'undefined' && window.location.href.includes('test')) ||
                              typeof jest !== 'undefined';
    
    if (!isTestEnvironment) {
      unifiedTokenManager.startAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      unifiedTokenManager.stopAutoRefresh();
    };
  }, []);

  // Save user to localStorage whenever it changes (but not during initial session restoration)
  useEffect(() => {
    // Don't save/remove user data during initial loading phase
    if (isLoading) {
      return;
    }
    
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user, isLoading]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Import error handling utilities dynamically to avoid circular dependencies
        const { createAuthErrorFromResponse } = await import('../errors/auth-errors');
        const { errorLogger } = await import('../utils/error-logger');
        
        // Create specific error based on response
        const authError = createAuthErrorFromResponse(response, data);
        
        // Log authentication error with context
        errorLogger.logAuthError(authError, {
          operation: 'login',
          endpoint: '/api/auth/login',
          userId: email, // Safe to log email for login attempts
        });
        
        throw authError;
      }

      console.log('🔐 Login successful, updating auth state');

      // Store tokens using unified token manager first
      unifiedTokenManager.setTokens(data.data.tokens);
      
      // Then update context state consistently
      setUser(data.data.user);
      setTokens(data.data.tokens);
      
      // Store user data in localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user));
      
      console.log('🔐 Auth state updated successfully');

      // Preload user establishment data if user has an establishment
      if (data.data.user.establishmentId) {
        try {
          console.log('🚀 Preloading establishment data...');
          const establishmentResponse = await fetch('/api/establishments', {
            headers: {
              'Authorization': `Bearer ${data.data.tokens.accessToken}`,
            },
          });
          
          if (establishmentResponse.ok) {
            const establishmentData = await establishmentResponse.json();
            console.log('🚀 Establishment data preloaded successfully');
            // The data will be cached by EstablishmentSelector when it's used
          }
        } catch (preloadError) {
          console.warn('🚀 Failed to preload establishment data (non-critical):', preloadError);
          // Don't fail login if preloading fails
        }
      }
      
    } catch (error) {
      console.error('🚨 Login error:', error);
      
      // Ensure clean state on login failure
      setUser(null);
      setTokens(null);
      unifiedTokenManager.clearTokens();
      localStorage.removeItem(USER_STORAGE_KEY);
      
      // Re-throw the specific error for the UI to handle
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logging out, clearing all auth state');
    
    // Clear state immediately and consistently
    setUser(null);
    setTokens(null);
    
    // Clear tokens from unified token manager
    unifiedTokenManager.clearTokens();
    
    // Clear user data from localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Stop auto-refresh
    unifiedTokenManager.stopAutoRefresh();
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      console.log('🔄 Attempting token refresh...');
      
      const newTokens = await unifiedTokenManager.refreshTokenIfNeeded();
      if (newTokens) {
        console.log('🔄 Token refresh successful, updating context state');
        
        // Get the latest tokens from the manager (they might have been updated)
        const currentTokens = unifiedTokenManager.getTokens();
        setTokens(currentTokens);
      } else {
        console.log('🚨 Token refresh failed, clearing auth state');
        
        // Clear state consistently
        setUser(null);
        setTokens(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('🚨 Token refresh error:', error);
      
      // Import error logging utility
      const { errorLogger } = await import('../utils/error-logger');
      
      // Log token refresh error
      errorLogger.logTokenError('refresh', error as Error, {
        operation: 'token_refresh',
        userId: user?.id,
      });
      
      // Clear state consistently on error
      setUser(null);
      setTokens(null);
      unifiedTokenManager.clearTokens();
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user?.id]);

  const forceRefreshToken = useCallback(async () => {
    try {
      console.log('🔄 Force refreshing token...');
      
      // Force refresh by calling the API directly
      const refreshTokenValue = unifiedTokenManager.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data?.tokens) {
        const newTokens = data.data.tokens;
        unifiedTokenManager.setTokens(newTokens);
        setTokens(newTokens);
        console.log('🔄 Force refresh successful');
        return newTokens; // Return the new tokens for testing
      } else {
        throw new Error('Invalid refresh response format');
      }
    } catch (error) {
      console.error('🚨 Force refresh error:', error);
      
      // Clear state consistently on error
      setUser(null);
      setTokens(null);
      unifiedTokenManager.clearTokens();
      localStorage.removeItem(USER_STORAGE_KEY);
      throw error; // Re-throw for test handling
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await refreshToken();
  }, [refreshToken]);

  const getAccessToken = useCallback(() => {
    return unifiedTokenManager.getAccessToken();
  }, []);

  // Memoize computed values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!user && !!tokens, [user, tokens]);
  
  const isAdmin = useCallback(() => {
    return user?.role === 'root' || user?.role === 'super_admin';
  }, [user?.role]);

  const hasPermission = useCallback((permission: SystemPermission) => {
    if (!user) return false;
    if (user.role === 'root' || user.role === 'super_admin') return true; // Admins have all permissions
    return user.permissions?.includes(permission) || false;
  }, [user]);

  const canAccessEstablishment = useCallback((establishmentId: string) => {
    if (!user) return false;
    if (user.role === 'root' || user.role === 'super_admin') return true; // Admins can access all establishments
    return user.establishmentId === establishmentId;
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    forceRefreshToken,
    refreshAuth,
    getAccessToken,
    isAdmin,
    hasPermission,
    canAccessEstablishment,
  }), [
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    forceRefreshToken,
    refreshAuth,
    getAccessToken,
    isAdmin,
    hasPermission,
    canAccessEstablishment,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
