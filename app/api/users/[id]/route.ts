import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      // Les utilisateurs peuvent voir leur propre profil
      // Les super_admin et manager peuvent voir tous les profils
      if (user.userId !== resolvedParams.id && user.role === 'staff') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      const userData = await UserService.getById(resolvedParams.id);
      return createSuccessResponse(userData);
    } catch (error: any) {
      if (error.message === 'Utilisateur non trouvé') {
        return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
      }
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      // Seuls les super_admin peuvent modifier les utilisateurs
      if (user.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      const data = await request.json();
      const updatedUser = await UserService.update(resolvedParams.id, data);

      return createSuccessResponse(updatedUser, 'Utilisateur mis à jour avec succès');
    } catch (error: any) {
      if (error.message === 'Utilisateur non trouvé') {
        return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
      }
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      // Seuls les super_admin peuvent supprimer des utilisateurs
      if (user.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      // Empêcher la suppression de son propre compte
      if (user.userId === resolvedParams.id) {
        return createErrorResponse('VALIDATION_ERROR', 'Vous ne pouvez pas supprimer votre propre compte', 400);
      }

      await UserService.delete(resolvedParams.id);
      return createSuccessResponse(null, 'Utilisateur supprimé avec succès');
    } catch (error: any) {
      if (error.message === 'Utilisateur non trouvé') {
        return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
      }
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
    }
  })(request);
}
