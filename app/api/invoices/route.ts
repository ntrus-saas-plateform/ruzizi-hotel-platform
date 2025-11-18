import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import {
  CreateInvoiceSchema,
  InvoiceFilterSchema,
} from '@/lib/validations/invoice.validation';
import {
  withAuth,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/invoices
 * Get all invoices with filters and pagination
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);

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
    if (user.role === 'manager' && user.establishmentId) {
      filters.establishmentId = user.establishmentId;
    }

    const result = await InvoiceService.getAll(filters, filters.page, filters.limit);

    return createSuccessResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/invoices
 * Create a new invoice
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = CreateInvoiceSchema.parse(body);

    // Create invoice
    const invoice = await InvoiceService.create(validatedData);

    return createSuccessResponse(invoice);
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
});
