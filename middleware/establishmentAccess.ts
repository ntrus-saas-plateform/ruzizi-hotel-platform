import { NextRequest } from 'next/server';

/**
 * Middleware pour filtrer les données par établissement
 * Les managers et staff ne voient que les données de leur établissement
 */

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'root' | 'super_admin' | 'manager' | 'staff';
    establishmentId?: string;
    permissions: string[];
}

/**
 * Vérifie si l'utilisateur a accès à un établissement spécifique
 */
export function canAccessEstablishment(
    user: AuthenticatedUser,
    establishmentId: string
): boolean {
    // Root et super_admin ont accès à tout
    if (user.role === 'root' || user.role === 'super_admin') {
        return true;
    }

    // Manager et staff ne peuvent accéder qu'à leur établissement
    if (user.role === 'manager' || user.role === 'staff') {
        return user.establishmentId === establishmentId;
    }

    return false;
}

/**
 * Filtre les données selon l'établissement de l'utilisateur
 */
export function getEstablishmentFilter(user: AuthenticatedUser): any {
    // Root et super_admin voient tout
    if (user.role === 'root' || user.role === 'super_admin') {
        return {};
    }

    // Manager et staff ne voient que leur établissement
    if (user.role === 'manager' || user.role === 'staff') {
        if (!user.establishmentId) {
            throw new Error('Utilisateur sans établissement assigné');
        }
        return { establishmentId: user.establishmentId };
    }

    return {};
}

/**
 * Vérifie si l'utilisateur peut créer/modifier une ressource pour un établissement
 */
export function canModifyEstablishmentResource(
    user: AuthenticatedUser,
    establishmentId: string
): boolean {
    // Root et super_admin peuvent tout modifier
    if (user.role === 'root' || user.role === 'super_admin') {
        return true;
    }

    // Manager peut modifier les ressources de son établissement
    if (user.role === 'manager') {
        return user.establishmentId === establishmentId;
    }

    // Staff ne peut généralement pas créer/modifier (selon permissions)
    return false;
}

/**
 * Obtient la liste des établissements accessibles par l'utilisateur
 */
export function getAccessibleEstablishments(user: AuthenticatedUser): string[] | 'all' {
    // Root et super_admin ont accès à tous
    if (user.role === 'root' || user.role === 'super_admin') {
        return 'all';
    }

    // Manager et staff ont accès uniquement à leur établissement
    if (user.establishmentId) {
        return [user.establishmentId];
    }

    return [];
}

/**
 * Vérifie les permissions pour une action spécifique
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
    // Root a toutes les permissions
    if (user.role === 'root') {
        return true;
    }

    return user.permissions.includes(permission);
}

/**
 * Filtre de sécurité pour les requêtes de liste
 */
export function applySecurityFilter(
    user: AuthenticatedUser,
    baseFilter: any = {}
): any {
    const establishmentFilter = getEstablishmentFilter(user);
    return { ...baseFilter, ...establishmentFilter };
}

/**
 * Valide l'accès à une ressource spécifique
 */
export function validateResourceAccess(
    user: AuthenticatedUser,
    resource: { establishmentId?: string },
    action: 'read' | 'write' | 'delete' = 'read'
): { allowed: boolean; reason?: string } {
    // Root a tous les droits
    if (user.role === 'root') {
        return { allowed: true };
    }

    // Super admin a tous les droits sauf système
    if (user.role === 'super_admin') {
        return { allowed: true };
    }

    // Vérifier si la ressource a un établissement
    if (!resource.establishmentId) {
        return {
            allowed: false,
            reason: 'Ressource sans établissement assigné'
        };
    }

    // Vérifier si l'utilisateur a un établissement
    if (!user.establishmentId) {
        return {
            allowed: false,
            reason: 'Utilisateur sans établissement assigné'
        };
    }

    // Vérifier si c'est le même établissement
    if (resource.establishmentId !== user.establishmentId) {
        return {
            allowed: false,
            reason: 'Accès refusé: établissement différent'
        };
    }

    // Manager peut lire et écrire
    if (user.role === 'manager') {
        return { allowed: true };
    }

    // Staff peut seulement lire (sauf si permissions spéciales)
    if (user.role === 'staff') {
        if (action === 'read') {
            return { allowed: true };
        }
        return {
            allowed: false,
            reason: 'Permissions insuffisantes pour cette action'
        };
    }

    return { allowed: false, reason: 'Rôle non reconnu' };
}

/**
 * Logs d'audit pour les accès
 */
export function logAccess(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    success: boolean
): void {
    const logEntry = {
        timestamp: new Date().toISOString(),
        userId: user.id,
        userRole: user.role,
        userEstablishment: user.establishmentId,
        resource,
        action,
        success,
    };

    // En production, envoyer à un service de logging
    console.log('[ACCESS LOG]', JSON.stringify(logEntry));
}

/**
 * Middleware pour extraire et valider l'utilisateur authentifié
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
        // Récupérer le token depuis les headers ou cookies
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return null;
        }

        // Décoder et valider le token (à implémenter selon votre système JWT)
        // Pour l'instant, retourner null si pas de token
        // Dans une vraie implémentation, décoder le JWT et récupérer les infos user

        return null;
    } catch (error) {
        console.error('Error getting authenticated user:', error);
        return null;
    }
}

/**
 * Helper pour les réponses d'erreur d'accès
 */
export function accessDeniedResponse(reason?: string) {
    return {
        success: false,
        error: {
            code: 'ACCESS_DENIED',
            message: reason || 'Accès refusé à cette ressource',
        },
    };
}

/**
 * Helper pour vérifier si un utilisateur peut voir tous les établissements
 */
export function canViewAllEstablishments(user: AuthenticatedUser): boolean {
    return user.role === 'root' || user.role === 'super_admin';
}

/**
 * Helper pour obtenir le filtre d'établissement depuis les query params
 */
export function getEstablishmentFilterFromQuery(
    user: AuthenticatedUser,
    requestedEstablishmentId?: string
): any {
    // Si l'utilisateur peut voir tous les établissements
    if (canViewAllEstablishments(user)) {
        // Si un établissement spécifique est demandé, l'utiliser
        if (requestedEstablishmentId) {
            return { establishmentId: requestedEstablishmentId };
        }
        // Sinon, pas de filtre (voir tout)
        return {};
    }

    // Sinon, forcer le filtre sur l'établissement de l'utilisateur
    if (!user.establishmentId) {
        throw new Error('Utilisateur sans établissement assigné');
    }

    return { establishmentId: user.establishmentId };
}

export default {
    canAccessEstablishment,
    getEstablishmentFilter,
    canModifyEstablishmentResource,
    getAccessibleEstablishments,
    hasPermission,
    applySecurityFilter,
    validateResourceAccess,
    logAccess,
    getAuthenticatedUser,
    accessDeniedResponse,
    canViewAllEstablishments,
    getEstablishmentFilterFromQuery,
};
