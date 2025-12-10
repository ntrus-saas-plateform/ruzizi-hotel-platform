import { NextRequest, NextResponse } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import { UpdateEstablishmentSchema } from '@/lib/validations/establishment.validation';
import {
  requireSuperAdmin,
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { parseRequestBody } from '@/lib/utils/request';
import { ZodError } from 'zod';

/**
 * GET /api/establishments/[id]
 * Get establishment by ID
 * 
 * Special handling:
 * - Admins can access any establishment
 * - Managers/staff can only access their own establishment
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Ignore "new" route (used for create page)
      if (resolvedParams.id === 'new' || resolvedParams.id === 'create') {
        return createErrorResponse('BAD_REQUEST', 'Invalid establishment ID', 400);
      }
      
      // Get establishment with context for access validation
      const establishment = await EstablishmentService.getById(
        resolvedParams.id,
        context.serviceContext
      );

      if (!establishment) {
        return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
      }

      return createSuccessResponse(establishment);
    } catch (error) {
      console.error('Establishment GET error:', error);

      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  }, { requireEstablishment: false })(request); // Don't require establishment - admins need to access any
}

/**
 * PUT /api/establishments/[id]
 * Update establishment (Super Admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireSuperAdmin(async (req) => {
    try {
      // Ignore "new" route
      if (resolvedParams.id === 'new' || resolvedParams.id === 'create') {
        return createErrorResponse('BAD_REQUEST', 'Invalid establishment ID', 400);
      }
      
      // Parse JSON body with error handling
      const body = await parseRequestBody(req);

      // Validate request body
      const validationResult = UpdateEstablishmentSchema.safeParse(body);
      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid input data');
      }

      const validatedData = validationResult.data;

      // Update establishment (no context needed - super admin only)
      const establishment = await EstablishmentService.update(resolvedParams.id, validatedData);

      if (!establishment) {
        return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
      }

      return createSuccessResponse(establishment, 'Establishment updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid input data');
      }

      if (error instanceof Error) {
        console.error('Establishment update error:', error);
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * DELETE /api/establishments/[id]
 * Delete establishment (Super Admin only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireSuperAdmin(async () => {
    try {
      // Ignore "new" route
      if (resolvedParams.id === 'new' || resolvedParams.id === 'create') {
        return createErrorResponse('BAD_REQUEST', 'Invalid establishment ID', 400);
      }
      
      // Delete establishment (no context needed - super admin only)
      const deleted = await EstablishmentService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
      }

      return createSuccessResponse(null, 'Establishment deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
