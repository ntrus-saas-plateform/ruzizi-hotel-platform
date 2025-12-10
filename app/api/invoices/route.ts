import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/services/Invoice.service';
import {
  CreateInvoiceSchema,
  InvoiceFilterSchema,
} from '@/lib/validations/invoice.validation';
import {
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import { 
  EstablishmentAccessDeniedError,
  CrossEstablishmentRelationshipError 
} from '@/lib/errors/establishment-errors';
import { ZodError } from 'zod';

/**
 * GET /api/invoices
 * Get all invoices with filters and pagination
 */
export const GET = withEstablishmentIsolation(async (request: NextRequest, context) => {
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

    // Validate establishment access if filter is provided
    if (filters.establishmentId && !context.serviceContext.canAccessAll()) {
      if (filters.establishmentId !== context.establishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.userId,
          resourceType: 'invoice',
          resourceId: 'list',
          userEstablishmentId: context.establishmentId,
          resourceEstablishmentId: filters.establishmentId
        });
      }
    }

    const result = await InvoiceService.getAll(filters, filters.page, filters.limit, context.serviceContext);

    return createSuccessResponse(result);
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
export const POST = withEstablishmentIsolation(async (request: NextRequest, context) => {
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

    // For non-admin users, enforce their establishment
    if (!context.serviceContext.canAccessAll()) {
      validatedData.establishmentId = context.establishmentId!;
    } else if (!validatedData.establishmentId) {
      // Admin must provide establishmentId
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'establishmentId is required for administrators',
          },
        },
        { status: 400 }
      );
    }

    // Create invoice
    const invoice = await InvoiceService.create(validatedData, context.serviceContext);

    return createSuccessResponse(invoice, undefined, 201);
  } catch (error) {
    if (error instanceof CrossEstablishmentRelationshipError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CROSS_ESTABLISHMENT_RELATIONSHIP',
            message: error.message,
            details: error.details,
          },
        },
        { status: 400 }
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
