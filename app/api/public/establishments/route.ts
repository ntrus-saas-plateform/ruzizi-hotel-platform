import { NextRequest, NextResponse } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

/**
 * GET /api/public/establishments
 * Get all active establishments (public access)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get('city') || undefined;
    const pricingMode = searchParams.get('pricingMode') as 'nightly' | 'monthly' | undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Only show active establishments to public
    const filters = {
      city,
      pricingMode,
      search,
      isActive: true,
    };

    const result = await EstablishmentService.getAll(filters, page, limit);

    return createSuccessResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResponse('SERVER_ERROR', error.message, 500);
    }

    return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}
