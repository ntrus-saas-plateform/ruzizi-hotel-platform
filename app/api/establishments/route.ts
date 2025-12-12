import { NextRequest, NextResponse } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import {
  CreateEstablishmentSchema,
  EstablishmentFilterSchema,
} from '@/lib/validations/establishment.validation';
import { requireSuperAdmin, createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { parseRequestBody } from '@/lib/utils/request';
import { ZodError } from 'zod';

/**
 * GET /api/establishments
 * Get all establishments with filters and pagination
 * 
 * Special handling:
 * - Admins can see all establishments (no automatic filtering)
 * - Managers/staff can only see their own establishment
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      // Validate query parameters
      const validationResult = EstablishmentFilterSchema.safeParse({
        city: searchParams.get('city') || undefined,
        pricingMode: searchParams.get('pricingMode') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
        managerId: searchParams.get('managerId') || undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '100'), // Increased limit for dropdown
      });

      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid query parameters');
      }

      const filters = validationResult.data;

      // Get establishments with establishment context
      // The service will automatically filter for non-admin users
      const result = await EstablishmentService.getAll(
        filters,
        filters.page,
        filters.limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error) {
      console.error('Establishments API error:', error);

      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof ZodError) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  }, { requireEstablishment: false })(request); // Don't require establishment for GET - admins need to see all
}

/**
 * POST /api/establishments
 * Create a new establishment (Super Admin only)
 */
export async function POST(request: NextRequest) {
  return requireSuperAdmin(async (req) => {
    try {
      console.log('🏨 Creating new establishment...');
      
      // Parse JSON body with error handling
      const body = await parseRequestBody(req);
      console.log('📝 Request body:', JSON.stringify(body, null, 2));

      // Validate request body
      const validationResult = CreateEstablishmentSchema.safeParse(body);
      if (!validationResult.success) {
        console.log('❌ Validation failed:', validationResult.error.issues);
        return createValidationErrorResponse(validationResult.error, 'Invalid input data');
      }

      const validatedData = validationResult.data;

      // Create establishment (no context needed - super admin only)
      const establishment = await EstablishmentService.create(validatedData);

      return createSuccessResponse(establishment, 'Establishment created successfully', 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid input data');
      }

      if (error instanceof Error) {
        console.error('Establishment creation error:', error);
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
