import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import UserService from '@/services/User.service';
import { UserFilterSchema } from '@/lib/validations/user.validation';
import { ZodError } from 'zod';

/**
 * GET /api/users
 * Get all users with establishment filtering
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
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

      // For admins, allow optional establishment filtering via query param
      const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
      if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
        // Non-admin users cannot request a different establishment
        if (requestedEstablishmentId !== context.establishmentId) {
          return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Access to this establishment denied', 403);
        }
      }

      // Get all users with establishment context
      const result = await UserService.getAll(
        {
          ...filters,
          establishmentId: requestedEstablishmentId,
        },
        context.serviceContext
      );

      // Return with pagination metadata
      return createSuccessResponse({
        users: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid query parameters');
      }

      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * POST /api/users
 * Create a new user (Super Admin only)
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Only super_admin can create users
      if (context.role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
      }

      const data = await req.json();

      // For non-admin users, enforce their establishment
      // For admin users, require an establishmentId to be specified for non-admin user creation
      let establishmentId: string | undefined;
      
      if (context.serviceContext.canAccessAll()) {
        // Admins can create users for any establishment, but must specify one for non-admin users
        if (data.role !== 'super_admin' && data.role !== 'root') {
          if (!data.establishmentId) {
            return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required for non-admin users', 400);
          }
          // Validate establishmentId format
          if (typeof data.establishmentId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(data.establishmentId)) {
            return createErrorResponse('VALIDATION_ERROR', 'establishmentId doit être un ObjectId valide', 400);
          }
        }
        establishmentId = data.establishmentId;
      } else {
        // Non-admins: automatically use their establishment, ignore any provided value
        establishmentId = context.establishmentId;
      }

      const userData = {
        ...data,
        establishmentId,
      };

      const newUser = await UserService.create(userData, context.serviceContext);

      return createSuccessResponse(newUser, 'Utilisateur créé avec succès', 201);
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
