import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { isTokenBlacklisted } from '@/lib/auth/token-blacklist';
import { AuthService } from '@/services/Auth.service';
import type { SystemPermission, UserRole } from '@/types/user.types';

/**
 * Interface pour les données utilisateur dans la requête
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  };
}

/**
 * Middleware d'authentification
 */
export async function authenticateUser(request: NextRequest): Promise<{
  success: boolean;
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  };
  error?: string;
}> {
  try {
    console.log('🔐 Starting user authentication...');

    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('📋 Token found in Authorization header');
    }

    // If no token in header, try cookies
    if (!token) {
      token = request.cookies.get('auth-token')?.value || null;
      if (token) {
        console.log('🍪 Token found in cookies');
      }
    }

    if (!token) {
      console.log('❌ No authentication token found');
      return { success: false, error: 'Token d\'authentification manquant' };
    }

    // Check if token is blacklisted
    console.log('🔍 Checking if token is blacklisted...');
    if (isTokenBlacklisted(token)) {
      console.log('🚫 Token is blacklisted');
      return { success: false, error: 'Token invalidé' };
    }

    // Vérifier le token JWT
    console.log('🔍 Verifying JWT token...');
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.log('❌ Token verification failed');
      return { success: false, error: 'Token invalide ou expiré' };
    }

    console.log('👤 Token valid, checking user existence for:', payload.userId);

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await AuthService.getUserById(payload.userId);

    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', payload.userId);
      return { success: false, error: 'Utilisateur non trouvé ou inactif' };
    }

    console.log('✅ Authentication successful for user:', user.email, 'role:', user.role);

    return {
      success: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        establishmentId: payload.establishmentId,
      },
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur d\'authentification'
    };
  }
}

/**
 * Middleware de vérification des permissions
 */
export async function requirePermission(
  request: NextRequest,
  requiredPermission: SystemPermission
): Promise<{
  success: boolean;
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  };
  error?: string;
}> {
  // D'abord authentifier l'utilisateur
  const authResult = await authenticateUser(request);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Vérifier la permission
  const hasPermission = await AuthService.hasPermission(
    authResult.user.userId,
    requiredPermission
  );

  if (!hasPermission) {
    return {
      success: false,
      error: `Permission '${requiredPermission}' requise`,
    };
  }

  return authResult;
}

/**
 * Middleware pour vérifier les rôles
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{
  success: boolean;
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  };
  error?: string;
}> {
  // D'abord authentifier l'utilisateur
  const authResult = await authenticateUser(request);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Vérifier le rôle
  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      error: `Rôle non autorisé. Rôles requis: ${allowedRoles.join(', ')}`,
    };
  }

  return authResult;
}

/**
 * Helper pour créer des réponses d'erreur d'authentification
 */
export function createAuthErrorResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: error,
        code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      },
    },
    { status }
  );
}

/**
 * Wrapper pour les API routes avec authentification
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateUser(request);

    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error || 'Authentification échouée');
    }

    return handler(request, authResult.user);
  };
}

/**
 * Wrapper pour les API routes avec vérification de permission
 */
export function withPermission(
  requiredPermission: SystemPermission,
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requirePermission(request, requiredPermission);

    if (!authResult.success || !authResult.user) {
      const status = authResult.error?.includes('Permission') ? 403 : 401;
      return createAuthErrorResponse(authResult.error || 'Accès refusé', status);
    }

    return handler(request, authResult.user);
  };
}

/**
 * Wrapper pour les API routes avec vérification de rôle
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireRole(request, allowedRoles);

    if (!authResult.success || !authResult.user) {
      const status = authResult.error?.includes('Rôle') ? 403 : 401;
      return createAuthErrorResponse(authResult.error || 'Accès refusé', status);
    }

    return handler(request, authResult.user);
  };
}

// Aliases pour compatibilité avec l'ancien code
export const requireAuth = withAuth;
export const verifyAuth = authenticateUser;

export function createErrorResponse(code: string, message: string, status: number = 500, details?: any): NextResponse {
  // In production, don't leak internal error details for 5xx errors
  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage = (status >= 500 && isProduction) ? 'Internal server error' : message;

  // For security, never include stack traces or sensitive information
  const sanitizedMessage = safeMessage
    .replace(/stack:.*/gi, '') // Remove stack traces
    .replace(/at\s+.*?\(.*?\)/gi, '') // Remove file paths
    .replace(/password|token|secret|key/gi, '[REDACTED]') // Redact sensitive data
    .trim();

  const errorResponse: any = {
    success: false,
    error: {
      code,
      message: sanitizedMessage,
    },
  };

  if (details) {
    errorResponse.error.details = details;
  }

  return NextResponse.json(errorResponse, { status });
}

export const createSuccessResponse = (data: any, message?: string, status: number = 200) =>
  NextResponse.json({ success: true, data, message }, { status });

/**
 * Helper for creating validation error responses from Zod errors
 */
export function createValidationErrorResponse(error: any, message: string = 'Validation failed'): NextResponse {
  if (error && typeof error === 'object' && 'issues' in error) {
    // ZodError
    return createErrorResponse('VALIDATION_ERROR', message, 400, error.issues);
  }
  return createErrorResponse('VALIDATION_ERROR', message, 400);
}

// Wrappers spécifiques pour les rôles
export const requireManager = (
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) => withRole(['manager', 'super_admin'], handler);

export const requireAdmin = (
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) => withRole(['super_admin'], handler);

export const requireSuperAdmin = (
  handler: (
    request: NextRequest,
    user: {
      userId: string;
      email: string;
      role: UserRole;
      establishmentId?: string;
    }
  ) => Promise<NextResponse>
) => withRole(['super_admin'], handler);

/**
 * Helper pour appliquer le filtre d'établissement selon le rôle
 * Les managers et staff ne voient que leur établissement
 */
export function applyEstablishmentFilter(
  user: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  },
  filters: any = {}
): any {
  // Root et super_admin voient tout
  if (user.role === 'root' || user.role === 'super_admin') {
    return filters;
  }

  // Manager et staff ne voient que leur établissement
  if ((user.role === 'manager' || user.role === 'staff') && user.establishmentId) {
    return {
      ...filters,
      establishmentId: user.establishmentId,
    };
  }

  return filters;
}

/**
 * Vérifie si l'utilisateur peut accéder à une ressource d'un établissement spécifique
 */
export function canAccessEstablishment(
  user: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  },
  resourceEstablishmentId: string
): boolean {
  // Root et super_admin ont accès à tout
  if (user.role === 'root' || user.role === 'super_admin') {
    return true;
  }

  // Manager et staff ne peuvent accéder qu'à leur établissement
  return user.establishmentId === resourceEstablishmentId;
}

/**
 * Vérifie si l'utilisateur peut modifier une ressource
 */
export function canModifyResource(
  user: {
    userId: string;
    email: string;
    role: UserRole;
    establishmentId?: string;
  },
  resourceEstablishmentId: string
): boolean {
  // Root et super_admin peuvent tout modifier
  if (user.role === 'root' || user.role === 'super_admin') {
    return true;
  }

  // Manager peut modifier les ressources de son établissement
  if (user.role === 'manager' && user.establishmentId === resourceEstablishmentId) {
    return true;
  }

  // Staff ne peut pas modifier
  return false;
}