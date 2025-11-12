import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import { UpdateInvoiceSchema } from '@/lib/validations/invoice.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/invoices/[id]
 * Get invoice by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const invoice = await InvoiceService.getById(resolvedParams.id);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      // Check if user has access to this invoice
      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        invoice.establishmentId !== (user as any).establishmentId
      ) {
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have access to this invoice',
          403
        );
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

/**
 * PUT /api/invoices/[id]
 * Update invoice
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      const validatedData = UpdateInvoiceSchema.parse(body);

      // Update invoice
      const invoice = await InvoiceService.update(resolvedParams.id, validatedData);

      if (!invoice) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(invoice, 'Invoice updated successfully');
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

/**
 * DELETE /api/invoices/[id]
 * Delete invoice
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

      const deleted = await InvoiceService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Invoice not found', 404);
      }

      return createSuccessResponse(null, 'Invoice deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
