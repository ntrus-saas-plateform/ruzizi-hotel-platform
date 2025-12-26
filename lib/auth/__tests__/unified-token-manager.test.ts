/**
 * Property-based tests for Unified Token Manager
 * Feature: auth-establishment-improvement
 */

import * as fc from 'fast-check';
import { UnifiedTokenManager } from '../unified-token-manager';
import type { AuthTokens } from '@/types/user.types';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Mock window and localStorage for Node environment
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    location: {
      href: '',
    },
  },
  writable: true,
});

// Also define localStorage globally
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for token refresh tests
global.fetch = jest.fn();

// Mock btoa for JWT encoding in Node environment
global.btoa = (str: string) => Buffer.from(str).toString('base64');

// Helper function to create valid JWT tokens for testing
function createMockJWT(payload: any, expiresInMinutes: number = 60): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresInMinutes * 60);
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp: exp,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  const signature = 'mock-signature';

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper to create tokens that are definitely expired
function createExpiredMockJWT(payload: any, expiredMinutesAgo: number = 10): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now - (expiredMinutesAgo * 60); // Expired in the past
  
  const fullPayload = {
    ...payload,
    iat: now - (expiredMinutesAgo * 60) - 60, // Issued before expiry
    exp: exp,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(fullPayload));
  const signature = 'mock-signature';

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Generators for property-based testing
const tokenPayloadArb = fc.record({
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
  establishmentId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
});

const authTokensArb = fc.record({
  accessToken: tokenPayloadArb.map(payload => createMockJWT(payload, 60)),
  refreshToken: tokenPayloadArb.map(payload => createMockJWT(payload, 10080)), // 7 days
});

const expiredTokensArb = fc.record({
  accessToken: tokenPayloadArb.map(payload => createExpiredMockJWT(payload, 10)), // Expired 10 minutes ago
  refreshToken: tokenPayloadArb.map(payload => createExpiredMockJWT(payload, 10)), // Expired 10 minutes ago
});

