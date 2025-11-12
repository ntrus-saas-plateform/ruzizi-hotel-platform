import { NextRequest } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

/**
 * GET /api/public/establishments/[id]
 * Get establishment by ID (public access)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const establishment = await EstablishmentService.getById(resolvedParams.id);

    if (!establishment) {
      return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
    }

    // Only show active establishments to public
    if (!establishment.isActive) {
      return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
    }

    return createSuccessResponse(establishment);
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResponse('SERVER_ERROR', error.message, 500);
    }

    return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}
