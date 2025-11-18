/**
 * Complete and Robust Authentication Utility
 * Handles JWT tokens, refresh, expiration, and automatic retry
 */

// Types
interface TokenPayload {
  exp: number;
  iat: number;
  userId: string;
  role: string;
}

interface RefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
  };
  error?: {
    message: string;
  };
}

// Constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiration
const MAX_RETRY_ATTEMPTS = 1;

// State management
const isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Parse JWT token
 */
export function parseToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseToken(token);
  if (!payload) return true;
  
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Check if token needs refresh (within threshold)
 */
export function shouldRefreshToken(token: string): boolean {
  const payload = parseToken(token);
  if (!payload) return true;
  
  const expirationTime = payload.exp * 1000;
  return Date.now() >= (expirationTime - TOKEN_REFRESH_THRESHOLD);
}

/**
 * Get access token from localStorage
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get refresh token from localStorage
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  }

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  }

/**
 * Redirect to login page
 */
export function redirectToLogin(message?: string): void {
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname;
  
  // Don't redirect if already on login page
  if (currentPath === '/auth/login' || currentPath === '/backoffice/login') return;
  
  // Clear auth data
  clearAuthData();
  
  // Build redirect URL
  const params = new URLSearchParams();
  params.set('redirect', currentPath);
  if (message) params.set('message', message);
  
  // Redirect to appropriate login page based on current path
  const loginPath = currentPath.startsWith('/admin') || currentPath.startsWith('/backoffice')
    ? '/backoffice/login'
    : '/auth/login';
  
  window.location.href = `${loginPath}?${params.toString()}`;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  
  if (!refreshToken) {
    console.warn('⚠️ No refresh token available');
    return null;
  }
  
  // Check if refresh token is expired
  if (isTokenExpired(refreshToken)) {
    console.warn('⚠️ Refresh token expired');
    redirectToLogin('Session expirée. Veuillez vous reconnecter.');
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
    
    const data: RefreshResponse = await response.json();
    
    if (response.ok && data.success && data.data) {
      const { accessToken, refreshToken: newRefreshToken } = data.data;
      
      // Store new tokens
      storeTokens(accessToken, newRefreshToken);
      
      return accessToken;
    } else {
      console.error('❌ Token refresh failed:', data.error?.message);
      redirectToLogin('Session expirée. Veuillez vous reconnecter.');
      return null;
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    redirectToLogin('Erreur de connexion. Veuillez vous reconnecter.');
    return null;
  }
}

/**
 * Get valid access token (with automatic refresh if needed)
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  let token = getStoredAccessToken();
  
  // No token available
  if (!token) {
    console.warn('⚠️ No access token found');
    redirectToLogin('Veuillez vous connecter.');
    return null;
  }
  
  // Token is expired
  if (isTokenExpired(token)) {
    console.warn('⚠️ Access token expired, attempting refresh...');
    token = await refreshAccessToken();
    
    if (!token) {
      return null;
    }
  }
  // Token needs refresh soon
  else if (shouldRefreshToken(token)) {
    // Refresh in background, but continue with current token
    refreshAccessToken().catch(err => {
      console.error('Background refresh failed:', err);
    });
  }
  
  return token;
}

/**
 * Handle API response
 */
async function handleApiResponse(response: Response, url: string): Promise<any> {
  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.warn('⚠️ 401 Unauthorized:', url);
    
    // Try to refresh token
    const newToken = await refreshAccessToken();
    
    if (!newToken) {
      throw new Error('UNAUTHORIZED');
    }
    
    // Return special flag to retry request
    return { __retry: true, token: newToken };
  }
  
  // Parse response
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  // Handle error responses
  if (!response.ok) {
    const errorMessage = typeof data === 'object' 
      ? data.error?.message || data.message || 'Erreur API'
      : data || 'Erreur API';
    
    throw new Error(errorMessage);
  }
  
  return data;
}

/**
 * Make authenticated API request with automatic retry on 401
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<any> {
  // Get valid token
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('No valid access token');
  }
  
  // Make request
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await handleApiResponse(response, url);
    
    // Retry if needed
    if (data.__retry && retryCount < MAX_RETRY_ATTEMPTS) {
      return fetchWithAuth(url, options, retryCount + 1);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        redirectToLogin('Session expirée. Veuillez vous reconnecter.');
      }
      throw error;
    }
    throw new Error('Erreur réseau');
  }
}

/**
 * Synchronous version - Get token without refresh (for immediate use)
 */
export function getAccessTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = getStoredAccessToken();
  
  if (!token) {
    return null;
  }
  
  // Check if expired
  if (isTokenExpired(token)) {
    return null;
  }
  
  return token;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessTokenSync();
  return token !== null;
}

/**
 * Get current user from token
 */
export function getCurrentUser(): TokenPayload | null {
  const token = getAccessTokenSync();
  if (!token) return null;
  
  return parseToken(token);
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string | string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const token = getAccessTokenSync();
    
    if (token) {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear data and redirect
    clearAuthData();
    window.location.href = '/auth/login';
  }
}
