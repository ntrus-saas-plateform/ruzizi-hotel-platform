import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import UserService from '@/services/User.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Users can view their own profile
      // Admins and managers can view profiles within their establishment scope
      if (context.userId !== resolvedParams.id && context.role === 'staff') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      const userData = await UserService.getById(resolvedParams.id, context.serviceContext);
      return createSuccessResponse(userData);
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        if (error.message === 'Utilisateur non trouvé') {
          return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
        }
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Only super_admin can modify users
      if (context.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      const data = await req.json();
      const updatedUser = await UserService.update(resolvedParams.id, data, context.serviceContext);

      return createSuccessResponse(updatedUser, 'Utilisateur mis à jour avec succès');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        if (error.message === 'Utilisateur non trouvé') {
          return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
        }
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Only super_admin can delete users
      if (context.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      // Prevent deletion of own account
      if (context.userId === resolvedParams.id) {
        return createErrorResponse('VALIDATION_ERROR', 'Vous ne pouvez pas supprimer votre propre compte', 400);
      }

      await UserService.delete(resolvedParams.id, context.serviceContext);
      return createSuccessResponse(null, 'Utilisateur supprimé avec succès');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        if (error.message === 'Utilisateur non trouvé') {
          return createErrorResponse('NOT_FOUND', 'Utilisateur non trouvé', 404);
        }
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
