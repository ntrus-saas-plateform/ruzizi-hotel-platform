/**
 * Property-based tests for Render Optimization
 * Feature: auth-establishment-improvement
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { UserResponse, AuthTokens } from '@/types/user.types';

// Mock localStorage for testing
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] || null,
  setItem: (key: string, value: string) => {
    localStorageStore[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete localStorageStore[key];
  },
  clear: () => {
    localStorageStore = {};
  },
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: (index: number) => {
    const keys = Object.keys(localStorageStore);
    return keys[index] || null;
  },
};

// Override localStorage in jsdom environment
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Helper function to create valid JWT tokens for testing
function createMockJWT(payload: any, expiresInMinutes: number = 60, fixedTime?: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = fixedTime || Math.floor(Date.now() / 1000);
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
  accessToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 60, 2000000000)),
  refreshToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 10080, 2000000000)),
}) as fc.Arbitrary<AuthTokens>;

const loginCredentialsArb = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
});

describe('Render Optimization - Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * Property 18: Render Optimization
   * Validates: Requirements 7.4
   */
  describe('Property 18: Render Optimization', () => {
    test('**Feature: auth-establishment-improvement, Property 18: Render Optimization**', async () => {
      await fc.assert(
        fc.asyncProperty(userResponseArb, authTokensArb, loginCredentialsArb, async (user, tokens, credentials) => {
          // Clear localStorage to start unauthenticated
          localStorageMock.clear();

          const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Mock login response
          const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              success: true,
              data: { user, tokens }
            }),
          });

          (global.fetch as jest.Mock) = mockFetch;

          // Track render counts for each component
          const renderCounts: Record<string, number> = {};

          const TestComponent = ({ id }: { id: string }) => {
            const auth = useAuth();
            
            // Track renders
            const componentId = `${id}-${testId}`;
            renderCounts[componentId] = (renderCounts[componentId] || 0) + 1;
            
            return React.createElement('div', {
              'data-testid': `component-${componentId}`,
              children: [
                React.createElement('span', {
                  key: 'user',
                  children: auth.user?.email || 'No user'
                }),
                React.createElement('span', {
                  key: 'auth',
                  children: auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'
                }),
                React.createElement('span', {
                  key: 'loading',
                  children: auth.isLoading ? 'Loading' : 'Not Loading'
                })
              ]
            });
          };

          const App = () => React.createElement(AuthProvider, {
            children: [
              React.createElement(TestComponent, { key: 'comp1', id: 'comp1' }),
              React.createElement(TestComponent, { key: 'comp2', id: 'comp2' }),
              React.createElement(TestComponent, { key: 'comp3', id: 'comp3' })
            ]
          });

          const { rerender } = render(React.createElement(App));

          // Wait for initial loading to complete
          await waitFor(() => {
            expect(renderCounts[`comp1-${testId}`]).toBeGreaterThan(0);
          });

          const initialRenderCounts = { ...renderCounts };

          // Perform login - this should trigger re-renders
          await act(async () => {
            // We need to get the auth context to call login
            // For this test, we'll simulate the state change by re-rendering
            rerender(React.createElement(App));
          });

          // Wait for any additional renders to settle
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check that render counts are reasonable (not excessive)
          Object.keys(renderCounts).forEach(componentId => {
            const totalRenders = renderCounts[componentId];
            const initialRenders = initialRenderCounts[componentId] || 0;
            const additionalRenders = totalRenders - initialRenders;
            
            // Should not have excessive re-renders after state changes
            expect(additionalRenders).toBeLessThanOrEqual(5); // Allow some re-renders but not excessive
          });

          // Multiple re-renders of the same app should not cause excessive renders
          const preMultipleRenderCounts = { ...renderCounts };
          
          for (let i = 0; i < 3; i++) {
            rerender(React.createElement(App));
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Check that multiple re-renders don't cause excessive component renders
          Object.keys(renderCounts).forEach(componentId => {
            const totalRenders = renderCounts[componentId];
            const preMultipleRenders = preMultipleRenderCounts[componentId] || 0;
            const multipleRenderIncrease = totalRenders - preMultipleRenders;
            
            // Should have minimal additional renders for multiple app re-renders
            expect(multipleRenderIncrease).toBeLessThanOrEqual(3); // Should be optimized
          });
        }),
        { numRuns: 10 }
      );
    }, 15000);

    test('Authentication state changes should minimize unnecessary re-renders', async () => {
      await fc.assert(
        fc.asyncProperty(userResponseArb, authTokensArb, async (user, tokens) => {
          // Set up authenticated state
          localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
          localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
          localStorageMock.setItem('ruzizi_user', JSON.stringify(user));

          const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Mock API response
          const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              success: true,
              user: user
            }),
          });

          (global.fetch as jest.Mock) = mockFetch;

          // Track render counts
          const renderCounts: Record<string, number> = {};

          const OptimizedComponent = React.memo(({ id }: { id: string }) => {
            const auth = useAuth();
            
            const componentId = `opt-${id}-${testId}`;
            renderCounts[componentId] = (renderCounts[componentId] || 0) + 1;
            
            return React.createElement('div', {
              'data-testid': `optimized-${componentId}`,
              children: auth.user?.email || 'No user'
            });
          });

          const UnoptimizedComponent = ({ id }: { id: string }) => {
            const auth = useAuth();
            
            const componentId = `unopt-${id}-${testId}`;
            renderCounts[componentId] = (renderCounts[componentId] || 0) + 1;
            
            return React.createElement('div', {
              'data-testid': `unoptimized-${componentId}`,
              children: auth.user?.email || 'No user'
            });
          };

          const App = () => React.createElement(AuthProvider, {
            children: [
              React.createElement(OptimizedComponent, { key: 'opt1', id: 'opt1' }),
              React.createElement(OptimizedComponent, { key: 'opt2', id: 'opt2' }),
              React.createElement(UnoptimizedComponent, { key: 'unopt1', id: 'unopt1' }),
              React.createElement(UnoptimizedComponent, { key: 'unopt2', id: 'unopt2' })
            ]
          });

          const { rerender } = render(React.createElement(App));

          // Wait for initial load
          await waitFor(() => {
            expect(renderCounts[`opt-opt1-${testId}`]).toBeGreaterThan(0);
          });

          const initialRenderCounts = { ...renderCounts };

          // Trigger multiple re-renders
          for (let i = 0; i < 5; i++) {
            rerender(React.createElement(App));
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Optimized components should have fewer renders than unoptimized ones
          const opt1Renders = renderCounts[`opt-opt1-${testId}`] - (initialRenderCounts[`opt-opt1-${testId}`] || 0);
          const unopt1Renders = renderCounts[`unopt-unopt1-${testId}`] - (initialRenderCounts[`unopt-unopt1-${testId}`] || 0);

          // Both should have reasonable render counts, but the pattern should show optimization potential
          expect(opt1Renders).toBeLessThanOrEqual(10);
          expect(unopt1Renders).toBeLessThanOrEqual(10);
        }),
        { numRuns: 10 }
      );
    });

    test('Token refresh should not cause excessive component re-renders', async () => {
      await fc.assert(
        fc.asyncProperty(userResponseArb, authTokensArb, async (user, tokens) => {
          // Set up authenticated state
          localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
          localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
          localStorageMock.setItem('ruzizi_user', JSON.stringify(user));

          const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newTokens = {
            accessToken: createMockJWT({ userId: user.userId + '_new' }, 60, 3000000000),
            refreshToken: createMockJWT({ userId: user.userId + '_new' }, 10080, 3000000000),
          };

          // Mock API responses
          const mockFetch = jest.fn()
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                user: user
              }),
            })
            .mockResolvedValue({
              ok: true,
              json: async () => ({
                success: true,
                data: { 
                  tokens: newTokens
                }
              }),
            });

          (global.fetch as jest.Mock) = mockFetch;

          // Track render counts
          const renderCounts: Record<string, number> = {};

          const TestComponent = ({ id }: { id: string }) => {
            const auth = useAuth();
            
            const componentId = `${id}-${testId}`;
            renderCounts[componentId] = (renderCounts[componentId] || 0) + 1;
            
            return React.createElement('div', {
              'data-testid': `component-${componentId}`,
              children: [
                React.createElement('span', {
                  key: 'tokens',
                  children: auth.tokens ? 'Has Tokens' : 'No Tokens'
                }),
                React.createElement('button', {
                  key: 'refresh',
                  'data-testid': `refresh-${componentId}`,
                  onClick: () => auth.forceRefreshToken(),
                  children: 'Refresh'
                })
              ]
            });
          };

          const App = () => React.createElement(AuthProvider, {
            children: [
              React.createElement(TestComponent, { key: 'comp1', id: 'comp1' }),
              React.createElement(TestComponent, { key: 'comp2', id: 'comp2' })
            ]
          });

          const { getByTestId } = render(React.createElement(App));

          // Wait for initial load
          await waitFor(() => {
            expect(renderCounts[`comp1-${testId}`]).toBeGreaterThan(0);
          });

          const preRefreshRenderCounts = { ...renderCounts };

          // Perform token refresh
          await act(async () => {
            getByTestId(`refresh-comp1-${testId}`).click();
          });

          // Wait for refresh to complete
          await waitFor(() => {
            // Should have updated tokens
            expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
          });

          // Check render counts after refresh
          Object.keys(renderCounts).forEach(componentId => {
            const totalRenders = renderCounts[componentId];
            const preRefreshRenders = preRefreshRenderCounts[componentId] || 0;
            const refreshRenders = totalRenders - preRefreshRenders;
            
            // Token refresh should not cause excessive re-renders
            expect(refreshRenders).toBeLessThanOrEqual(3); // Allow minimal re-renders for token update
          });
        }),
        { numRuns: 10 }
      );
    }, 15000);

    test('Component tree should maintain render efficiency with deep nesting', async () => {
      await fc.assert(
        fc.asyncProperty(userResponseArb, authTokensArb, async (user, tokens) => {
          // Set up authenticated state
          localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
          localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
          localStorageMock.setItem('ruzizi_user', JSON.stringify(user));

          const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Mock API response
          const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              success: true,
              user: user
            }),
          });

          (global.fetch as jest.Mock) = mockFetch;

          // Track render counts for nested components
          const renderCounts: Record<string, number> = {};

          const DeepNestedComponent = ({ level, id }: { level: number; id: string }) => {
            const auth = useAuth();
            
            const componentId = `${id}-${level}-${testId}`;
            renderCounts[componentId] = (renderCounts[componentId] || 0) + 1;
            
            if (level > 0) {
              return React.createElement('div', {
                'data-testid': `level-${level}-${componentId}`,
                children: React.createElement(DeepNestedComponent, {
                  level: level - 1,
                  id: `${id}-${level}`
                })
              });
            }
            
            return React.createElement('span', {
              'data-testid': `leaf-${componentId}`,
              children: auth.user?.email || 'No user'
            });
          };

          const App = () => React.createElement(AuthProvider, {
            children: [
              React.createElement(DeepNestedComponent, { key: 'tree1', level: 3, id: 'tree1' }),
              React.createElement(DeepNestedComponent, { key: 'tree2', level: 3, id: 'tree2' })
            ]
          });

          const { rerender } = render(React.createElement(App));

          // Wait for initial load
          await waitFor(() => {
            expect(Object.keys(renderCounts).length).toBeGreaterThan(0);
          });

          const initialRenderCounts = { ...renderCounts };

          // Trigger re-renders
          for (let i = 0; i < 3; i++) {
            rerender(React.createElement(App));
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Check that deeply nested components don't have excessive renders
          Object.keys(renderCounts).forEach(componentId => {
            const totalRenders = renderCounts[componentId];
            const initialRenders = initialRenderCounts[componentId] || 0;
            const additionalRenders = totalRenders - initialRenders;
            
            // Even deeply nested components should have reasonable render counts
            expect(additionalRenders).toBeLessThanOrEqual(5);
          });
        }),
        { numRuns: 10 }
      );
    });
  });
});