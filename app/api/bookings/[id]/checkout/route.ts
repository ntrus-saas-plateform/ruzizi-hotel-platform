import { NextRequest } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * POST /api/bookings/[id]/checkout
 * Complete booking (check-out)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const booking = await BookingService.complete(resolvedParams.id);

      if (!booking) {
        return createErrorResponse('NOT_FOUND', 'Booking not found', 404);
      }

      // Check if user has access to this booking
      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        booking.establishmentId !== (user as any).establishmentId
      ) {
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have access to this booking',
          403
        );
      }

      return createSuccessResponse(booking, 'Booking completed successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
