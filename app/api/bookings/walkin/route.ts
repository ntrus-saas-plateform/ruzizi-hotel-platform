import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/Booking.service';
import { CreateBookingSchema } from '@/lib/validations/booking.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * POST /api/bookings/walkin
 * Create a walk-in booking
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await req.json();

      // Validate request body
      const validatedData = CreateBookingSchema.omit({ bookingType: true }).parse(body);

      // Create walk-in booking
      const booking = await BookingService.createWalkInBooking({
        ...validatedData,
        createdBy: (user as any).id,
      });

      return createSuccessResponse(booking, 'Walk-in booking created successfully', 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
