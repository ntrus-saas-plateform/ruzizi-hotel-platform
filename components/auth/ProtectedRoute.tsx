'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/types/user.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Check role permissions if specified
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not authorized
  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
