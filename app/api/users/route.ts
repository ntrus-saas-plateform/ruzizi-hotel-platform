import { NextRequest } from 'next/server';
import { withRole, createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';
import { UserFilterSchema } from '@/lib/validations/user.validation';
import { ZodError } from 'zod';

/**
 * GET /api/users
 * Get all users with establishment filtering
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Validate query parameters
      const filters = UserFilterSchema.parse({
        role: searchParams.get('role') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true :
                  searchParams.get('isActive') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // Appliquer le filtre d'établissement selon le rôle utilisateur
      const establishmentFilters = applyEstablishmentFilter(user, filters);

      // Récupérer tous les utilisateurs avec pagination et filtrage
      const result = await UserService.getAll(establishmentFilters);

      // Retourner avec métadonnées de pagination
      return createSuccessResponse({
        users: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid query parameters');
      }

      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
    }
  })(request);
}

/**
  * POST /api/users
  * Create a new user (Super Admin only)
  */
export const POST = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const data = await request.json();

    // Validate establishmentId if provided
    if (data.establishmentId && data.establishmentId !== '') {
      // Ensure establishmentId is a valid ObjectId string
      if (typeof data.establishmentId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(data.establishmentId)) {
        return createErrorResponse('VALIDATION_ERROR', 'establishmentId doit être un ObjectId valide', 400);
      }
    } else {
      // Remove establishmentId if empty string
      delete data.establishmentId;
    }

    const newUser = await UserService.create(data);

    return createSuccessResponse(newUser, 'Utilisateur créé avec succès', 201);
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
});
