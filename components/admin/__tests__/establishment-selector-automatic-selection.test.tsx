/**
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EstablishmentSelector from '../EstablishmentSelector';
import { unifiedTokenManager } from '@/lib/auth/unified-token-manager';
import type { UserResponse } from '@/types/user.types';

// Mock the AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the UnifiedTokenManager
jest.mock('@/lib/auth/unified-token-manager', () => ({
  unifiedTokenManager: {
    getAccessToken: jest.fn(),
    isTokenValid: jest.fn(),
    isTokenExpired: jest.fn(),
    refreshTokenIfNeeded: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Generators for property-based testing
const establishmentIdArb = fc.string({ minLength: 1, maxLength: 24 });

const nonAdminUserArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }),
  userId: fc.string({ minLength: 1, maxLength: 24 }),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('manager', 'staff'),
  establishmentId: fc.option(establishmentIdArb, { nil: undefined }),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const adminUserArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }),
  userId: fc.string({ minLength: 1, maxLength: 24 }),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.constantFrom('root', 'super_admin'),
  establishmentId: fc.option(establishmentIdArb, { nil: undefined }),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const establishmentArb = fc.record({
  id: establishmentIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  location: fc.record({
    city: fc.string({ minLength: 1, maxLength: 50 }),
    country: fc.string({ minLength: 1, maxLength: 50 }),
  }),
});

describe('EstablishmentSelector - Automatic Selection Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Default token manager mocks
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('mock-access-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
  });

  /**
   * Property 3: Automatic Establishment Selection
   * Validates: Requirements 2.1, 2.2
   */
  describe('Property 3: Automatic Establishment Selection', () => {
    test('**Feature: auth-establishment-improvement, Property 3: Automatic Establishment Selection**', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb.filter(user => user.establishmentId !== undefined),
          establishmentArb,
          async (user, establishment) => {
            // Ensure user has the establishment ID that matches our test establishment
            const userWithEstablishment = {
              ...user,
              establishmentId: establishment.id
            };

            // Mock successful API response with the establishment
            const mockResponse = {
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  data: [establishment]
                }
              })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Mock auth context with non-admin user who has establishmentId
            mockUseAuth.mockReturnValue({
              user: userWithEstablishment,
              isLoading: false,
            });

            // Track onChange calls
            const onChangeCalls: string[] = [];
            const mockOnChange = jest.fn((establishmentId: string) => {
              onChangeCalls.push(establishmentId);
            });

            // Render component
            render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            // Wait for automatic selection to occur
            await waitFor(() => {
              expect(mockOnChange).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Property: Non-admin users with establishmentId should have their establishment automatically selected
            expect(onChangeCalls).toContain(userWithEstablishment.establishmentId);
            
            // Property: The onChange should be called with the user's establishmentId
            expect(mockOnChange).toHaveBeenCalledWith(userWithEstablishment.establishmentId);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Non-admin users without establishmentId should not trigger automatic selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb.filter(user => user.establishmentId === undefined),
          fc.array(establishmentArb, { minLength: 1, maxLength: 5 }),
          async (user, establishments) => {
            // Mock successful API response with establishments
            const mockResponse = {
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  data: establishments
                }
              })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Mock auth context with non-admin user who has no establishmentId
            mockUseAuth.mockReturnValue({
              user: user,
              isLoading: false,
            });

            // Track onChange calls
            const mockOnChange = jest.fn();

            // Render component
            render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            // Wait for component to load
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Property: Non-admin users without establishmentId should not trigger automatic selection
            expect(mockOnChange).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Admin users should not trigger automatic selection regardless of establishmentId', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 5 }),
          async (user, establishments) => {
            // Mock successful API response with establishments
            const mockResponse = {
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  data: establishments
                }
              })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Mock auth context with admin user
            mockUseAuth.mockReturnValue({
              user: user,
              isLoading: false,
            });

            // Track onChange calls
            const mockOnChange = jest.fn();

            // Render component
            render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            // Wait for component to load
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Property: Admin users should not trigger automatic selection
            expect(mockOnChange).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Automatic selection should only occur when value is empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonAdminUserArb.filter(user => user.establishmentId !== undefined),
          establishmentArb,
          establishmentIdArb,
          async (user, establishment, preSelectedValue) => {
            // Ensure user has the establishment ID that matches our test establishment
            const userWithEstablishment = {
              ...user,
              establishmentId: establishment.id
            };

            // Ensure preSelectedValue is different from user's establishmentId
            fc.pre(preSelectedValue !== userWithEstablishment.establishmentId);

            // Mock successful API response with the establishment
            const mockResponse = {
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  data: [establishment]
                }
              })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Mock auth context with non-admin user who has establishmentId
            mockUseAuth.mockReturnValue({
              user: userWithEstablishment,
              isLoading: false,
            });

            // Track onChange calls
            const mockOnChange = jest.fn();

            // Render component with pre-selected value
            render(
              <EstablishmentSelector 
                value={preSelectedValue} 
                onChange={mockOnChange}
              />
            );

            // Wait for component to load
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Property: Automatic selection should not occur when value is already set
            expect(mockOnChange).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});