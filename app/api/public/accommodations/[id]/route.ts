import { NextRequest } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

/**
 * GET /api/public/accommodations/[id]
 * Get accommodation by ID (public access)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const accommodation = await AccommodationService.getById(resolvedParams.id);

    if (!accommodation) {
      return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
    }

    // Only show available accommodations to public
    if (accommodation.status !== 'available') {
      return createErrorResponse('NOT_FOUND', 'Accommodation not available', 404);
    }

    return createSuccessResponse(accommodation);
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResponse('SERVER_ERROR', error.message, 500);
    }

    return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}
