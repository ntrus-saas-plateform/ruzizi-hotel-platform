import { NextRequest } from 'next/server';
import { withRole, createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';
import { UserFilterSchema } from '@/lib/validations/user.validation';
import { ZodError } from 'zod';

/**
 * GET /api/users
 * Get all users (Super Admin only)
 */
export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const filters = UserFilterSchema.parse({
      role: searchParams.get('role') || undefined,
      establishmentId: searchParams.get('establishmentId') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    });

    // Récupérer tous les utilisateurs avec pagination
    const result = await UserService.getAll(filters);

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
});

/**
 * POST /api/users
 * Create a new user (Super Admin only)
 */
export const POST = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    const newUser = await UserService.create(data);

    return createSuccessResponse(newUser, 'Utilisateur créé avec succès', 201);
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
});
