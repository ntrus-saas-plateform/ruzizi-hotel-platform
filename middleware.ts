import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { addSecurityHeaders } from '@/lib/security/headers';

// Rate limiting configuration
const AUTH_RATE_LIMIT = {
  maxRequests: 200, // 200 attempts per window (augmented for testing)
  windowMs: 60 * 60 * 1000, // 1 hour
};

const GENERAL_RATE_LIMIT = {
  maxRequests: 1000, // 1000 requests per window
  windowMs: 60 * 60 * 1000, // 1 hour
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Temporarily disable rate limiting for debugging
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Apply stricter rate limiting to authentication endpoints - DISABLED FOR DEBUGGING
  /*
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitResult = rateLimit(`auth-${ip}`, AUTH_RATE_LIMIT.maxRequests, AUTH_RATE_LIMIT.windowMs);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts. Please try again later.',
          },
        },
        {
          status: 429,
          headers: getRateLimitHeaders(AUTH_RATE_LIMIT.maxRequests, rateLimitResult.remaining, rateLimitResult.resetTime),
        }
      );
      return addSecurityHeaders(response);
    }
  }

  // Apply general rate limiting to all API routes - DISABLED FOR DEBUGGING
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimit(`api-${ip}`, GENERAL_RATE_LIMIT.maxRequests, GENERAL_RATE_LIMIT.windowMs);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: getRateLimitHeaders(GENERAL_RATE_LIMIT.maxRequests, rateLimitResult.remaining, rateLimitResult.resetTime),
        }
      );
      return addSecurityHeaders(response);
    }
  }
  */

  // Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
