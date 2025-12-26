/**
 * Property-based tests for transparent token refresh
 * Feature: auth-establishment-improvement, Property 15: Transparent Token Refresh
 * Validates: Requirements 6.5
 */

import * as fc from 'fast-check';
import { UnifiedTokenManager } from '../unified-token-manager';
import { apiClient } from '../../api/client';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage for Node environment
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

// Mock btoa for JWT encoding in Node environment
global.btoa = (str: string) => Buffer.from(str).toString('base64');

// Helper function to create a JWT-like token with expiry
function createMockToken(expiresInSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'test-user',
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}

describe('Property 15: Transparent Token Refresh', () => {
  let tokenManager: UnifiedTokenManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    tokenManager = new UnifiedTokenManager();
    
    // Reset any existing refresh state
    (tokenManager as any).isRefreshing = false;
    (tokenManager as any).refreshPromise = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property: For any token expiry during user interaction, refresh should happen transparently
   */
  it('should refresh tokens transparently without disrupting user experience', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialTokenExpirySeconds: fc.integer({ min: -300, max: 300 }), // Can be expired or valid
          refreshTokenExpirySeconds: fc.integer({ min: 3600, max: 86400 }), // Always valid for refresh
          userOperation: fc.constantFrom('fetchData', 'updateProfile', 'createResource', 'deleteResource'),
          apiEndpoint: fc.constantFrom('/api/users/profile', '/api/establishments', '/api/bookings', '/api/clients'),
          expectedData: fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            status: fc.constantFrom('active', 'inactive', 'pending')
          })
        }),
        async ({ initialTokenExpirySeconds, refreshTokenExpirySeconds, userOperation, apiEndpoint, expectedData }) => {
          // Setup initial tokens
          const initialAccessToken = createMockToken(initialTokenExpirySeconds);
          const refreshToken = createMockToken(refreshTokenExpirySeconds);
          const newAccessToken = createMockToken(3600); // New token valid for 1 hour

          // Store initial tokens
          localStorageMock.setItem('ruzizi_access_token', initialAccessToken);
          localStorageMock.setItem('ruzizi_refresh_token', refreshToken);

          let fetchCallCount = 0;
          let refreshCallMade = false;

          // Mock fetch responses
          mockFetch.mockImplementation(async (url, options) => {
            fetchCallCount++;
            
            // If this is a refresh token request
            if (url === '/api/auth/refresh' || (typeof url === 'string' && url.includes('refresh'))) {
              refreshCallMade = true;
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  success: true,
                  data: {
                    accessToken: newAccessToken,
                    refreshToken: refreshToken, // Keep same refresh token
                    expiresIn: 3600
                  }
                })
              } as Response;
            }

            // For the actual API call
            const authHeader = (options as any)?.headers?.Authorization;
            
            // If token is expired and no refresh happened yet, return 401
            if (initialTokenExpirySeconds <= 0 && !refreshCallMade) {
              return {
                ok: false,
                status: 401,
                json: async () => ({
                  success: false,
                  error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
                })
              } as Response;
            }

            // If we have a valid token (either initial was valid or refresh happened), return success
            return {
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: expectedData
              })
            } as Response;
          });

          try {
            // Perform user operation that might trigger token refresh
            let result;
            switch (userOperation) {
              case 'fetchData':
                result = await apiClient.get(apiEndpoint);
                break;
              case 'updateProfile':
                result = await apiClient.put(apiEndpoint, expectedData);
                break;
              case 'createResource':
                result = await apiClient.post(apiEndpoint, expectedData);
                break;
              case 'deleteResource':
                result = await apiClient.delete(apiEndpoint);
                break;
            }

            // Verify operation completed successfully
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toEqual(expectedData);

            // If initial token was expired, verify refresh happened transparently
            if (initialTokenExpirySeconds <= 0) {
              expect(refreshCallMade).toBe(true);
              expect(fetchCallCount).toBeGreaterThanOrEqual(2); // At least refresh + actual call
              
              // Verify new token was stored
              expect(localStorageMock.getItem('ruzizi_access_token')).toBe(newAccessToken);
            } else {
              // If token was still valid, no refresh should have occurred
              expect(fetchCallCount).toBe(1); // Only the actual API call
            }

            // Verify user experience was not disrupted (no errors thrown)
            expect(result.success).toBe(true);

          } catch (error) {
            // If refresh token is also expired, this is expected
            if (refreshTokenExpirySeconds <= 0) {
              expect((error as Error).message).toMatch(/refresh.*failed|token.*expired/i);
            } else {
              // Otherwise, this is unexpected
              throw error;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any concurrent requests during token refresh, all should wait for the same refresh
   */
  it('should handle concurrent requests during token refresh without multiple refresh attempts', () => {
    fc.assert(
      fc.property(
        fc.record({
          concurrentRequests: fc.integer({ min: 2, max: 5 }),
          tokenExpirySeconds: fc.integer({ min: -60, max: 0 }), // Expired token
          refreshTokenExpirySeconds: fc.integer({ min: 3600, max: 86400 }),
          endpoints: fc.array(
            fc.constantFrom('/api/users', '/api/establishments', '/api/bookings', '/api/clients'),
            { minLength: 2, maxLength: 5 }
          )
        }),
        async ({ concurrentRequests, tokenExpirySeconds, refreshTokenExpirySeconds, endpoints }) => {
          // Setup expired access token and valid refresh token
          const expiredAccessToken = createMockToken(tokenExpirySeconds);
          const refreshToken = createMockToken(refreshTokenExpirySeconds);
          const newAccessToken = createMockToken(3600);

          localStorageMock.setItem('ruzizi_access_token', expiredAccessToken);
          localStorageMock.setItem('ruzizi_refresh_token', refreshToken);

          let refreshCallCount = 0;
          let apiCallCount = 0;

          mockFetch.mockImplementation(async (url, options) => {
            // Add small delay to simulate network latency
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

            if (url === '/api/auth/refresh' || (typeof url === 'string' && url.includes('refresh'))) {
              refreshCallCount++;
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  success: true,
                  data: {
                    accessToken: newAccessToken,
                    refreshToken: refreshToken,
                    expiresIn: 3600
                  }
                })
              } as Response;
            }

            // For API calls, first call with expired token returns 401, subsequent calls succeed
            apiCallCount++;
            if (apiCallCount === 1) {
              return {
                ok: false,
                status: 401,
                json: async () => ({
                  success: false,
                  error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
                })
              } as Response;
            }

            return {
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: { message: 'Success', endpoint: url }
              })
            } as Response;
          });

          // Make concurrent requests
          const requestPromises = endpoints.slice(0, concurrentRequests).map(async (endpoint, index) => {
            try {
              return await apiClient.get(endpoint);
            } catch (error) {
              return { error: (error as Error).message, endpoint };
            }
          });

          const results = await Promise.all(requestPromises);

          // Verify all requests completed successfully
          results.forEach((result, index) => {
            if ('error' in result) {
              // Only acceptable if refresh token was also expired
              expect(refreshTokenExpirySeconds).toBeLessThanOrEqual(0);
            } else {
              expect(result.success).toBe(true);
            }
          });

          // Verify only one refresh call was made despite multiple concurrent requests
          if (refreshTokenExpirySeconds > 0) {
            expect(refreshCallCount).toBe(1);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs due to concurrent nature
    );
  });

  /**
   * Property: For any token refresh failure, user should be redirected to login without data loss
   */
  it('should handle token refresh failures gracefully with appropriate user redirection', () => {
    fc.assert(
      fc.property(
        fc.record({
          refreshFailureType: fc.constantFrom(
            'EXPIRED_REFRESH_TOKEN',
            'INVALID_REFRESH_TOKEN', 
            'NETWORK_ERROR',
            'SERVER_ERROR'
          ),
          userOperation: fc.constantFrom('fetchProfile', 'saveData', 'uploadFile'),
          operationData: fc.record({
            id: fc.uuid(),
            content: fc.string({ minLength: 1, maxLength: 100 })
          })
        }),
        async ({ refreshFailureType, userOperation, operationData }) => {
          // Setup expired access token
          const expiredAccessToken = createMockToken(-60); // Expired 1 minute ago
          const refreshToken = createMockToken(3600); // Valid refresh token

          localStorageMock.setItem('ruzizi_access_token', expiredAccessToken);
          localStorageMock.setItem('ruzizi_refresh_token', refreshToken);

          let refreshAttempted = false;

          mockFetch.mockImplementation(async (url, options) => {
            if (url === '/api/auth/refresh' || (typeof url === 'string' && url.includes('refresh'))) {
              refreshAttempted = true;
              
              // Simulate different refresh failure scenarios
              switch (refreshFailureType) {
                case 'EXPIRED_REFRESH_TOKEN':
                  return {
                    ok: false,
                    status: 401,
                    json: async () => ({
                      success: false,
                      error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token expired' }
                    })
                  } as Response;
                  
                case 'INVALID_REFRESH_TOKEN':
                  return {
                    ok: false,
                    status: 401,
                    json: async () => ({
                      success: false,
                      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
                    })
                  } as Response;
                  
                case 'NETWORK_ERROR':
                  throw new Error('Network request failed');
                  
                case 'SERVER_ERROR':
                  return {
                    ok: false,
                    status: 500,
                    json: async () => ({
                      success: false,
                      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }
                    })
                  } as Response;
              }
            }

            // Initial API call that triggers refresh
            return {
              ok: false,
              status: 401,
              json: async () => ({
                success: false,
                error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
              })
            } as Response;
          });

          try {
            // Attempt user operation
            await apiClient.get('/api/test');
            
            // Should not reach here if refresh fails
            expect(refreshFailureType).toBe('SUCCESS'); // This should never be the case in this test
            
          } catch (error) {
            // Verify refresh was attempted
            expect(refreshAttempted).toBe(true);
            
            // Verify appropriate error handling
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message.toLowerCase();
            
            switch (refreshFailureType) {
              case 'EXPIRED_REFRESH_TOKEN':
              case 'INVALID_REFRESH_TOKEN':
                expect(errorMessage).toMatch(/refresh.*token|token.*expired|invalid.*token/);
                break;
              case 'NETWORK_ERROR':
                expect(errorMessage).toMatch(/network|connection|failed/);
                break;
              case 'SERVER_ERROR':
                expect(errorMessage).toMatch(/server.*error|internal.*error/);
                break;
            }
            
            // Verify tokens are cleared on refresh failure (for security)
            if (refreshFailureType === 'EXPIRED_REFRESH_TOKEN' || refreshFailureType === 'INVALID_REFRESH_TOKEN') {
              expect(localStorageMock.getItem('ruzizi_access_token')).toBeNull();
              expect(localStorageMock.getItem('ruzizi_refresh_token')).toBeNull();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any successful token refresh, new tokens should be stored and used immediately
   */
  it('should store and use new tokens immediately after successful refresh', () => {
    fc.assert(
      fc.property(
        fc.record({
          newTokenExpirySeconds: fc.integer({ min: 1800, max: 86400 }), // 30 minutes to 24 hours
          refreshTokenExpirySeconds: fc.integer({ min: 86400, max: 604800 }), // 1 day to 1 week
          subsequentApiCall: fc.constantFrom('/api/profile', '/api/settings', '/api/data')
        }),
        async ({ newTokenExpirySeconds, refreshTokenExpirySeconds, subsequentApiCall }) => {
          // Setup expired access token
          const expiredAccessToken = createMockToken(-60);
          const refreshToken = createMockToken(refreshTokenExpirySeconds);
          const newAccessToken = createMockToken(newTokenExpirySeconds);
          const newRefreshToken = createMockToken(refreshTokenExpirySeconds + 3600); // Extended refresh token

          localStorageMock.setItem('ruzizi_access_token', expiredAccessToken);
          localStorageMock.setItem('ruzizi_refresh_token', refreshToken);

          let refreshCompleted = false;
          let newTokenUsed = false;

          mockFetch.mockImplementation(async (url, options) => {
            if (url === '/api/auth/refresh' || (typeof url === 'string' && url.includes('refresh'))) {
              refreshCompleted = true;
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  success: true,
                  data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: newTokenExpirySeconds
                  }
                })
              } as Response;
            }

            // Check if new token is being used
            const authHeader = (options as any)?.headers?.Authorization;
            if (authHeader === `Bearer ${newAccessToken}`) {
              newTokenUsed = true;
            }

            // First call with expired token returns 401, subsequent calls with new token succeed
            if (!refreshCompleted) {
              return {
                ok: false,
                status: 401,
                json: async () => ({
                  success: false,
                  error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
                })
              } as Response;
            }

            return {
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: { message: 'Success with new token' }
              })
            } as Response;
          });

          // Make initial API call that triggers refresh
          const result = await apiClient.get('/api/initial');

          // Verify refresh completed successfully
          expect(refreshCompleted).toBe(true);
          expect(result.success).toBe(true);

          // Verify new tokens were stored
          expect(localStorageMock.getItem('ruzizi_access_token')).toBe(newAccessToken);
          expect(localStorageMock.getItem('ruzizi_refresh_token')).toBe(newRefreshToken);

          // Make subsequent API call to verify new token is used
          localStorageMock.setItem('ruzizi_access_token', newAccessToken);
          localStorageMock.setItem('ruzizi_refresh_token', newRefreshToken);

          const subsequentResult = await apiClient.get(subsequentApiCall);
          
          // Verify subsequent call succeeded with new token
          expect(subsequentResult.success).toBe(true);
          expect(newTokenUsed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});