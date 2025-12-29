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

const nonAdminUserWithEstablishmentArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  userId: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  role: fc.constantFrom('manager', 'staff'),
  establishmentId: establishmentIdArb,
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const nonAdminUserWithoutEstablishmentArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  userId: fc.string({ minLength: 1, maxLength: 24 }).filter(s => s.trim().length > 0),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  role: fc.constantFrom('manager', 'staff'),
  establishmentId: fc.constant(undefined),
  isActive: fc.constant(true),
  isEmailVerified: fc.constant(true),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

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

describe('EstablishmentSelector - Visual Selection Feedback Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Default token manager mocks
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('mock-access-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
  });

  /**
   * Property 5: Visual Selection Feedback
   * Validates: Requirements 2.5
   */
  describe('Property 5: Visual Selection Feedback', () => {
    test('**Feature: auth-establishment-improvement, Property 5: Visual Selection Feedback**', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            nonAdminUserWithEstablishmentArb,
            nonAdminUserWithoutEstablishmentArb,
            adminUserArb
          ),
          fc.array(establishmentArb, { minLength: 1, maxLength: 3 }),
          async (user, establishments) => {
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

            // Mock auth context
            mockUseAuth.mockReturnValue({
              user: user,
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

              const isAdmin = user.role === 'root' || user.role === 'super_admin';
              const hasEstablishment = !!user.establishmentId;

              // Property: Visual feedback should be provided based on user role and establishment assignment
              if (!isAdmin && hasEstablishment) {
                // Non-admin users with establishment should see "Assigné automatiquement" feedback
                await waitFor(() => {
                  expect(screen.getByText('(Assigné automatiquement)')).toBeInTheDocument();
                }, { timeout: 1000 });

                // Should also see restriction message
                await waitFor(() => {
                  expect(screen.getByText('Votre accès est limité à votre établissement assigné.')).toBeInTheDocument();
                }, { timeout: 1000 });

                // Select element should be disabled
                const selectElement = screen.getByRole('combobox');
                expect(selectElement).toBeDisabled();
                expect(selectElement).toHaveClass('bg-gray-100');
              } else if (!isAdmin && !hasEstablishment) {
                // Non-admin users without establishment should see "Sélection requise" feedback
                await waitFor(() => {
                  expect(screen.getByText('(Sélection requise)')).toBeInTheDocument();
                }, { timeout: 1000 });

                // Should see selection instruction message
                await waitFor(() => {
                  expect(screen.getByText('Sélectionnez un établissement pour cet utilisateur.')).toBeInTheDocument();
                }, { timeout: 1000 });

                // Select element should not be disabled
                const selectElement = screen.getByRole('combobox');
                expect(selectElement).not.toBeDisabled();
              } else if (isAdmin) {
                // Admin users should see admin-specific feedback
                if (establishments.length > 0) {
                  await waitFor(() => {
                    const adminMessage = screen.getByText(
                      `En tant qu'administrateur, vous pouvez sélectionner parmi tous les établissements (${establishments.length} disponibles).`
                    );
                    expect(adminMessage).toBeInTheDocument();
                  }, { timeout: 1000 });
                }

                // Select element should not be disabled
                const selectElement = screen.getByRole('combobox');
                expect(selectElement).not.toBeDisabled();
                expect(selectElement).not.toHaveClass('bg-gray-100');
              }

              // Property: Label should always be present
              expect(screen.getByText('Établissement')).toBeInTheDocument();

              // Property: Select element should always be present
              expect(screen.getByRole('combobox')).toBeInTheDocument();

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    test('Visual feedback for empty establishment list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(nonAdminUserWithoutEstablishmentArb, adminUserArb),
          async (user) => {
            // Mock API response with empty establishment list
            const mockResponse = {
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  data: []
                }
              })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            mockUseAuth.mockReturnValue({
              user: user,
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

              const isAdmin = user.role === 'root' || user.role === 'super_admin';

              // Property: Visual feedback should be provided for empty establishment lists
              if (isAdmin) {
                // Admin should see creation prompt
                await waitFor(() => {
                  expect(screen.getByText('Aucun établissement trouvé dans le système.')).toBeInTheDocument();
                  expect(screen.getByText('Créer le premier établissement →')).toBeInTheDocument();
                }, { timeout: 1000 });
              } else {
                // Non-admin should see contact admin message
                await waitFor(() => {
                  expect(screen.getByText('Aucun établissement disponible. Contactez un administrateur pour créer des établissements.')).toBeInTheDocument();
                }, { timeout: 1000 });
              }

              // Property: Select should show appropriate empty state message
              await waitFor(() => {
                expect(screen.getByText('Aucun établissement disponible')).toBeInTheDocument();
              }, { timeout: 1000 });

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 15000);

    test('Visual feedback during loading state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(nonAdminUserWithEstablishmentArb, adminUserArb),
          async (user) => {
            // Mock auth context with loading state
            mockUseAuth.mockReturnValue({
              user: user,
              isLoading: true, // Auth is still loading
            });

            const mockOnChange = jest.fn();

            const { unmount } = render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
              />
            );

            try {
              // Property: During loading, select should be disabled and show loading text
              const selectElement = screen.getByRole('combobox');
              expect(selectElement).toBeDisabled();
              expect(screen.getByText('Chargement...')).toBeInTheDocument();

              // Property: No API call should be made while auth is loading
              expect(global.fetch).not.toHaveBeenCalled();

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 10000);

    test('Visual feedback for disabled state', async () => {
      await fc.assert(
        fc.asyncProperty(
          adminUserArb,
          fc.array(establishmentArb, { minLength: 1, maxLength: 2 }),
          async (user, establishments) => {
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
              user: user,
              isLoading: false,
            });

            const mockOnChange = jest.fn();

            const { unmount } = render(
              <EstablishmentSelector 
                value="" 
                onChange={mockOnChange}
                disabled={true} // Explicitly disabled
              />
            );

            try {
              // Wait for component to load
              await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
              }, { timeout: 2000 });

              // Property: When explicitly disabled, select should be disabled and have disabled styling
              const selectElement = screen.getByRole('combobox');
              expect(selectElement).toBeDisabled();
              expect(selectElement).toHaveClass('bg-gray-100');
              expect(selectElement).toHaveClass('disabled:cursor-not-allowed');

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 15 }
      );
    }, 10000);
  });
});