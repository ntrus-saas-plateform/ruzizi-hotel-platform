import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/Client.service';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * GET /api/clients/[id]
 * Get client by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const client = await ClientService.getById(resolvedParams.id, context.serviceContext);

      if (!client) {
        return createErrorResponse('NOT_FOUND', 'Client not found', 404);
      }

      return createSuccessResponse(client);
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * PUT /api/clients/[id]
 * Update client by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();

      const client = await ClientService.update(resolvedParams.id, body, context.serviceContext);

      if (!client) {
        return createErrorResponse('NOT_FOUND', 'Client not found', 404);
      }

      return createSuccessResponse(client, 'Client updated successfully');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * DELETE /api/clients/[id]
 * Delete client by ID
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const success = await ClientService.delete(resolvedParams.id, context.serviceContext);

      if (!success) {
        return createErrorResponse('NOT_FOUND', 'Client not found', 404);
      }

      return createSuccessResponse({ success: true }, 'Client deleted successfully');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
