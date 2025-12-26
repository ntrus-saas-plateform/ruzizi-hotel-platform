/**
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EstablishmentSelector from '../EstablishmentSelector';
import { unifiedTokenManager } from '@/lib/auth/unified-token-manager';

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
const establishmentIdArb = fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0);

const adminUserArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  userId: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  role: fc.constantFrom('root', 'super_admin'),
  establishmentId: fc.option(establishmentIdArb, { nil: undefined }),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const establishmentArb = fc.record({
  id: establishmentIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  location: fc.record({
    city: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    country: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  }),
});

describe('EstablishmentSelector - Admin Access Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Default token manager mocks
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('mock-access-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
  });

  /**
   * Property 4: Admin Establishment Access
   * Validates: Requirements 2.3
   */
  describe('Property 4: Admin Establishment Access', () => {
    test('**Feature: auth-establishment-improvement, Property 4: Admin Establishment Access**', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 3 }),
          async (adminUser, establishments) => {
            // Mock successful API response with all establishments
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
              user: adminUser,
              isLoading: false,
            });

            const mockOnChange = jest.fn();

            const { unmount } = render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            try {
              // Wait for component to load and establishments to be fetched
              await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
              }, { timeout: 2000 });

              // Property: Admin users should see all available establishments
              for (const establishment of establishments) {
                await waitFor(() => {
                  // Use a more flexible text matcher to handle potential whitespace issues
                  const establishmentText = `${establishment.name.trim()} - ${establishment.location.city.trim()}`;
                  const establishmentOption = screen.getByText(establishmentText);
                  expect(establishmentOption).toBeInTheDocument();
                }, { timeout: 500 });
              }

              // Property: Admin users should not have automatic selection (onChange not called)
              expect(mockOnChange).not.toHaveBeenCalled();

              // Property: The select element should not be disabled for admin users
              const selectElements = screen.getAllByRole('combobox');
              expect(selectElements.length).toBeGreaterThan(0);
              const selectElement = selectElements[0];
              expect(selectElement).not.toBeDisabled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    test('Admin users should not have automatic selection even with establishmentId', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 2 }),
          async (adminUser, establishments) => {
            // Ensure admin user has an establishmentId
            const userWithEstablishment = {
              ...adminUser,
              establishmentId: establishments[0].id
            };

            // Mock successful API response with all establishments
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

            // Mock auth context with admin user who has establishmentId
            mockUseAuth.mockReturnValue({
              user: userWithEstablishment,
              isLoading: false,
            });

            const mockOnChange = jest.fn();

            const { unmount } = render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            try {
              // Wait for component to load
              await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
              }, { timeout: 2000 });

              // Property: Admin users should see ALL establishments, not just their assigned one
              for (const establishment of establishments) {
                await waitFor(() => {
                  // Use a more flexible text matcher to handle potential whitespace issues
                  const establishmentText = `${establishment.name.trim()} - ${establishment.location.city.trim()}`;
                  const establishmentOption = screen.getByText(establishmentText);
                  expect(establishmentOption).toBeInTheDocument();
                }, { timeout: 500 });
              }

              // Property: Admin users should not have automatic selection even if they have establishmentId
              expect(mockOnChange).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    }, 20000);

    test('Admin users should have manual selection capability', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 2 }),
          async (adminUser, establishments) => {
            // Mock successful API response
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

            mockUseAuth.mockReturnValue({
              user: adminUser,
              isLoading: false,
            });

            const mockOnChange = jest.fn();

            const { unmount } = render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            try {
              // Wait for component to load
              await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
              }, { timeout: 2000 });

              // Wait for loading to complete by checking that the select is not showing "Chargement..."
              await waitFor(() => {
                const selectElement = screen.getByRole('combobox');
                const loadingOption = screen.queryByText('Chargement...');
                expect(loadingOption).not.toBeInTheDocument();
              }, { timeout: 1000 });

              // Property: Admin users should have an enabled select element for manual selection
              const selectElements = screen.getAllByRole('combobox');
              expect(selectElements.length).toBeGreaterThan(0);
              const selectElement = selectElements[0]; // Use the first one
              expect(selectElement).toBeInTheDocument();
              
              // Only check if not disabled when there are establishments available and loading is complete
              if (establishments.length > 0) {
                expect(selectElement).not.toBeDisabled();
              }

              // Property: Admin users should see a default "Sélectionner un établissement" option
              await waitFor(() => {
                expect(screen.getByText('Sélectionner un établissement')).toBeInTheDocument();
              }, { timeout: 500 });

              // Property: No automatic selection should occur
              expect(mockOnChange).not.toHaveBeenCalled();
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 15000);
  });
});