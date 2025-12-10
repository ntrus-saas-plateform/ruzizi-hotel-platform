import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/Client.service';
import { ClientFilterSchema } from '@/lib/validations/client.validation';
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { ZodError } from 'zod';

/**
 * GET /api/clients
 * Get all clients with filters and pagination
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      // Validate query parameters
      const filters = ClientFilterSchema.parse({
        classification: searchParams.get('classification') || undefined,
        email: searchParams.get('email') || undefined,
        phone: searchParams.get('phone') || undefined,
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

      const result = await ClientService.getAll(
        {
          ...filters,
          establishmentId: requestedEstablishmentId,
        },
        filters.page,
        filters.limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
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
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();

      // For non-admin users, enforce their establishment
      // For admin users, require an establishmentId to be specified
      let establishmentId: string;
      
      if (context.serviceContext.canAccessAll()) {
        // Admins must specify an establishment
        if (!body.establishmentId) {
          return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
        }
        establishmentId = body.establishmentId;
      } else {
        // Non-admins: automatically use their establishment, ignore any provided value
        establishmentId = context.establishmentId!;
      }

      const clientData = {
        ...body,
        establishmentId,
      };

      const client = await ClientService.create(clientData, context.serviceContext);

      return createSuccessResponse(client, 'Client created successfully', 201);
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
