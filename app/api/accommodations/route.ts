import { NextRequest } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import {
  CreateAccommodationSchema,
  AccommodationFilterSchema,
} from '@/lib/validations/accommodation.validation';
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * GET /api/accommodations
 * Get all accommodations with filters and pagination
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      // Validate query parameters
      const validationResult = AccommodationFilterSchema.safeParse({
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

      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid query parameters');
      }

      const filters = validationResult.data;

      // For admins, allow optional establishment filtering via query param
      const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
      if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
        // Non-admin users cannot request a different establishment
        if (requestedEstablishmentId !== context.establishmentId) {
          return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Access to this establishment denied', 403);
        }
      }

      // Get accommodations with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await AccommodationService.getAll(
        {
          establishmentId: requestedEstablishmentId,
          type: filters.type,
          status: filters.status,
          pricingMode: filters.pricingMode,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minGuests: filters.minGuests,
          search: filters.search,
        },
        filters.page,
        filters.limit,
        false,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching accommodations:', error);

      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * POST /api/accommodations
 * Create a new accommodation (Manager or Super Admin)
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = CreateAccommodationSchema.safeParse(body);
      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid accommodation data');
      }

      const validatedData = validationResult.data;

      // For non-admin users, enforce their establishment
      // For admin users, require an establishmentId to be specified
      let establishmentId: string;

      if (context.serviceContext.canAccessAll()) {
        // Admins must specify an establishment
        if (!validatedData.establishmentId) {
          return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
        }
        establishmentId = validatedData.establishmentId;
      } else {
        // Non-admins: automatically use their establishment, ignore any provided value
        establishmentId = context.establishmentId!;
      }

      const accommodationData = {
        ...validatedData,
        establishmentId,
      };

      // Create accommodation via service
      const accommodation = await AccommodationService.create(accommodationData, context.serviceContext);

      return createSuccessResponse(accommodation, 'Accommodation created successfully', 201);
    } catch (error: any) {
      console.error('Error creating accommodation:', error);

      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
