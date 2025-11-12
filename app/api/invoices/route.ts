import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import {
  CreateInvoiceSchema,
  InvoiceFilterSchema,
} from '@/lib/validations/invoice.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/invoices
 * Get all invoices with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const filters = InvoiceFilterSchema.parse({
        establishmentId: searchParams.get('establishmentId') || undefined,
        status: searchParams.get('status') || undefined,
        issuedFrom: searchParams.get('issuedFrom')
          ? new Date(searchParams.get('issuedFrom')!)
          : undefined,
        issuedTo: searchParams.get('issuedTo')
          ? new Date(searchParams.get('issuedTo')!)
          : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // If user is a manager, only show their establishment's invoices
      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const result = await InvoiceService.getAll(filters, filters.page, filters.limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();

      // Validate request body
      const validatedData = CreateInvoiceSchema.parse(body);

      // Create invoice
      const invoice = await InvoiceService.create(validatedData);

      return createSuccessResponse(invoice, 'Invoice created successfully', 201);
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
