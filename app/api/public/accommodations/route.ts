import { NextRequest } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

/**
 * GET /api/public/accommodations
 * Get all available accommodations (public access)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const establishmentId = searchParams.get('establishmentId') || undefined;
    const type = searchParams.get('type') as any;
    const pricingMode = searchParams.get('pricingMode') as any;
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined;
    const minGuests = searchParams.get('minGuests')
      ? parseInt(searchParams.get('minGuests')!)
      : undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Only show available accommodations to public
    const filters = {
      establishmentId,
      type,
      pricingMode,
      minPrice,
      maxPrice,
      minGuests,
      search,
      status: 'available' as const,
    };

    const result = await AccommodationService.getAll(filters, page, limit);

    return createSuccessResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResponse('SERVER_ERROR', error.message, 500);
    }

    return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}
