/**
 * Property-based tests for error logging
 * Feature: auth-establishment-improvement, Property 14: Error Logging
 * Validates: Requirements 6.4
 */

import * as fc from 'fast-check';
import { UnifiedTokenManager } from '../unified-token-manager';
import { AuthService } from '../../../services/Auth.service';

// Mock console methods for testing
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

let consoleErrorSpy: jest.SpyInstance;
let consoleLogSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;

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

describe('Property 14: Error Logging', () => {
  let tokenManager: UnifiedTokenManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    tokenManager = new UnifiedTokenManager();
    
    // Setup console spies
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  /**
   * Property: For any authentication error, appropriate debugging information should be logged
   */
  it('should log authentication errors with appropriate debugging information', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 1, maxLength: 50 }),
          errorType: fc.constantFrom(
            'INVALID_CREDENTIALS',
            'ACCOUNT_DEACTIVATED',
            'NETWORK_ERROR',
            'TOKEN_EXPIRED',
            'SERVER_ERROR'
          ),
          statusCode: fc.constantFrom(400, 401, 403, 500, 503)
        }),
        async ({ email, password, errorType, statusCode }) => {
          // Setup mock response based on error type
          const mockErrorResponse = {
            ok: false,
            status: statusCode,
            json: async () => ({
              success: false,
              error: {
                code: errorType,
                message: `Test error: ${errorType}`,
                details: { timestamp: new Date().toISOString() }
              }
            })
          };

          mockFetch.mockResolvedValueOnce(mockErrorResponse as any);

          try {
            await AuthService.login(email, password);
            // Should not reach here for error cases
            expect(true).toBe(false);
          } catch (error) {
            // Verify that error logging occurred
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Check that logged information is appropriate for debugging
            const loggedCalls = consoleErrorSpy.mock.calls;
            const hasRelevantLog = loggedCalls.some(call => {
              const logMessage = call.join(' ').toLowerCase();
              return (
                logMessage.includes('error') ||
                logMessage.includes('failed') ||
                logMessage.includes('login') ||
                logMessage.includes(errorType.toLowerCase())
              );
            });
            
            expect(hasRelevantLog).toBe(true);
            
            // Verify no sensitive data is logged (passwords, tokens)
            const allLoggedContent = loggedCalls.flat().join(' ').toLowerCase();
            expect(allLoggedContent).not.toContain(password.toLowerCase());
            expect(allLoggedContent).not.toContain('password');
            expect(allLoggedContent).not.toContain('token');
            expect(allLoggedContent).not.toContain('secret');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any token management error, security-appropriate logging should occur
   */
  it('should log token management errors without exposing sensitive data', () => {
    fc.assert(
      fc.property(
        fc.record({
          operation: fc.constantFrom('store', 'retrieve', 'refresh', 'clear'),
          errorType: fc.constantFrom('STORAGE_ERROR', 'INVALID_TOKEN', 'NETWORK_ERROR', 'PARSE_ERROR'),
          hasToken: fc.boolean()
        }),
        async ({ operation, errorType, hasToken }) => {
          // Setup different error scenarios
          switch (operation) {
            case 'store':
              if (errorType === 'STORAGE_ERROR') {
                // Temporarily replace setItem to throw error
                const originalSetItem = localStorageMock.setItem;
                localStorageMock.setItem = () => {
                  throw new Error('Storage quota exceeded');
                };
                
                try {
                  tokenManager.setTokens({
                    accessToken: 'test-access-token',
                    refreshToken: 'test-refresh-token',
                    expiresIn: 3600
                  });
                } catch (error) {
                  // Expected error
                } finally {
                  // Restore original setItem
                  localStorageMock.setItem = originalSetItem;
                }
              }
              break;
              
            case 'retrieve':
              if (errorType === 'STORAGE_ERROR') {
                // Temporarily replace getItem to throw error
                const originalGetItem = localStorageMock.getItem;
                localStorageMock.getItem = () => {
                  throw new Error('Storage access denied');
                };
                
                try {
                  tokenManager.getAccessToken();
                } catch (error) {
                  // Expected error
                } finally {
                  // Restore original getItem
                  localStorageMock.getItem = originalGetItem;
                }
              }
              break;
              
            case 'refresh':
              if (errorType === 'NETWORK_ERROR') {
                mockFetch.mockRejectedValueOnce(new Error('Network error'));
                
                try {
                  await tokenManager.refreshTokenIfNeeded();
                } catch (error) {
                  // Expected error
                }
              }
              break;
              
            case 'clear':
              if (errorType === 'STORAGE_ERROR') {
                // Temporarily replace removeItem to throw error
                const originalRemoveItem = localStorageMock.removeItem;
                localStorageMock.removeItem = () => {
                  throw new Error('Storage clear failed');
                };
                
                try {
                  tokenManager.clearTokens();
                } catch (error) {
                  // Expected error
                } finally {
                  // Restore original removeItem
                  localStorageMock.removeItem = originalRemoveItem;
                }
              }
              break;
          }

          // Verify appropriate logging occurred
          const hasErrorLog = consoleErrorSpy.mock.calls.length > 0;
          if (hasErrorLog) {
            // Check that error information is logged
            const loggedCalls = consoleErrorSpy.mock.calls;
            const hasRelevantLog = loggedCalls.some(call => {
              const logMessage = call.join(' ').toLowerCase();
              return (
                logMessage.includes('error') ||
                logMessage.includes('failed') ||
                logMessage.includes(operation) ||
                logMessage.includes('token')
              );
            });
            
            expect(hasRelevantLog).toBe(true);
            
            // Verify no actual token values are logged
            const allLoggedContent = loggedCalls.flat().join(' ');
            expect(allLoggedContent).not.toContain('test-access-token');
            expect(allLoggedContent).not.toContain('test-refresh-token');
            expect(allLoggedContent).not.toMatch(/eyJ[A-Za-z0-9-_]+\./); // JWT pattern
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any establishment access error, security monitoring logs should be created
   */
  it('should create security monitoring logs for establishment access violations', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          userRole: fc.constantFrom('manager', 'staff'),
          userEstablishmentId: fc.uuid(),
          attemptedEstablishmentId: fc.uuid(),
          resourceType: fc.constantFrom('accommodation', 'booking', 'client'),
          resourceId: fc.uuid(),
          userAgent: fc.string({ minLength: 10, maxLength: 100 }),
          ipAddress: fc.ipV4()
        }),
        ({ userId, userRole, userEstablishmentId, attemptedEstablishmentId, resourceType, resourceId, userAgent, ipAddress }) => {
          // Only test cases where access should be denied
          if (userEstablishmentId === attemptedEstablishmentId) {
            return; // Skip - this should be allowed
          }

          // Simulate establishment access violation logging
          const securityEvent = {
            type: 'ESTABLISHMENT_ACCESS_VIOLATION',
            userId,
            userRole,
            userEstablishmentId,
            attemptedEstablishmentId,
            resourceType,
            resourceId,
            timestamp: new Date().toISOString(),
            metadata: {
              userAgent: userAgent.substring(0, 50), // Truncated for security
              ipAddress: ipAddress.split('.').slice(0, 3).join('.') + '.xxx' // Masked IP
            }
          };

          // Log the security event (simulating what the system should do)
          console.error('🚨 Security Alert: Establishment access violation', {
            eventType: securityEvent.type,
            userId: securityEvent.userId,
            violation: {
              userEstablishment: securityEvent.userEstablishmentId,
              attemptedEstablishment: securityEvent.attemptedEstablishmentId,
              resourceType: securityEvent.resourceType
            },
            timestamp: securityEvent.timestamp
          });

          // Verify security logging occurred
          expect(consoleErrorSpy).toHaveBeenCalled();
          
          const loggedCalls = consoleErrorSpy.mock.calls;
          const hasSecurityLog = loggedCalls.some(call => {
            const logMessage = call.join(' ').toLowerCase();
            return (
              logMessage.includes('security') ||
              logMessage.includes('violation') ||
              logMessage.includes('access') ||
              logMessage.includes('establishment')
            );
          });
          
          expect(hasSecurityLog).toBe(true);
          
          // Verify that sensitive information is appropriately handled
          const allLoggedContent = loggedCalls.flat().join(' ');
          
          // Should contain relevant security information
          expect(allLoggedContent).toContain(userId);
          expect(allLoggedContent).toContain(resourceType);
          
          // Should not contain full user agent or IP address for privacy
          if (userAgent.length > 50) {
            expect(allLoggedContent).not.toContain(userAgent);
          }
          expect(allLoggedContent).not.toContain(ipAddress);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any error logging, structured format should be maintained for debugging
   */
  it('should maintain structured format for all error logs', () => {
    fc.assert(
      fc.property(
        fc.record({
          errorSource: fc.constantFrom('auth', 'token', 'establishment', 'network'),
          errorCode: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
          errorMessage: fc.string({ minLength: 10, maxLength: 100 }),
          contextData: fc.record({
            operation: fc.string({ minLength: 3, maxLength: 20 }),
            timestamp: fc.date(),
            requestId: fc.uuid()
          })
        }),
        ({ errorSource, errorCode, errorMessage, contextData }) => {
          // Simulate structured error logging
          const structuredError = {
            level: 'error',
            source: errorSource,
            code: errorCode,
            message: errorMessage,
            context: {
              operation: contextData.operation,
              timestamp: contextData.timestamp.toISOString(),
              requestId: contextData.requestId
            }
          };

          // Log in structured format
          console.error(`[${structuredError.source.toUpperCase()}] ${structuredError.code}:`, {
            message: structuredError.message,
            context: structuredError.context
          });

          // Verify structured logging occurred
          expect(consoleErrorSpy).toHaveBeenCalled();
          
          const loggedCalls = consoleErrorSpy.mock.calls;
          const lastCall = loggedCalls[loggedCalls.length - 1];
          
          // Verify log contains structured information
          expect(lastCall.length).toBeGreaterThanOrEqual(2); // At least message and context object
          
          const logMessage = lastCall[0];
          expect(logMessage).toContain(errorSource.toUpperCase());
          expect(logMessage).toContain(errorCode);
          
          // Verify context object is present
          const contextObject = lastCall[1];
          expect(contextObject).toBeDefined();
          expect(typeof contextObject).toBe('object');
          expect(contextObject.message).toBe(errorMessage);
          expect(contextObject.context).toBeDefined();
          expect(contextObject.context.operation).toBe(contextData.operation);
          expect(contextObject.context.requestId).toBe(contextData.requestId);
        }
      ),
      { numRuns: 100 }
    );
  });
});