import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
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
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token d\'authentification manquant' };
    }

    const token = authHeader.substring(7);
    
    // Vérifier le token JWT
    const payload = verifyAccessToken(token);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await AuthService.getUserById(payload.userId);
    
    if (!user || !user.isActive) {
      return { success: false, error: 'Utilisateur non trouvé ou inactif' };
    }

    return {
      success: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        establishmentId: payload.establishmentId,
      },
    };
  } catch (error) {
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

export function createErrorResponse(code: string, message: string, status: number = 500): NextResponse {
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

export const createSuccessResponse = (data: any, message?: string, status: number = 200) => 
  NextResponse.json({ success: true, data, message }, { status });

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