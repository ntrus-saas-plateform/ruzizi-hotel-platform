/**
 * Image Access Control Middleware
 * 
 * Provides establishment-based access control for image serving endpoints.
 * Ensures users can only access images belonging to their establishment
 * (unless they have admin privileges).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthErrorResponse } from '@/lib/auth/middleware';
import { imageMetadataStore } from '@/lib/image/image-metadata-store';
import AuditService from '@/services/Audit.service';
import type { UserRole } from '@/types/user.types';

/**
 * User context for image access
 */
export interface ImageAccessContext {
  userId: string;
  email: string;
  role: UserRole;
  establishmentId?: string;
}

/**
 * Options for image access control
 */
export interface ImageAccessOptions {
  /**
   * Whether to require authentication for image access
   * @default true
   */
  requireAuth?: boolean;

  /**
   * Whether to enforce establishment isolation
   * @default true
   */
  enforceEstablishmentIsolation?: boolean;

  /**
   * Whether to log image access for audit purposes
   * @default true
   */
  enableAuditLogging?: boolean;

  /**
   * Custom error message for access denied
   */
  accessDeniedMessage?: string;
}

/**
 * Default access control options
 */
const DEFAULT_OPTIONS: Required<ImageAccessOptions> = {
  requireAuth: true,
  enforceEstablishmentIsolation: true,
  enableAuditLogging: true,
  accessDeniedMessage: 'Accès refusé : vous ne pouvez pas accéder à cette image',
};

/**
 * Image access control middleware
 * 
 * This middleware:
 * 1. Authenticates the user (if required)
 * 2. Validates image exists and gets its metadata
 * 3. Checks establishment-based access permissions
 * 4. Logs access attempts for audit purposes
 * 5. Adds security headers to responses
 * 
 * @param imageId - The ID of the image being accessed
 * @param handler - The image serving handler
 * @param options - Access control configuration
 * @returns Wrapped handler with access control
 */