describe('Unified Token Manager - Property Tests', () => {
  let tokenManager: UnifiedTokenManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Create fresh instance for each test
    tokenManager = UnifiedTokenManager.getInstance();
    
    // Clear any existing timers
    tokenManager.stopAutoRefresh();
    
    // Reset fetch mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    tokenManager.stopAutoRefresh();
    localStorageMock.clear();
  });

  /**
   * Property 6: Token Management Consistency
   * Validates: Requirements 3.1, 3.4, 3.5
   */
  describe('Property 6: Token Management Consistency', () => {
    test('**Feature: auth-establishment-improvement, Property 6: Token Management Consistency**', () => {
      fc.assert(
        fc.property(authTokensArb, (tokens) => {
          // Store tokens using unified manager
          tokenManager.setTokens(tokens);

          // Retrieve tokens using unified manager
          const retrievedAccessToken = tokenManager.getAccessToken();
          const retrievedRefreshToken = tokenManager.getRefreshToken();
          const retrievedTokens = tokenManager.getTokens();

          // Verify consistency: stored tokens should match retrieved tokens
          expect(retrievedAccessToken).toBe(tokens.accessToken);
          expect(retrievedRefreshToken).toBe(tokens.refreshToken);
          expect(retrievedTokens).toEqual(tokens);

          // Verify consistent storage keys are used
          const directAccessToken = localStorageMock.getItem('ruzizi_access_token');
          const directRefreshToken = localStorageMock.getItem('ruzizi_refresh_token');
          
          expect(directAccessToken).toBe(tokens.accessToken);
          expect(directRefreshToken).toBe(tokens.refreshToken);

          // Verify no legacy keys are used
          expect(localStorageMock.getItem('accessToken')).toBeNull();
          expect(localStorageMock.getItem('refreshToken')).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    test('Token storage should be consistent across multiple operations', () => {
      fc.assert(
        fc.property(fc.array(authTokensArb, { minLength: 1, maxLength: 10 }), (tokensList) => {
          // Store multiple token sets sequentially
          tokensList.forEach((tokens, index) => {
            tokenManager.setTokens(tokens);
            
            // Each storage operation should overwrite previous tokens consistently
            const retrieved = tokenManager.getTokens();
            expect(retrieved).toEqual(tokens);
          });

          // Final state should match the last tokens stored
          const finalTokens = tokensList[tokensList.length - 1];
          const finalRetrieved = tokenManager.getTokens();
          expect(finalRetrieved).toEqual(finalTokens);
        }),
        { numRuns: 50 }
      );
    });

    test('Token clearing should remove all token-related data consistently', () => {
      fc.assert(
        fc.property(authTokensArb, (tokens) => {
          // Store tokens first
          tokenManager.setTokens(tokens);
          
          // Verify tokens are stored
          expect(tokenManager.getTokens()).toEqual(tokens);
          
          // Clear tokens
          tokenManager.clearTokens();
          
          // Verify all token data is cleared
          expect(tokenManager.getAccessToken()).toBeNull();
          expect(tokenManager.getRefreshToken()).toBeNull();
          expect(tokenManager.getTokens()).toBeNull();
          
          // Verify storage is completely clean
          expect(localStorageMock.getItem('ruzizi_access_token')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_refresh_token')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_token_expiry')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_refresh_expiry')).toBeNull();
          
          // Verify legacy keys are also cleared
          expect(localStorageMock.getItem('accessToken')).toBeNull();
          expect(localStorageMock.getItem('refreshToken')).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Automatic Token Refresh
   * Validates: Requirements 3.2
   */
  describe('Property 7: Automatic Token Refresh', () => {
    test('**Feature: auth-establishment-improvement, Property 7: Automatic Token Refresh**', async () => {
      await fc.assert(
        fc.asyncProperty(tokenPayloadArb, async (payload) => {
          // Mock successful refresh response
          const newTokens = {
            accessToken: createMockJWT(payload, 60),
            refreshToken: createMockJWT(payload, 10080),
          };

          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: { tokens: newTokens }
            }),
          });

          // Create an expired access token but valid refresh token
          const originalTokens = {
            accessToken: createExpiredMockJWT(payload, 5), // Expired 5 minutes ago
            refreshToken: createMockJWT(payload, 10080), // Valid refresh token
          };
          
          tokenManager.setTokens(originalTokens);

          // Verify tokens are initially stored
          expect(tokenManager.getTokens()).toEqual(originalTokens);
          expect(tokenManager.isTokenExpired(originalTokens.accessToken)).toBe(true);
          expect(tokenManager.isTokenExpired(originalTokens.refreshToken)).toBe(false);

          // Attempt to refresh token
          const refreshedToken = await tokenManager.refreshTokenIfNeeded();

          // Verify refresh was attempted and successful
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: originalTokens.refreshToken }),
          }));

          // Verify new tokens are stored
          expect(refreshedToken).toBe(newTokens.accessToken);
          expect(tokenManager.getTokens()).toEqual(newTokens);
        }),
        { numRuns: 50 }
      );
    });

    test('Token refresh should handle concurrent requests properly', async () => {
      await fc.assert(
        fc.asyncProperty(tokenPayloadArb, async (payload) => {
          // Reset fetch mock and clear localStorage for each property test iteration
          jest.clearAllMocks();
          localStorageMock.clear();
          
          // Stop any existing refresh processes
          tokenManager.stopAutoRefresh();
          
          const newTokens = {
            accessToken: createMockJWT(payload, 60),
            refreshToken: createMockJWT(payload, 10080),
          };

          // Mock a delayed response to simulate concurrent requests
          (global.fetch as jest.Mock).mockImplementationOnce(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({
                ok: true,
                json: async () => ({ success: true, data: { tokens: newTokens } })
              }), 50) // Shorter delay to avoid test timeout
            )
          );

          // Store expired tokens
          const expiredTokens = {
            accessToken: createExpiredMockJWT(payload, 5),
            refreshToken: createMockJWT(payload, 10080), // Valid refresh token
          };
          tokenManager.setTokens(expiredTokens);

          // Make multiple concurrent refresh requests
          const refreshPromises = [
            tokenManager.refreshTokenIfNeeded(),
            tokenManager.refreshTokenIfNeeded(),
            tokenManager.refreshTokenIfNeeded(),
          ];

          const results = await Promise.all(refreshPromises);

          // All requests should return the same new token
          results.forEach(result => {
            expect(result).toBe(newTokens.accessToken);
          });

          // API should only be called once despite multiple concurrent requests
          expect(global.fetch).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 8: Invalid Token Cleanup
   * Validates: Requirements 3.3
   */
  describe('Property 8: Invalid Token Cleanup', () => {
    test('**Feature: auth-establishment-improvement, Property 8: Invalid Token Cleanup**', async () => {
      await fc.assert(
        fc.asyncProperty(tokenPayloadArb, async (payload) => {
          // Mock failed refresh response (invalid refresh token)
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({
              success: false,
              error: { message: 'Invalid refresh token' }
            }),
          });

          // Create tokens where both are expired (simulating invalid refresh scenario)
          const expiredTokens = {
            accessToken: createExpiredMockJWT(payload, 5),
            refreshToken: createExpiredMockJWT(payload, 1), // Expired refresh token
          };

          tokenManager.setTokens(expiredTokens);

          // Verify tokens are initially stored
          expect(tokenManager.getTokens()).toEqual(expiredTokens);

          // Attempt refresh with invalid tokens - should fail immediately due to expired refresh token
          const result = await tokenManager.refreshTokenIfNeeded();

          // Verify refresh failed
          expect(result).toBeNull();

          // Verify all tokens are cleared after failed refresh
          expect(tokenManager.getAccessToken()).toBeNull();
          expect(tokenManager.getRefreshToken()).toBeNull();
          expect(tokenManager.getTokens()).toBeNull();

          // Verify storage is completely clean
          expect(localStorageMock.getItem('ruzizi_access_token')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_refresh_token')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_token_expiry')).toBeNull();
          expect(localStorageMock.getItem('ruzizi_refresh_expiry')).toBeNull();
        }),
        { numRuns: 50 }
      );
    });

    test('Invalid token format should be handled gracefully', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), (invalidAccessToken, invalidRefreshToken) => {
          // Skip valid JWT-like strings to ensure we test truly invalid tokens
          fc.pre(!invalidAccessToken.includes('.') || invalidAccessToken.split('.').length !== 3);
          fc.pre(!invalidRefreshToken.includes('.') || invalidRefreshToken.split('.').length !== 3);

          const invalidTokens = {
            accessToken: invalidAccessToken,
            refreshToken: invalidRefreshToken,
          };

          // Store invalid tokens
          tokenManager.setTokens(invalidTokens);

          // Verify individual tokens are stored
          expect(tokenManager.getAccessToken()).toBe(invalidAccessToken);
          expect(tokenManager.getRefreshToken()).toBe(invalidRefreshToken);

          // Verify token validation correctly identifies invalid tokens
          expect(tokenManager.isTokenValid(invalidAccessToken)).toBe(false);
          expect(tokenManager.isTokenValid(invalidRefreshToken)).toBe(false);

          // Verify token info returns safe defaults for invalid tokens
          const accessTokenInfo = tokenManager.getTokenInfo(invalidAccessToken);
          expect(accessTokenInfo.isValid).toBe(false);
          expect(accessTokenInfo.isExpired).toBe(true);
          expect(accessTokenInfo.payload).toBeNull();

          const refreshTokenInfo = tokenManager.getTokenInfo(invalidRefreshToken);
          expect(refreshTokenInfo.isValid).toBe(false);
          expect(refreshTokenInfo.isExpired).toBe(true);
          expect(refreshTokenInfo.payload).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    test('Expired refresh token should trigger immediate cleanup', async () => {
      await fc.assert(
        fc.asyncProperty(tokenPayloadArb, async (payload) => {
          // Create tokens where refresh token is expired
          const tokens = {
            accessToken: createExpiredMockJWT(payload, 5), // Expired access token
            refreshToken: createExpiredMockJWT(payload, 60), // Expired refresh token (1 hour ago)
          };

          tokenManager.setTokens(tokens);

          // Verify tokens are stored
          expect(tokenManager.getTokens()).toEqual(tokens);
          expect(tokenManager.isTokenExpired(tokens.refreshToken)).toBe(true);

          // Attempt refresh with expired refresh token
          const result = await tokenManager.refreshTokenIfNeeded();

          // Should return null without making API call
          expect(result).toBeNull();
          expect(global.fetch).not.toHaveBeenCalled();

          // All tokens should be cleared
          expect(tokenManager.getTokens()).toBeNull();
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Token Validation Properties', () => {
    test('Valid tokens should be correctly identified', () => {
      fc.assert(
        fc.property(tokenPayloadArb, (payload) => {
          const validToken = createMockJWT(payload, 60);
          
          expect(tokenManager.isTokenValid(validToken)).toBe(true);
          expect(tokenManager.isTokenExpired(validToken)).toBe(false);
          
          const tokenInfo = tokenManager.getTokenInfo(validToken);
          expect(tokenInfo.isValid).toBe(true);
          expect(tokenInfo.isExpired).toBe(false);
          expect(tokenInfo.payload).toMatchObject(payload);
        }),
        { numRuns: 100 }
      );
    });

    test('Expired tokens should be correctly identified', () => {
      fc.assert(
        fc.property(tokenPayloadArb, (payload) => {
          const expiredToken = createMockJWT(payload, -60); // Expired 1 hour ago
          
          expect(tokenManager.isTokenValid(expiredToken)).toBe(true); // Format is valid
          expect(tokenManager.isTokenExpired(expiredToken)).toBe(true); // But expired
          
          const tokenInfo = tokenManager.getTokenInfo(expiredToken);
          expect(tokenInfo.isValid).toBe(false); // Overall validity is false
          expect(tokenInfo.isExpired).toBe(true);
          expect(tokenInfo.timeRemaining).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Authentication Status Properties', () => {
    test('Authentication status should accurately reflect token state', () => {
      fc.assert(
        fc.property(authTokensArb, (tokens) => {
          tokenManager.setTokens(tokens);
          
          const authStatus = tokenManager.getAuthStatus();
          
          // With valid tokens, should be authenticated
          expect(authStatus.isAuthenticated).toBe(true);
          expect(authStatus.hasValidTokens).toBe(true);
          expect(authStatus.timeUntilExpiry).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    test('Authentication status should be false with no tokens', () => {
      tokenManager.clearTokens();
      
      const authStatus = tokenManager.getAuthStatus();
      
      expect(authStatus.isAuthenticated).toBe(false);
      expect(authStatus.hasValidTokens).toBe(false);
      expect(authStatus.needsRefresh).toBe(false);
      expect(authStatus.timeUntilExpiry).toBe(0);
    });
  });
});