import { NextRequest } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * POST /api/invoices/from-booking/[bookingId]
 * Create invoice from booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const invoice = await InvoiceService.createFromBooking(resolvedParams.bookingId);

      return createSuccessResponse(invoice, 'Invoice created successfully', 201);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * GET /api/invoices/from-booking/[bookingId]
 * Get invoice by booking ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const invoice = await InvoiceService.getByBookingId(resolvedParams.bookingId);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(invoice);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
