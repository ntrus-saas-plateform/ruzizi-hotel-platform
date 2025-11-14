import { NextRequest, NextResponse } from 'next/server';
import { EstablishmentService } from '@/services/Establishment.service';
import { UpdateEstablishmentSchema } from '@/lib/validations/establishment.validation';
import {
  requireAuth,
  requireSuperAdmin,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { parseRequestBody } from '@/lib/utils/request';
import { ZodError } from 'zod';

/**
 * GET /api/establishments/[id]
 * Get establishment by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const establishment = await EstablishmentService.getById(resolvedParams.id);

      if (!establishment) {
        return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
      }

      // Check if user has access to this establishment
      if (
        user.role === 'manager' &&
        user.establishmentId &&
        establishment.id !== user.establishmentId
      ) {
        return createErrorResponse(
          'FORBIDDEN',
          'You do not have access to this establishment',
          403
        );
      }

      return createSuccessResponse(establishment);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * PUT /api/establishments/[id]
 * Update establishment (Super Admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireSuperAdmin(async (req) => {
    try {
      // Parse JSON body with error handling
      const body = await parseRequestBody(req);

      // Validate request body
      const validatedData = UpdateEstablishmentSchema.parse(body);

      // Update establishment
      const establishment = await EstablishmentService.update(resolvedParams.id, validatedData);

      if (!establishment) {
        return createErrorResponse('NOT_FOUND', 'Establishment not found', 404);
      }

      return createSuccessResponse(establishment, 'Establishment updated successfully');
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
