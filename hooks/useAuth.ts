/**
 * React Hook for Authentication
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isAuthenticated,
  getCurrentUser,
  hasRole,
  logout,
  getAccessToken,
} from '@/lib/utils/auth';

interface User {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  hasRole: (role: string | string[]) => boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const checkRole = useCallback(
    (role: string | string[]) => {
      return hasRole(role);
    },
    [user]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, []);

  return {
    isAuthenticated: isAuthenticated(),
    user,
    loading,
    hasRole: checkRole,
    logout: handleLogout,
    refreshAuth,
  };
}
