import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import { UpdateInvoiceSchema } from '@/lib/validations/invoice.validation';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { ZodError } from 'zod';

/**
 * GET /api/invoices/[id]
 * Get invoice by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return withEstablishmentIsolation(async (req: NextRequest, context) => {
    try {
      // Create service context
      const serviceContext = new EstablishmentServiceContext(
        context.userId,
        context.role,
        context.establishmentId
      );

      const invoice = await InvoiceService.getById(resolvedParams.id, serviceContext);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(invoice);
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ESTABLISHMENT_ACCESS_DENIED',
              message: error.message,
              details: error.details,
            },
          },
          { status: 403 }
        );
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * PUT /api/invoices/[id]
 * Update invoice
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return withEstablishmentIsolation(async (req: NextRequest, context) => {
    try {
      // Create service context
      const serviceContext = new EstablishmentServiceContext(
        context.userId,
        context.role,
        context.establishmentId
      );

      const body = await req.json();

      // Validate request body
      const validatedData = UpdateInvoiceSchema.parse(body);

      // Update invoice
      const invoice = await InvoiceService.update(resolvedParams.id, validatedData, serviceContext);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(invoice, 'Invoice updated successfully');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ESTABLISHMENT_ACCESS_DENIED',
              message: error.message,
              details: error.details,
            },
          },
          { status: 403 }
        );
      }

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

/**
 * DELETE /api/invoices/[id]
 * Delete invoice
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return withEstablishmentIsolation(async (req: NextRequest, context) => {
    try {
      // Create service context
      const serviceContext = new EstablishmentServiceContext(
        context.userId,
        context.role,
        context.establishmentId
      );

      const deleted = await InvoiceService.delete(resolvedParams.id, serviceContext);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(null, 'Invoice deleted successfully');
    } catch (error) {
      if (error instanceof EstablishmentAccessDeniedError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ESTABLISHMENT_ACCESS_DENIED',
              message: error.message,
              details: error.details,
            },
          },
          { status: 403 }
        );
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
