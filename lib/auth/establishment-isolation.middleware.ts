import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthErrorResponse } from './middleware';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import type { UserRole } from '@/types/user.types';

/**
 * Establishment context interface for API routes
 */
export interface EstablishmentContext {
  userId: string;
  email: string;
  role: UserRole;
  establishmentId?: string;
  serviceContext: EstablishmentServiceContext;
}

/**
 * Options for establishment isolation middleware
 */
export interface IsolationOptions {
  /**
   * Whether to require an establishmentId for non-admin users
   * @default true
   */
  requireEstablishment?: boolean;

  /**
   * Whether to allow admins to access all establishments
   * @default true
   */
  allowAdminGlobalAccess?: boolean;

  /**
   * Custom error message for missing establishment
   */
  missingEstablishmentMessage?: string;
}

/**
 * Default isolation options
 */
const DEFAULT_OPTIONS: Required<IsolationOptions> = {
  requireEstablishment: true,
  allowAdminGlobalAccess: true,
  missingEstablishmentMessage: 'Établissement requis pour cette opération',
};

/**
 * Enhanced authentication middleware with establishment isolation
 * 
 * This middleware:
 * 1. Authenticates the user using existing auth middleware
 * 2. Extracts establishment context from JWT
 * 3. Creates an EstablishmentServiceContext for data filtering
 * 4. Validates establishment requirements based on user role
 * 
 * @param handler - The API route handler that receives the establishment context
 * @param options - Configuration options for isolation behavior
 * @returns Wrapped handler with establishment isolation
 */
export function withEstablishmentIsolation(
  handler: (
    request: NextRequest,
    context: EstablishmentContext
  ) => Promise<NextResponse>,
  options: IsolationOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    // Step 1: Authenticate user
    const authResult = await authenticateUser(request);

    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Authentification échouée'
      );
    }

    const { userId, email, role, establishmentId } = authResult.user;

    // Step 2: Validate establishment requirements
    const isAdmin = role === 'root' || role === 'super_admin';
    const requiresEstablishment = opts.requireEstablishment && !isAdmin;

    if (requiresEstablishment && !establishmentId) {
      return createAuthErrorResponse(
        opts.missingEstablishmentMessage,
        403
      );
    }

    // Step 3: Create establishment service context
    const serviceContext = new EstablishmentServiceContext(
      userId,
      role,
      establishmentId
    );

    // Step 4: Build establishment context
    const context: EstablishmentContext = {
      userId,
      email,
      role,
      establishmentId,
      serviceContext,
    };

    // Step 5: Call handler with context
    return handler(request, context);
  };
}

/**
 * Extract establishment ID from request query or body
 * Useful for operations that specify an establishment explicitly
 * 
 * @param request - The Next.js request object
 * @returns The establishment ID if found, undefined otherwise
 */
export async function extractEstablishmentId(
  request: NextRequest
): Promise<string | undefined> {
  // Try URL search params first
  const { searchParams } = new URL(request.url);
  const queryEstablishmentId = searchParams.get('establishmentId');
  
  if (queryEstablishmentId) {
    return queryEstablishmentId;
  }

  // Try request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json();
      return body.establishmentId;
    } catch {
      // Body parsing failed or not JSON
      return undefined;
    }
  }

  return undefined;
}

/**
 * Validate that a resource belongs to the user's establishment
 * Returns an error response if validation fails
 * 
 * @param context - The establishment context
 * @param resourceEstablishmentId - The establishment ID of the resource
 * @param resourceType - Type of resource for error message
 * @returns NextResponse with error if validation fails, null if valid
 */
export function validateResourceAccess(
  context: EstablishmentContext,
  resourceEstablishmentId: string | undefined,
  resourceType: string = 'ressource'
): NextResponse | null {
  if (!resourceEstablishmentId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_ESTABLISHMENT',
          message: `Cette ${resourceType} n'a pas d'établissement associé`,
        },
      },
      { status: 400 }
    );
  }

  // Check if user can access all establishments (admin)
  if (context.serviceContext.canAccessAll()) {
    return null;
  }

  // For non-admin users, check if the resource belongs to their establishment
  const hasAccess = resourceEstablishmentId === context.establishmentId;

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ESTABLISHMENT_ACCESS_DENIED',
          message: `Accès refusé : cette ${resourceType} appartient à un autre établissement`,
        },
      },
      { status: 403 }
    );
  }

  return null;
}
