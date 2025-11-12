import { NextRequest, NextResponse } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import {
  CreateAccommodationSchema,
  AccommodationFilterSchema,
} from '@/lib/validations/accommodation.validation';
import {
  requireAuth,
  requireManager,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/accommodations
 * Get all accommodations with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const filters = AccommodationFilterSchema.parse({
        establishmentId: searchParams.get('establishmentId') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        pricingMode: searchParams.get('pricingMode') || undefined,
        minPrice: searchParams.get('minPrice')
          ? parseFloat(searchParams.get('minPrice')!)
          : undefined,
        maxPrice: searchParams.get('maxPrice')
          ? parseFloat(searchParams.get('maxPrice')!)
          : undefined,
        minGuests: searchParams.get('minGuests')
          ? parseInt(searchParams.get('minGuests')!)
          : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // If user is a manager, only show their establishment's accommodations
      if (user.role === 'manager' && user.establishmentId) {
        filters.establishmentId = user.establishmentId;
      }

      const result = await AccommodationService.getAll(filters, filters.page, filters.limit);

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
 * POST /api/accommodations
 * Create a new accommodation (Manager or Super Admin)
 */
export async function POST(request: NextRequest) {
  return requireManager(async (req, user) => {
    try {
      const body = await req.json();

      // Validate request body
      const validatedData = CreateAccommodationSchema.parse(body);

      // If user is a manager, ensure they're creating for their establishment
      if (user.role === 'manager' && user.establishmentId) {
        if (validatedData.establishmentId !== user.establishmentId) {
          return createErrorResponse(
            'FORBIDDEN',
            'You can only create accommodations for your establishment',
            403
          );
        }
      }

      // Create accommodation
      const accommodation = await AccommodationService.create(validatedData);

      return createSuccessResponse(accommodation, 'Accommodation created successfully', 201);
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
