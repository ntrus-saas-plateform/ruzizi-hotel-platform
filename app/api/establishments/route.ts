import { NextRequest, NextResponse } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import {
  CreateEstablishmentSchema,
  EstablishmentFilterSchema,
} from '@/lib/validations/establishment.validation';
import { requireAuth, requireSuperAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { parseRequestBody } from '@/lib/utils/request';
import { ZodError } from 'zod';

/**
 * GET /api/establishments
 * Get all establishments with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const filters = EstablishmentFilterSchema.parse({
        city: searchParams.get('city') || undefined,
        pricingMode: searchParams.get('pricingMode') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
        managerId: searchParams.get('managerId') || undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // If user is a manager, only show their establishment
      if (user.role === 'manager' && user.establishmentId) {
        filters.managerId = user.establishmentId;
      }

      const result = await EstablishmentService.getAll(filters, filters.page, filters.limit);

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
 * POST /api/establishments
 * Create a new establishment (Super Admin only)
 */
export async function POST(request: NextRequest) {
  return requireSuperAdmin(async (req) => {
    try {
      // Parse JSON body with error handling
      const body = await parseRequestBody(req);

      // Validate request body
      const validatedData = CreateEstablishmentSchema.parse(body);

      // Create establishment
      const establishment = await EstablishmentService.create(validatedData);

      return createSuccessResponse(establishment, 'Establishment created successfully', 201);
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
        console.error('Establishment creation error:', error);
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
