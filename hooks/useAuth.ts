/**
 * Hook personnalisé pour gérer l'authentification
 * Gère la vérification, le refresh automatique et la redirection
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  establishmentId?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Vérifier l'authentification
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.log('❌ No token found');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'No token found',
        });
        router.push('/backoffice/login');
        return false;
      }

      // Vérifier le token avec l'API
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('❌ Token invalid');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'Invalid token',
        });
        router.push('/backoffice/login');
        return false;
      }

      const data = await response.json();
      const user = data.user || data.data?.user;

      console.log('✅ User authenticated');
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      router.push('/backoffice/login');
      return false;
    }
  }, [router]);

  // Rafraîchir le token
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.log('❌ No refresh token');
        return false;
      }

      console.log('🔄 Refreshing token...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('❌ Token refresh failed');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/backoffice/login');
        return false;
      }

      const data = await response.json();

      if (data.success && data.data?.accessToken) {
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        document.cookie = `auth-token=${newToken}; path=/; max-age=${15 * 60}`;
        console.log('✅ Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }, [router]);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
      router.push('/backoffice/login');
    }
  }, [router]);

  // Vérifier l'authentification au montage
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await checkAuth();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  // Auto-refresh du token toutes les 10 minutes
  useEffect(() => {
    if (!authState.isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh check...');
      refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(interval);
    };
  }, [authState.isAuthenticated, refreshToken]);

  return {
    ...authState,
    checkAuth,
    refreshToken,
    logout,
  };
}
