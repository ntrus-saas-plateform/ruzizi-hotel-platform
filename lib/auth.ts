import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '@/middleware/establishmentAccess';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Extrait et valide le token JWT de la requête
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return null;
    }

    // Retourner l'utilisateur authentifié
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      establishmentId: decoded.establishmentId,
      permissions: decoded.permissions || [],
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Réponse standardisée pour non authentifié
 */
export function unauthorizedResponse() {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentification requise',
    },
  };
}

/**
 * Réponse standardisée pour accès refusé
 */
export function forbiddenResponse(reason?: string) {
  return {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: reason || 'Accès refusé',
    },
  };
}

/**
 * Réponse standardisée pour ressource non trouvée
 */
export function notFoundResponse(resource: string = 'Ressource') {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${resource} non trouvée`,
    },
  };
}
