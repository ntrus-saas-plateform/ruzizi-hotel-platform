import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JWTPayload, UserRole } from '@/types/user.types';

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Verify authentication token
 */
export function verifyAuth(request: NextRequest): JWTPayload | null {
  try {
    const token = extractToken(request);

    if (!token) {
      return null;
    }

    return verifyAccessToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(
  roles: UserRole | UserRole[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async (request: NextRequest): Promise<NextResponse> => {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Middleware to require super admin role
 */
export function requireSuperAdmin(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return requireRole('super_admin', handler);
}

/**
 * Middleware to require manager or super admin role
 */
export function requireManager(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return requireRole(['super_admin', 'manager'], handler);
}

/**
 * Middleware to check if user belongs to the same establishment
 */
export function requireSameEstablishment(
  getEstablishmentId: (request: NextRequest) => string | null,
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Super admin can access all establishments
    if (user.role === 'super_admin') {
      return handler(request, user);
    }

    const establishmentId = getEstablishmentId(request);

    if (!establishmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Establishment ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if user belongs to the establishment
    if (user.establishmentId !== establishmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this establishment',
          },
        },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse(data: any, message?: string, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}
