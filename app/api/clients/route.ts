import { NextRequest } from 'next/server';
import { ClientService } from '@/services/Client.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * GET /api/clients
 * Get all clients with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        classification: searchParams.get('classification') || undefined,
        search: searchParams.get('search') || undefined,
      };

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const result = await ClientService.getAll(filters, page, limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
