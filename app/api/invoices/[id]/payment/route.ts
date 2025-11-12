import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import { AddPaymentSchema } from '@/lib/validations/invoice.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * POST /api/invoices/[id]/payment
 * Add payment to invoice
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      // Check if invoice exists and user has access
      const existing = await InvoiceService.getById(resolvedParams.id);

      if (!existing) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        existing.establishmentId !== (user as any).establishmentId
      ) {
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have access to this invoice',
          403
        );
      }

      const body = await req.json();

      // Validate request body
      const validatedData = AddPaymentSchema.parse({
        ...body,
        receivedBy: (user as any).id,
      });

      // Add payment
      const invoice = await InvoiceService.addPayment(resolvedParams.id, validatedData);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(invoice, 'Payment added successfully');
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