export function withImageAccessControl(
  handler: (
    request: NextRequest,
    imageId: string,
    context?: ImageAccessContext
  ) => Promise<NextResponse>,
  options: ImageAccessOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest, routeParams: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    const { id } = await routeParams.params;
    
    // Extract image ID from filename (remove extension if present)
    const imageId = id.replace(/\.(webp|jpg|jpeg|png)$/i, '');

    let context: ImageAccessContext | undefined;

    // Step 1: Authenticate user (if required)
    if (opts.requireAuth) {
      const authResult = await authenticateUser(request);

      if (!authResult.success || !authResult.user) {
        // Log failed authentication attempt
        if (opts.enableAuditLogging) {
          await logImageAccessAttempt(
            imageId,
            request,
            null,
            'AUTHENTICATION_FAILED',
            authResult.error || 'Authentication failed'
          );
        }
        
        return createAuthErrorResponse(
          authResult.error || 'Authentification requise pour accéder aux images'
        );
      }

      context = {
        userId: authResult.user.userId,
        email: authResult.user.email,
        role: authResult.user.role,
        establishmentId: authResult.user.establishmentId,
      };
    }

    // Step 2: Get image metadata and validate access
    if (opts.enforceEstablishmentIsolation && context) {
      try {
        const metadata = await imageMetadataStore.findById(imageId);
        
        if (!metadata) {
          // Log access attempt to non-existent image
          if (opts.enableAuditLogging) {
            await logImageAccessAttempt(
              imageId,
              request,
              context,
              'IMAGE_NOT_FOUND',
              'Image not found'
            );
          }
          
          return new NextResponse('Image not found', { status: 404 });
        }

        // Check establishment-based access
        const hasAccess = canAccessImage(context, metadata.establishmentId.toString());
        
        if (!hasAccess) {
          // Log unauthorized access attempt
          if (opts.enableAuditLogging) {
            await logImageAccessAttempt(
              imageId,
              request,
              context,
              'ACCESS_DENIED',
              `User from establishment ${context.establishmentId} attempted to access image from establishment ${metadata.establishmentId}`
            );
          }
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'IMAGE_ACCESS_DENIED',
                message: opts.accessDeniedMessage,
              },
            },
            { status: 403 }
          );
        }

        // Log successful access
        if (opts.enableAuditLogging) {
          await logImageAccessAttempt(
            imageId,
            request,
            context,
            'ACCESS_GRANTED',
            'Image access granted'
          );
        }
      } catch (error) {
        console.error('Error validating image access:', error);
        
        // Log system error
        if (opts.enableAuditLogging && context) {
          await logImageAccessAttempt(
            imageId,
            request,
            context,
            'SYSTEM_ERROR',
            `Access validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
        
        return new NextResponse('Internal server error', { status: 500 });
      }
    }

    // Step 3: Call the original handler
    const response = await handler(request, imageId, context);

    // Step 4: Add security headers to response
    addSecurityHeaders(response);

    return response;
  };
}

/**
 * Check if user can access an image based on establishment isolation
 */
function canAccessImage(
  context: ImageAccessContext,
  imageEstablishmentId: string
): boolean {
  // Root and super_admin can access all images
  if (context.role === 'root' || context.role === 'super_admin') {
    return true;
  }

  // Manager and staff can only access images from their establishment
  if ((context.role === 'manager' || context.role === 'staff') && context.establishmentId) {
    return context.establishmentId === imageEstablishmentId;
  }

  // If no establishment ID is set for the user, deny access
  return false;
}

/**
 * Add security headers to image responses
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent images from being embedded in other sites (clickjacking protection)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // Content Security Policy for images
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"
  );
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer policy for privacy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
}

/**
 * Log image access attempts for audit purposes
 */
async function logImageAccessAttempt(
  imageId: string,
  request: NextRequest,
  context: ImageAccessContext | null,
  result: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'AUTHENTICATION_FAILED' | 'IMAGE_NOT_FOUND' | 'SYSTEM_ERROR',
  details: string
): Promise<void> {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct access';
    const clientIP = getClientIP(request);

    // Only log if we have a user context
    if (context?.userId) {
      await AuditService.log({
        userId: context.userId,
        action: 'create', // Using 'create' as closest match for access action
        entity: 'user', // Using 'user' as closest match since 'image' is not in the enum
        entityId: imageId,
        metadata: {
          action: 'IMAGE_ACCESS',
          result,
          message: details,
          userAgent,
          referer,
          clientIP,
          requestUrl: request.url,
          method: request.method,
          establishmentId: context.establishmentId,
          userEmail: context.email,
        },
        ipAddress: clientIP,
        userAgent,
      });
    }
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log image access attempt:', error);
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) {
    return clientIP;
  }

  // Fallback to connection remote address (may not be available in serverless)
  return 'unknown';
}

/**
 * Middleware specifically for thumbnail access control
 * Extends the base image access control with thumbnail-specific logic
 */
export function withThumbnailAccessControl(
  handler: (
    request: NextRequest,
    imageId: string,
    size: string,
    context?: ImageAccessContext
  ) => Promise<NextResponse>,
  options: ImageAccessOptions = {}
) {
  return async (request: NextRequest, routeParams: { params: Promise<{ id: string; size: string }> }): Promise<NextResponse> => {
    const { id, size } = await routeParams.params;
    
    // Create a wrapper handler that matches the expected signature
    const wrappedHandler = async (
      req: NextRequest,
      imageId: string,
      context?: ImageAccessContext
    ): Promise<NextResponse> => {
      return handler(req, imageId, size, context);
    };

    // Use the base image access control middleware
    const accessControlledHandler = withImageAccessControl(wrappedHandler, options);
    
    return accessControlledHandler(request, { params: Promise.resolve({ id }) });
  };
}

/**
 * Public image access (no authentication required)
 * Used for publicly accessible images like establishment logos
 */
export function withPublicImageAccess(
  handler: (
    request: NextRequest,
    imageId: string
  ) => Promise<NextResponse>
) {
  return withImageAccessControl(
    async (request, imageId) => handler(request, imageId),
    {
      requireAuth: false,
      enforceEstablishmentIsolation: false,
      enableAuditLogging: false,
    }
  );
}

/**
 * Admin-only image access
 * Used for administrative image management endpoints
 */
export function withAdminImageAccess(
  handler: (
    request: NextRequest,
    imageId: string,
    context: ImageAccessContext
  ) => Promise<NextResponse>
) {
  return withImageAccessControl(
    async (request, imageId, context) => {
      if (!context) {
        throw new Error('Context is required for admin access');
      }
      
      // Only allow root and super_admin roles
      if (context.role !== 'root' && context.role !== 'super_admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ADMIN_ACCESS_REQUIRED',
              message: 'Accès administrateur requis pour cette opération',
            },
          },
          { status: 403 }
        );
      }
      
      return handler(request, imageId, context);
    },
    {
      requireAuth: true,
      enforceEstablishmentIsolation: false, // Admins can access all images
      enableAuditLogging: true,
    }
  );
}