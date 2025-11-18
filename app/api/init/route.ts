import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { autoInitRootUser } from '@/lib/init/autoInit';
import { BookingService } from '@/services/Booking.service';
import { ValidationCache } from '@/lib/validations';

export async function GET() {
  try {
    console.log('🚀 Starting application initialization...');

    // Initialize root user
    await autoInitRootUser();

    // Preload booking codes
    await BookingService.preloadBookingCodes();

    // Preload validation schemas
    await ValidationCache.preloadSchemas();

    console.log('✅ Application initialization complete');
    return createSuccessResponse({
      preloaded: ['booking_codes', 'validation_schemas']
    }, 'Initialization complete');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    return createErrorResponse('INITIALIZATION_ERROR', 'Initialization failed', 500);
  }
}
