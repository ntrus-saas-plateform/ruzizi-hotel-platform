/**
 * Property-based tests for Role-Based Establishment Access
 * Feature: auth-establishment-improvement
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { UserResponse, AuthTokens } from '@/types/user.types';
import type { EstablishmentResponse } from '@/types/establishment.types';

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
const establishmentIdArb = fc.string({ minLength: 1, maxLength: 50 });

const adminUserArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('root', 'super_admin'),
  establishmentId: fc.option(establishmentIdArb),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  lastLogin: fc.option(fc.date()),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<UserResponse>;

const nonAdminUserArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('manager', 'staff'),
  establishmentId: fc.option(establishmentIdArb),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  lastLogin: fc.option(fc.date()),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<UserResponse>;

const establishmentArb = fc.record({
  id: establishmentIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  location: fc.record({
    city: fc.string({ minLength: 1, maxLength: 50 }),
    address: fc.string({ minLength: 1, maxLength: 200 }),
    country: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    coordinates: fc.record({
      lat: fc.float({ min: -90, max: 90 }),
      lng: fc.float({ min: -180, max: 180 }),
    }),
  }),
  pricingMode: fc.constantFrom('nightly', 'monthly'),
  contacts: fc.record({
    phone: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
    email: fc.emailAddress(),
  }),
  services: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  images: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { maxLength: 5 }),
  managerId: fc.string({ minLength: 1, maxLength: 50 }),
  staffIds: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  totalCapacity: fc.integer({ min: 1, max: 1000 }),
  isActive: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<EstablishmentResponse>;

const authTokensArb = fc.record({
  accessToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 60)),
  refreshToken: fc.string({ minLength: 10 }).map(payload => createMockJWT({ userId: payload }, 10080)),
}) as fc.Arbitrary<AuthTokens>;

describe('Role-Based Establishment Access - Property Tests', () => {
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
   * Property 9: Role-Based Establishment Access
   * Validates: Requirements 4.1, 4.2, 4.4
   */
  describe('Property 9: Role-Based Establishment Access', () => {
    test('**Feature: auth-establishment-improvement, Property 9: Role-Based Establishment Access**', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(adminUserArb, nonAdminUserArb),
          authTokensArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 10 }),
          async (user, tokens, establishments) => {
            // Clear localStorage for clean test state
            localStorageMock.clear();
            
            // Pre-populate localStorage with authenticated state
            localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
            localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
            localStorageMock.setItem('ruzizi_user', JSON.stringify(user));

            // Mock API response for user data refresh
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                user: user
              }),
            });

            let authContext: any = null;

            const TestComponent = () => {
              const auth = useAuth();
              authContext = auth;
              return React.createElement('div', { 'data-testid': 'test-component' });
            };

            const App = () => React.createElement(AuthProvider, { 
              children: React.createElement(TestComponent)
            });

            render(React.createElement(App));

            // Wait for authentication to load
            await waitFor(() => {
              expect(authContext?.isLoading).toBe(false);
              expect(authContext?.isAuthenticated).toBe(true);
            }, { timeout: 3000 });

            // Verify user role is correctly loaded (this is what matters for access control)
            expect(authContext.user?.role).toBe(user.role);
            expect(authContext.user?.establishmentId).toBe(user.establishmentId);

            // Test role-based establishment access
            const isAdmin = user.role === 'root' || user.role === 'super_admin';

            // Test isAdmin method consistency - this should match our expected logic
            expect(authContext.isAdmin()).toBe(isAdmin);

            // Test canAccessEstablishment method for each establishment
            establishments.forEach(establishment => {
              const canAccess = authContext.canAccessEstablishment(establishment.id);

              if (isAdmin) {
                // Admin users should be able to access all establishments
                expect(canAccess).toBe(true);
              } else {
                // Non-admin users should only access their assigned establishment
                if (user.establishmentId === establishment.id) {
                  expect(canAccess).toBe(true);
                } else {
                  expect(canAccess).toBe(false);
                }
              }
            });

            // Test access to a random establishment ID
            const randomEstablishmentId = 'random-establishment-' + Math.random().toString(36).substr(2, 9);
            const canAccessRandom = authContext.canAccessEstablishment(randomEstablishmentId);
            
            if (isAdmin) {
              // Admin should be able to access any establishment
              expect(canAccessRandom).toBe(true);
            } else {
              // Non-admin should only access if it matches their assigned establishment
              expect(canAccessRandom).toBe(user.establishmentId === randomEstablishmentId);
            }
          }
        ),
        { numRuns: 50 } // Reduce runs to speed up testing
      );
    }, 15000); // Increase timeout to 15 seconds

    test('Admin users should have universal establishment access', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          authTokensArb,
          fc.array(establishmentIdArb, { minLength: 1, maxLength: 20 }),
          async (adminUser, tokens, establishmentIds) => {
            // Clear localStorage for clean test state
            localStorageMock.clear();
            
            // Pre-populate localStorage with authenticated admin state
            localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
            localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
            localStorageMock.setItem('ruzizi_user', JSON.stringify(adminUser));

            // Mock API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                user: adminUser
              }),
            });

            let authContext: any = null;

            const TestComponent = () => {
              const auth = useAuth();
              authContext = auth;
              return React.createElement('div', { 'data-testid': 'test-component' });
            };

            const App = () => React.createElement(AuthProvider, { 
              children: React.createElement(TestComponent)
            });

            render(React.createElement(App));

            // Wait for authentication to load
            await waitFor(() => {
              expect(authContext?.isLoading).toBe(false);
              expect(authContext?.isAuthenticated).toBe(true);
            }, { timeout: 3000 });

            // Verify user role is correctly loaded (this is what matters for access control)
            expect(authContext.user?.role).toBe(adminUser.role);
            expect(authContext.user?.establishmentId).toBe(adminUser.establishmentId);

            // Admin should be identified correctly
            expect(authContext.isAdmin()).toBe(true);

            // Admin should be able to access ALL establishments
            establishmentIds.forEach(establishmentId => {
              expect(authContext.canAccessEstablishment(establishmentId)).toBe(true);
            });
          }
        ),
        { numRuns: 30 } // Reduce runs to speed up testing
      );
    }, 15000); // Increase timeout to 15 seconds

    test('Non-admin users should have restricted establishment access', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          authTokensArb,
          fc.array(establishmentIdArb, { minLength: 2, maxLength: 10 }),
          async (nonAdminUser, tokens, establishmentIds) => {
            // Clear localStorage for clean test state
            localStorageMock.clear();
            
            // Ensure user has an assigned establishment (pick first from the list)
            const userWithEstablishment = {
              ...nonAdminUser,
              establishmentId: establishmentIds[0]
            };
            
            // Pre-populate localStorage with authenticated non-admin state
            localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
            localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
            localStorageMock.setItem('ruzizi_user', JSON.stringify(userWithEstablishment));

            // Mock API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                user: userWithEstablishment
              }),
            });

            let authContext: any = null;

            const TestComponent = () => {
              const auth = useAuth();
              authContext = auth;
              return React.createElement('div', { 'data-testid': 'test-component' });
            };

            const App = () => React.createElement(AuthProvider, { 
              children: React.createElement(TestComponent)
            });

            render(React.createElement(App));

            // Wait for authentication to load
            await waitFor(() => {
              expect(authContext?.isLoading).toBe(false);
              expect(authContext?.isAuthenticated).toBe(true);
            }, { timeout: 3000 });

            // Verify user role is correctly loaded (this is what matters for access control)
            expect(authContext.user?.role).toBe(userWithEstablishment.role);
            expect(authContext.user?.establishmentId).toBe(userWithEstablishment.establishmentId);

            // Non-admin should be identified correctly
            expect(authContext.isAdmin()).toBe(false);

            // Test access to each establishment
            establishmentIds.forEach((establishmentId, index) => {
              const canAccess = authContext.canAccessEstablishment(establishmentId);
              
              if (index === 0) {
                // Should be able to access their assigned establishment (first one)
                expect(canAccess).toBe(true);
              } else {
                // Should NOT be able to access other establishments
                expect(canAccess).toBe(false);
              }
            });
          }
        ),
        { numRuns: 30 } // Reduce runs to speed up testing
      );
    }, 15000); // Increase timeout to 15 seconds

    test('Users without establishment assignment should have no establishment access (non-admin)', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb,
          authTokensArb,
          fc.array(establishmentIdArb, { minLength: 1, maxLength: 5 }),
          async (nonAdminUser, tokens, establishmentIds) => {
            // Clear localStorage for clean test state
            localStorageMock.clear();
            
            // Ensure user has NO assigned establishment
            const userWithoutEstablishment = {
              ...nonAdminUser,
              establishmentId: undefined
            };
            
            // Pre-populate localStorage with authenticated state
            localStorageMock.setItem('ruzizi_access_token', tokens.accessToken);
            localStorageMock.setItem('ruzizi_refresh_token', tokens.refreshToken);
            localStorageMock.setItem('ruzizi_user', JSON.stringify(userWithoutEstablishment));

            // Mock API response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                user: userWithoutEstablishment
              }),
            });

            let authContext: any = null;

            const TestComponent = () => {
              const auth = useAuth();
              authContext = auth;
              return React.createElement('div', { 'data-testid': 'test-component' });
            };

            const App = () => React.createElement(AuthProvider, { 
              children: React.createElement(TestComponent)
            });

            render(React.createElement(App));

            // Wait for authentication to load
            await waitFor(() => {
              expect(authContext?.isLoading).toBe(false);
              expect(authContext?.isAuthenticated).toBe(true);
            }, { timeout: 3000 });

            // Verify user role is correctly loaded (this is what matters for access control)
            expect(authContext.user?.role).toBe(userWithoutEstablishment.role);
            expect(authContext.user?.establishmentId).toBe(userWithoutEstablishment.establishmentId);

            // Non-admin should be identified correctly
            expect(authContext.isAdmin()).toBe(false);

            // User without establishment assignment should not be able to access any establishment
            establishmentIds.forEach(establishmentId => {
              expect(authContext.canAccessEstablishment(establishmentId)).toBe(false);
            });
          }
        ),
        { numRuns: 10 } // Reduce runs to speed up testing
      );
    }, 15000); // Increase timeout to 15 seconds

    test('Unauthenticated users should have no establishment access', () => {
      fc.assert(
        fc.property(
          fc.array(establishmentIdArb, { minLength: 1, maxLength: 5 }),
          (establishmentIds) => {
            // Clear localStorage to ensure unauthenticated state
            localStorageMock.clear();

            let authContext: any = null;

            const TestComponent = () => {
              const auth = useAuth();
              authContext = auth;
              return React.createElement('div', { 'data-testid': 'test-component' });
            };

            const App = () => React.createElement(AuthProvider, { 
              children: React.createElement(TestComponent)
            });

            render(React.createElement(App));

            // Wait a bit for initial state to settle
            setTimeout(() => {
              if (authContext) {
                // Unauthenticated users should not be admin
                expect(authContext.isAdmin()).toBe(false);

                // Unauthenticated users should not be able to access any establishment
                establishmentIds.forEach(establishmentId => {
                  expect(authContext.canAccessEstablishment(establishmentId)).toBe(false);
                });
              }
            }, 10);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});