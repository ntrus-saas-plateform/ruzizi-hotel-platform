import { NextRequest } from 'next/server';
import { ClientService } from '@/services/Client.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * GET /api/clients/[id]
 * Get client by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const client = await ClientService.getById(resolvedParams.id);

      if (!client) {
        return createErrorResponse('NOT_FOUND', 'Client not found', 404);
      }

      return createSuccessResponse(client);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
