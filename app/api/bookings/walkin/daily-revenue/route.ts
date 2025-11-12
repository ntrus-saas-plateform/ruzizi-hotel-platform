import { NextRequest } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * GET /api/bookings/walkin/daily-revenue
 * Get daily revenue for walk-in bookings
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const accommodationId = searchParams.get('accommodationId');
      const dateStr = searchParams.get('date');

      if (!accommodationId) {
        return createErrorResponse('VALIDATION_ERROR', 'Accommodation ID is required', 400);
      }

      if (!dateStr) {
        return createErrorResponse('VALIDATION_ERROR', 'Date is required', 400);
      }

      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid date format', 400);
      }

      const revenue = await BookingService.calculateDailyWalkInRevenue(accommodationId, date);

      return createSuccessResponse({ revenue, date: dateStr, accommodationId });
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
