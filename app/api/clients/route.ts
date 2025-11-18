import { NextRequest } from 'next/server';
import { ClientService } from '@/services/Client.service';
import { ClientFilterSchema } from '@/lib/validations/client.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/clients
 * Get all clients with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
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

      const result = await ClientService.getAll(filters, filters.page, filters.limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid query parameters');
      }

      if (error instanceof Error) {
        return createErrorResponse('DATABASE_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
