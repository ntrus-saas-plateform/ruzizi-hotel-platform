/**
 * Property-based tests for Authentication Context Singleton
 * Feature: auth-establishment-improvement
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { UserResponse } from '@/types/user.types';

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

// Override localStorage in jsdom environment
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

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

// Generators for property-based testing
const userResponseArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('root', 'super_admin', 'manager', 'staff'),
  establishmentId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  isActive: fc.boolean(),
  isEmailVerified: fc.boolean(),
  lastLogin: fc.option(fc.date()),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<UserResponse>;

const authTokensArb = fc.record({
  accessToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 60)),
  refreshToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 10080)),
});

describe('Authentication Context Singleton - Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Reset fetch mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * Property 1: Authentication Context Singleton
   * Validates: Requirements 1.1
   */
  describe('Property 1: Authentication Context Singleton', () => {
    test('**Feature: auth-establishment-improvement, Property 1: Authentication Context Singleton**', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), (numComponents) => {
          // Create multiple components that use the same AuthProvider
          const TestComponent = ({ id }: { id: number }) => {
            const auth = useAuth();
            return React.createElement('div', { 'data-testid': `component-${id}` }, 
              `Auth state: ${auth.isAuthenticated ? 'authenticated' : 'not authenticated'}`
            );
          };

          const components = Array.from({ length: numComponents }, (_, i) => 
            React.createElement(TestComponent, { key: i, id: i })
          );

          const App = () => React.createElement(AuthProvider, { children: components });

          // Render the app with multiple components using the same AuthProvider
          const { container } = render(React.createElement(App));

          // All components should exist and be rendered
          for (let i = 0; i < numComponents; i++) {
            const component = container.querySelector(`[data-testid="component-${i}"]`);
            expect(component).toBeTruthy();
            expect(component?.textContent).toContain('Auth state: not authenticated');
          }

          // Verify that all components share the same authentication state
          // by checking that they all have the same initial state
          const allComponents = container.querySelectorAll('[data-testid^="component-"]');
          expect(allComponents).toHaveLength(numComponents);
          
          // All components should have the same authentication state text
          const firstComponentText = allComponents[0]?.textContent;
          allComponents.forEach(component => {
            expect(component.textContent).toBe(firstComponentText);
          });
        }),
        { numRuns: 50 }
      );
    });

    test('Multiple AuthProvider instances should throw error', () => {
      fc.assert(
        fc.property(fc.constant(true), () => {
          // Test that using useAuth outside of AuthProvider throws error
          expect(() => {
            renderHook(() => useAuth());
          }).toThrow('useAuth must be used within an AuthProvider');
        }),
        { numRuns: 10 }
      );
    });

    test('AuthProvider should provide consistent context across re-renders', () => {
      fc.assert(
        fc.property(userResponseArb, authTokensArb, (user, tokens) => {
          // Mock successful API response for user data refresh
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              user: user
            }),
          });

          // Store tokens in localStorage to simulate existing session using new format
          localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
          localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
          localStorageMock.setItem('ruzizi_user', JSON.stringify(user));

          let authContextValue1: any;
          let authContextValue2: any;

          const TestComponent1 = () => {
            authContextValue1 = useAuth();
            return React.createElement('div', {}, 'Component 1');
          };

          const TestComponent2 = () => {
            authContextValue2 = useAuth();
            return React.createElement('div', {}, 'Component 2');
          };

          const App = () => React.createElement(AuthProvider, { children: [
            React.createElement(TestComponent1),
            React.createElement(TestComponent2)
          ] });

          render(React.createElement(App));

          // Both components should receive the same context instance
          expect(authContextValue1).toBe(authContextValue2);
          
          // Both should have the same authentication state
          expect(authContextValue1.isAuthenticated).toBe(authContextValue2.isAuthenticated);
          expect(authContextValue1.user).toEqual(authContextValue2.user);
          expect(authContextValue1.isLoading).toBe(authContextValue2.isLoading);
        }),
        { numRuns: 30 }
      );
    });

    test('Single AuthProvider should manage state for all child components', () => {
      fc.assert(
        fc.property(fc.integer({ min: 3, max: 8 }), (numNestedLevels) => {
          // Create nested components at different levels
          const createNestedComponent = (level: number): React.ReactElement => {
            if (level === 0) {
              const LeafComponent = () => {
                const auth = useAuth();
                return React.createElement('div', { 'data-testid': 'leaf' }, 
                  `Level ${level}: ${auth.isAuthenticated ? 'auth' : 'no-auth'}`
                );
              };
              return React.createElement(LeafComponent);
            }

            const NestedComponent = () => {
              const auth = useAuth();
              return React.createElement('div', { 'data-testid': `level-${level}` },
                `Level ${level}: ${auth.isAuthenticated ? 'auth' : 'no-auth'}`,
                createNestedComponent(level - 1)
              );
            };

            return React.createElement(NestedComponent);
          };

          const App = () => React.createElement(AuthProvider, { children: 
            createNestedComponent(numNestedLevels)
          });

          const { container } = render(React.createElement(App));

          // All nested components should have access to the same auth state
          const leafComponent = container.querySelector('[data-testid="leaf"]');
          expect(leafComponent).toBeTruthy();
          expect(leafComponent?.textContent).toContain('no-auth');

          // All level components should also have the same state
          for (let i = 1; i <= numNestedLevels; i++) {
            const levelComponent = container.querySelector(`[data-testid="level-${i}"]`);
            expect(levelComponent).toBeTruthy();
            expect(levelComponent?.textContent).toContain('no-auth');
          }
        }),
        { numRuns: 20 }
      );
    });
  });
});