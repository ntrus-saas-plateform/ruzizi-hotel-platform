import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/establishments',
  '/booking',
  '/track-booking',
  '/booking-confirmation',
  '/faq',
  '/privacy',
  '/terms',
  '/support',
  '/backoffice',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Routes API publiques
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/public',
  '/api/init',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware - Checking path:', pathname);
  
  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => {
    const matches = pathname === route || pathname.startsWith(`${route}/`);
    if (matches) {
      console.log('✅ Public route matched:', route);
    }
    return matches;
  });
  
  const isPublicApiRoute = publicApiRoutes.some(route => {
    const matches = pathname.startsWith(route);
    if (matches) {
      console.log('✅ Public API route matched:', route);
    }
    return matches;
  });
  
  // Laisser passer les routes publiques
  if (isPublicRoute || isPublicApiRoute) {
    console.log('✅ Allowing public route:', pathname);
    return NextResponse.next();
  }
  
  // Vérifier si c'est une route admin
  const isAdminRoute = pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    // Récupérer le token depuis les cookies
    const token = request.cookies.get('auth-token')?.value;
    
    // Si pas de token, rediriger vers la page de login
    if (!token) {
      const loginUrl = new URL('/backoffice/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // TODO: Vérifier la validité du token JWT
    // Pour l'instant, on laisse passer si le token existe
    // Dans une vraie application, il faudrait :
    // 1. Décoder le JWT
    // 2. Vérifier la signature
    // 3. Vérifier l'expiration
    // 4. Vérifier les permissions/rôles
    
    return NextResponse.next();
  }
  
  // Pour toutes les autres routes, laisser passer
  return NextResponse.next();
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
