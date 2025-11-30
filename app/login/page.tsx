'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Redirect page for /login
 * Redirects to the appropriate login page based on context
 */
function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get redirect parameter if exists
    const redirect = searchParams.get('redirect');
    const message = searchParams.get('message');

    // Build query params
    const params = new URLSearchParams();
    if (redirect) params.set('redirect', redirect);
    if (message) params.set('message', message);

    // Determine which login page to use
    const loginPath = redirect?.startsWith('/admin') || redirect?.startsWith('/backoffice')
      ? '/backoffice/login'
      : '/auth/login';

    // Redirect
    const queryString = params.toString();
    router.replace(queryString ? `${loginPath}?${queryString}` : loginPath);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="mt-4 text-luxury-text">Redirection...</p>
      </div>
    </div>
  );
}

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-4 text-luxury-text">Chargement...</p>
        </div>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  );
}
