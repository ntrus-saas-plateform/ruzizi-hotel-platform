import { NextRequest } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * POST /api/bookings/[id]/confirm
 * Confirm booking
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  console.log('🔍 API Confirm - ID:', resolvedParams.id);
  
  return requireAuth(async (req, user) => {
    console.log('👤 User:', { id: (user as any).id, role: (user as any).role, establishmentId: (user as any).establishmentId });
    
    try {
      const booking = await BookingService.confirm(resolvedParams.id);
      console.log('📋 Booking après confirmation:', booking ? { id: booking.id, status: booking.status } : 'null');

      if (!booking) {
        console.error('❌ Booking not found');
        return createErrorResponse('NOT_FOUND', 'Booking not found', 404);
      }

      // Check if user has access to this booking
      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        booking.establishmentId !== (user as any).establishmentId
      ) {
        console.error('❌ Access denied - Manager trying to access another establishment');
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have access to this booking',
          403
        );
      }

      console.log('✅ Confirmation réussie');
      return createSuccessResponse(booking, 'Booking confirmed successfully');
    } catch (error) {
      console.error('💥 Error in confirm route:', error);
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
