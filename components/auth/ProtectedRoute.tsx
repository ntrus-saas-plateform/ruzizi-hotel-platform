/**
 * Protected Route Component
 * Wraps pages that require authentication
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, hasRole, getAccessToken } from '@/lib/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Determine login path based on current location
      const currentPath = window.location.pathname;
      const loginPath = currentPath.startsWith('/admin') || currentPath.startsWith('/backoffice')
        ? '/backoffice/login'
        : '/auth/login';

      // Check if authenticated
      if (!isAuthenticated()) {
        router.push(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Get fresh token (will refresh if needed)
      const token = await getAccessToken();

      if (!token) {
        router.push(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Check role if required
      if (requiredRole) {
        if (!hasRole(requiredRole)) {
          router.push('/unauthorized');
          return;
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth check error:', error);
      const currentPath = window.location.pathname;
      const loginPath = currentPath.startsWith('/admin') || currentPath.startsWith('/backoffice')
        ? '/backoffice/login'
        : '/auth/login';
      router.push(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-luxury-gold rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-4 text-luxury-text">Vérification de l'authentification...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
