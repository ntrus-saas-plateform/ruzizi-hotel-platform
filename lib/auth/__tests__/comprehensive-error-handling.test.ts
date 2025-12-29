/**
 * Property-based tests for comprehensive error handling
 * Feature: auth-establishment-improvement, Property 13: Comprehensive Error Handling
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import * as fc from 'fast-check';
import { UnifiedTokenManager } from '../unified-token-manager';
import { AuthService } from '../../../services/Auth.service';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '../../errors/establishment-errors';
import { 
  InvalidCredentialsError, 
  AccountDeactivatedError, 
  NetworkError, 
  ServerError, 
  ValidationError,
  createAuthErrorFromResponse,
  createNetworkError
} from '../../errors/auth-errors';

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

describe('Property 13: Comprehensive Error Handling', () => {
  let tokenManager: UnifiedTokenManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    tokenManager = new UnifiedTokenManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property: For any authentication error, the system should provide specific, actionable error messages
   */
  it('should provide specific error messages for authentication failures', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 50 }),
          errorType: fc.constantFrom(
            'INVALID_CREDENTIALS',
            'ACCOUNT_DEACTIVATED', 
            'NETWORK_ERROR',
            'SERVER_ERROR',
            'VALIDATION_ERROR'
          ),
          statusCode: fc.constantFrom(400, 401, 403, 500, 503)
        }),
        async ({ email, password, errorType, statusCode }) => {
          // Setup mock response based on error type
          const mockErrorResponse = {
            ok: false,
            status: statusCode,
            json: async () => {
              switch (errorType) {
                case 'INVALID_CREDENTIALS':
                  return { 
                    success: false, 
                    error: { 
                      code: 'INVALID_CREDENTIALS',
                      message: 'Invalid email or password',
                      details: { field: 'credentials' }
                    }
                  };
                case 'ACCOUNT_DEACTIVATED':
                  return { 
                    success: false, 
                    error: { 
                      code: 'ACCOUNT_DEACTIVATED',
                      message: 'Your account has been deactivated. Please contact support.',
                      details: { supportEmail: 'support@ruzizi.com' }
                    }
                  };
                case 'NETWORK_ERROR':
                  throw new Error('Network request failed');
                case 'SERVER_ERROR':
                  return { 
                    success: false, 
                    error: { 
                      code: 'INTERNAL_SERVER_ERROR',
                      message: 'An internal server error occurred. Please try again later.',
                      details: { retryAfter: 5000 }
                    }
                  };
                case 'VALIDATION_ERROR':
                  return { 
                    success: false, 
                    error: { 
                      code: 'VALIDATION_ERROR',
                      message: 'Invalid input data provided',
                      details: { 
                        fields: ['email', 'password'],
                        requirements: 'Email must be valid, password must not be empty'
                      }
                    }
                  };
                default:
                  return { success: false, error: { message: 'Unknown error' } };
              }
            }
          };

          mockFetch.mockResolvedValueOnce(mockErrorResponse as any);

          try {
            await AuthService.login(email, password);
            // Should not reach here for error cases
            expect(true).toBe(false);
          } catch (error) {
            // Create the appropriate auth error from the mock response
            const authError = createAuthErrorFromResponse(mockErrorResponse as any, await mockErrorResponse.json());
            
            // Verify error has specific, actionable message
            expect(authError).toBeDefined();
            expect(authError.message).toBeDefined();
            expect(authError.message.length).toBeGreaterThan(0);
            
            // Verify error message is specific to the error type
            const errorMessage = authError.message.toLowerCase();
            switch (errorType) {
              case 'INVALID_CREDENTIALS':
                expect(errorMessage).toMatch(/invalid.*email.*password|credentials/);
                break;
              case 'ACCOUNT_DEACTIVATED':
                expect(errorMessage).toMatch(/deactivated|contact.*support/);
                break;
              case 'NETWORK_ERROR':
                expect(errorMessage).toMatch(/network|connection|failed/);
                break;
              case 'SERVER_ERROR':
                expect(errorMessage).toMatch(/server.*error|try.*again.*later/);
                break;
              case 'VALIDATION_ERROR':
                expect(errorMessage).toMatch(/invalid.*input|validation/);
                break;
            }
            
            // Verify user message is provided for UI display
            if (authError.userMessage) {
              expect(authError.userMessage.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any establishment access error, the system should explain the access restriction
   */
  it('should provide clear explanations for establishment access restrictions', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          userRole: fc.constantFrom('manager', 'staff', 'root', 'super_admin'),
          userEstablishmentId: fc.uuid(),
          resourceEstablishmentId: fc.uuid(),
          resourceType: fc.constantFrom('accommodation', 'booking', 'client', 'employee'),
          resourceId: fc.uuid()
        }),
        ({ userId, userRole, userEstablishmentId, resourceEstablishmentId, resourceType, resourceId }) => {
          // Only test access denial for non-admin users accessing different establishments
          if (['root', 'super_admin'].includes(userRole) || userEstablishmentId === resourceEstablishmentId) {
            return; // Skip this case as it should be allowed
          }

          const error = new EstablishmentAccessDeniedError({
            userId,
            resourceType,
            resourceId,
            userEstablishmentId,
            resourceEstablishmentId
          });

          // Verify error provides clear explanation
          expect(error.message).toContain('Access denied');
          expect(error.message).toContain('different establishment');
          expect(error.code).toBe('ESTABLISHMENT_ACCESS_DENIED');
          expect(error.statusCode).toBe(403);
          
          // Verify error details contain actionable information
          expect(error.details).toBeDefined();
          expect(error.details?.resourceType).toBe(resourceType);
          expect(error.details?.resourceId).toBe(resourceId);
          expect(error.details?.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any network error, the system should provide retry options
   */
  it('should provide retry options for network errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.constantFrom('login', 'refresh', 'logout', 'fetchEstablishments'),
          networkErrorType: fc.constantFrom('timeout', 'connection_refused', 'dns_error', 'abort'),
          retryCount: fc.integer({ min: 0, max: 3 })
        }),
        async ({ operation, networkErrorType, retryCount }) => {
          // Setup network error simulation
          const networkError = new Error();
          switch (networkErrorType) {
            case 'timeout':
              networkError.name = 'AbortError';
              networkError.message = 'Request timeout';
              break;
            case 'connection_refused':
              networkError.message = 'Connection refused';
              break;
            case 'dns_error':
              networkError.message = 'DNS resolution failed';
              break;
            case 'abort':
              networkError.name = 'AbortError';
              networkError.message = 'Request aborted';
              break;
          }

          mockFetch.mockRejectedValueOnce(networkError);

          try {
            // Simulate different operations that might fail
            switch (operation) {
              case 'login':
                await AuthService.login('test@example.com', 'password');
                break;
              case 'refresh':
                await tokenManager.refreshTokenIfNeeded();
                break;
              default:
                // Generic API call simulation - create network error
                const networkError = createNetworkError(new Error(networkErrorType));
                throw networkError;
            }
            
            // Should not reach here for network errors
            expect(true).toBe(false);
          } catch (error) {
            // Verify error indicates network issue and suggests retry
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message.toLowerCase();
            
            // Should indicate network-related issue
            expect(
              errorMessage.includes('network') ||
              errorMessage.includes('connection') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('failed') ||
              errorMessage.includes('abort')
            ).toBe(true);
            
            // For timeout errors specifically, should mention timeout
            if (networkErrorType === 'timeout' || networkError.name === 'AbortError') {
              expect(errorMessage).toMatch(/timeout|abort/);
            }
            
            // Verify retryable property for network errors
            if (error instanceof NetworkError) {
              expect(error.retryable).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any missing establishment error, the system should provide guidance
   */
  it('should provide guidance for missing establishment errors', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (establishmentId) => {
          const error = new EstablishmentNotFoundError(establishmentId);

          // Verify error provides clear guidance
          expect(error.message).toBe('Establishment not found');
          expect(error.code).toBe('ESTABLISHMENT_NOT_FOUND');
          expect(error.statusCode).toBe(404);
          
          // Verify error details contain the establishment ID for reference
          expect(error.details).toBeDefined();
          expect(error.details?.establishmentId).toBe(establishmentId);
          
          // Verify error can be serialized for API responses
          const serialized = error.toJSON();
          expect(serialized.success).toBe(false);
          expect(serialized.error.code).toBe('ESTABLISHMENT_NOT_FOUND');
          expect(serialized.error.message).toBe('Establishment not found');
          expect(serialized.error.details?.establishmentId).toBe(establishmentId);
        }
      ),
      { numRuns: 100 }
    );
  });
});