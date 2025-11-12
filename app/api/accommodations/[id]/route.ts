import { NextRequest, NextResponse } from 'next/server';
import { AccommodationService } from '@/services/Accommodation.service';
import { UpdateAccommodationSchema } from '@/lib/validations/accommodation.validation';
import {
    requireAuth,
    requireManager,
    createErrorResponse,
    createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/accommodations/[id]
 * Get accommodation by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return requireAuth(async (req, user) => {
        try {
            const { id } = await params;
            const accommodation = await AccommodationService.getById(id);

            if (!accommodation) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            // Check if user has access to this accommodation
            if (
                user.role === 'manager' &&
                user.establishmentId &&
                accommodation.establishmentId !== user.establishmentId
            ) {
                return createErrorResponse(
                    'FORBIDDEN',
                    'You do not have access to this accommodation',
                    403
                );
            }

            return createSuccessResponse(accommodation);
        } catch (error) {
            if (error instanceof Error) {
                return createErrorResponse('SERVER_ERROR', error.message, 500);
            }

            return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
        }
    })(request);
}

/**
 * PUT /api/accommodations/[id]
 * Update accommodation (Manager or Super Admin)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return requireManager(async (req, user) => {
        try {
            const { id } = await params;
            // Check if accommodation exists and user has access
            const existing = await AccommodationService.getById(id);

            if (!existing) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            if (
                user.role === 'manager' &&
                user.establishmentId &&
                existing.establishmentId !== user.establishmentId
            ) {
                return createErrorResponse(
                    'FORBIDDEN',
                    'You do not have access to this accommodation',
                    403
                );
            }

            const body = await req.json();

            // Validate request body
            const validatedData = UpdateAccommodationSchema.parse(body);

            // Update accommodation
            const accommodation = await AccommodationService.update(id, validatedData);

            if (!accommodation) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            return createSuccessResponse(accommodation, 'Accommodation updated successfully');
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

/**
 * DELETE /api/accommodations/[id]
 * Delete accommodation (Manager or Super Admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return requireManager(async (req, user) => {
        try {
            const { id } = await params;
            // Check if accommodation exists and user has access
            const existing = await AccommodationService.getById(id);

            if (!existing) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            if (
                user.role === 'manager' &&
                user.establishmentId &&
                existing.establishmentId !== user.establishmentId
            ) {
                return createErrorResponse(
                    'FORBIDDEN',
                    'You do not have access to this accommodation',
                    403
                );
            }

            const deleted = await AccommodationService.delete(id);

            if (!deleted) {
                return createErrorResponse('NOT_FOUND', 'Accommodation not found', 404);
            }

            return createSuccessResponse(null, 'Accommodation deleted successfully');
        } catch (error) {
            if (error instanceof Error) {
                return createErrorResponse('SERVER_ERROR', error.message, 500);
            }

            return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
        }
    })(request);
}
