import { NextRequest } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

/**
 * GET /api/public/bookings/by-code/[code]
 * Get booking by code (public access for tracking)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  try {
    const booking = await BookingService.getByCode(resolvedParams.code);

    if (!booking) {
      return createErrorResponse('NOT_FOUND', 'Booking not found', 404);
    }

    return createSuccessResponse(booking);
  } catch (error) {
    if (error instanceof Error) {
      return createErrorResponse('SERVER_ERROR', error.message, 500);
    }

    return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}
