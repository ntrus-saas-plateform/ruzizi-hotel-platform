import { NextRequest } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import { UpdateAccommodationSchema } from '@/lib/validations/accommodation.validation';
import {
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';

/**
 * GET /api/accommodations/[id]
 * Get accommodation by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const { id } = await params;

            // Ignore "new" route (used for create page)
            if (id === 'new') {
                return createErrorResponse('BAD_REQUEST', 'Invalid accommodation ID', 400);
            }

            // Get accommodation with establishment context validation
            const accommodation = await AccommodationService.getById(id, context.serviceContext);

            if (!accommodation) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            return createSuccessResponse(accommodation);
        } catch (error: any) {
            console.error('Error fetching accommodation:', error);

            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}

/**
 * PUT /api/accommodations/[id]
 * Update accommodation (Manager or Super Admin)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const { id } = await params;

            // Ignore "new" route
            if (id === 'new') {
                return createErrorResponse('BAD_REQUEST', 'Invalid accommodation ID', 400);
            }

            const body = await req.json();

            // Validate request body
            const validationResult = UpdateAccommodationSchema.safeParse(body);
            if (!validationResult.success) {
                return createValidationErrorResponse(validationResult.error, 'Invalid accommodation data');
            }

            const validatedData = validationResult.data;

            // Update accommodation with establishment context validation
            // The service will validate access automatically
            const accommodation = await AccommodationService.update(id, validatedData, context.serviceContext);

            if (!accommodation) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            return createSuccessResponse(accommodation, 'Accommodation updated successfully');
        } catch (error: any) {
            console.error('Error updating accommodation:', error);

            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}

/**
 * DELETE /api/accommodations/[id]
 * Delete accommodation (Manager or Super Admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const { id } = await params;

            // Ignore "new" route
            if (id === 'new') {
                return createErrorResponse('BAD_REQUEST', 'Invalid accommodation ID', 400);
            }

            // Delete accommodation with establishment context validation
            // The service will validate access automatically
            const deleted = await AccommodationService.delete(id, context.serviceContext);

            if (!deleted) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            return createSuccessResponse(null, 'Accommodation deleted successfully');
        } catch (error: any) {
            console.error('Error deleting accommodation:', error);

            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}
