/**
 * @jest-environment jsdom
 */

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

describe('EstablishmentSelector Component - UnifiedTokenManager Integration', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Default auth context mock
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        role: 'root',
        establishmentId: null,
      },
      isLoading: false,
    });
  });

  it('uses UnifiedTokenManager.getAccessToken() instead of direct localStorage access', async () => {
    // Mock successful token retrieval and API response
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('mock-access-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
    
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          data: [
            { id: '1', name: 'Hotel Test', location: { city: 'Bujumbura' } }
          ]
        }
      })
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(unifiedTokenManager.getAccessToken).toHaveBeenCalled();
    });

    // Verify that fetch was called with the token from UnifiedTokenManager
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/establishments', {
        headers: {
          'Authorization': 'Bearer mock-access-token',
        },
      });
    });

    // Verify that the establishment appears in the dropdown
    await waitFor(() => {
      expect(screen.getByText('Hotel Test - Bujumbura')).toBeInTheDocument();
    });
  });

  it('handles missing token from UnifiedTokenManager', async () => {
    // Mock missing token
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue(null);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Token d'authentification manquant/)).toBeInTheDocument();
    });

    // Verify that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles invalid token from UnifiedTokenManager', async () => {
    // Mock invalid token
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('invalid-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(false);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Token d'authentification invalide/)).toBeInTheDocument();
    });

    // Verify that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles expired token and attempts refresh', async () => {
    // Mock expired token that gets refreshed
    (unifiedTokenManager.getAccessToken as jest.Mock)
      .mockReturnValueOnce('expired-token')
      .mockReturnValueOnce('refreshed-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.refreshTokenIfNeeded as jest.Mock).mockResolvedValue('refreshed-token');
    
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          data: [
            { id: '1', name: 'Hotel Test', location: { city: 'Bujumbura' } }
          ]
        }
      })
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for token refresh to be called
    await waitFor(() => {
      expect(unifiedTokenManager.refreshTokenIfNeeded).toHaveBeenCalled();
    });

    // Verify that fetch was called with the refreshed token
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/establishments', {
        headers: {
          'Authorization': 'Bearer refreshed-token',
        },
      });
    });
  });

  it('handles failed token refresh', async () => {
    // Mock expired token that fails to refresh
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('expired-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.refreshTokenIfNeeded as jest.Mock).mockResolvedValue(null);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Impossible de renouveler le token d'authentification/)).toBeInTheDocument();
    });

    // Verify that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles API authentication errors (401)', async () => {
    // Mock valid token but API returns 401
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
    
    const mockResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } })
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Session expirée. Veuillez vous reconnecter./)).toBeInTheDocument();
    });
  });

  it('handles API authorization errors (403)', async () => {
    // Mock valid token but API returns 403
    (unifiedTokenManager.getAccessToken as jest.Mock).mockReturnValue('valid-token');
    (unifiedTokenManager.isTokenValid as jest.Mock).mockReturnValue(true);
    (unifiedTokenManager.isTokenExpired as jest.Mock).mockReturnValue(false);
    
    const mockResponse = {
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: { message: 'Forbidden' } })
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <EstablishmentSelector 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Accès non autorisé aux établissements./)).toBeInTheDocument();
    });
  });
});