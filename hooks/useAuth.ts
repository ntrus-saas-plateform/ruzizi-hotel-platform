import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  establishmentId?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Charger l'utilisateur actuel
   */
  const loadUser = useCallback(async () => {
    try {
      const token = apiClient.getAccessToken();
      
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const response = await apiClient.get<any>('/api/auth/me');
      
      if (response.success && response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Log more details about the response for debugging
        console.warn('Auth response structure:', response);
        throw new Error(response.error?.message || 'Failed to load user');
      }
    } catch (error: any) {
      // Don't log error if it's just a 401 (user not authenticated)
      if (error.status !== 401) {
        console.error('Failed to load user', error);
      }
      
      // Clear tokens on any auth error
      apiClient.clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.post<any>('/api/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        // Sauvegarder les tokens
        apiClient.setTokens(response.data.tokens);

        // Mettre à jour l'état
        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, user: response.data.user };
      }

      throw new Error(response.error?.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      // Appeler l'API de logout (optionnel)
      await apiClient.post('/api/auth/logout').catch(() => {
        // Ignorer les erreurs de logout
      });
    } finally {
      // Nettoyer les tokens et l'état
      apiClient.clearTokens();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Rediriger vers la page de login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  /**
   * Rafraîchir le token manuellement
   */
  const refreshAuth = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  /**
   * Charger l'utilisateur au montage
   */
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    refreshAuth,
  };
}
