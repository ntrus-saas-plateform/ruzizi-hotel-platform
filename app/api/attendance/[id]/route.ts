import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';
import { z } from 'zod';
import { AttendanceService } from '@/services/Attendance.service';

const UpdateAttendanceSchema = z.object({
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional(),
    breakStart: z.coerce.date().optional(),
    breakEnd: z.coerce.date().optional(),
    status: z.enum(['present', 'absent', 'late', 'half_day', 'overtime']).optional(),
    notes: z.string().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const attendance = await AttendanceService.getById(resolvedParams.id, context.serviceContext);

            if (!attendance) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(attendance);
        } catch (error: any) {
            console.error('Error fetching attendance record:', error);
            
            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const body = await req.json();
            const validatedData = UpdateAttendanceSchema.parse(body);

            const attendance = await AttendanceService.update(resolvedParams.id, validatedData, context.serviceContext);

            if (!attendance) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(attendance, 'Attendance record updated successfully');
        } catch (error: any) {
            console.error('Error updating attendance record:', error);
            
            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }
            
            if (error instanceof EstablishmentNotFoundError) {
                return createErrorResponse('ESTABLISHMENT_NOT_FOUND', error.message, 404);
            }

            if (error instanceof z.ZodError) {
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

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    return withEstablishmentIsolation(async (req, context) => {
        try {
            const deleted = await AttendanceService.delete(resolvedParams.id, context.serviceContext);

            if (!deleted) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(null, 'Attendance record deleted successfully');
        } catch (error: any) {
            console.error('Error deleting attendance record:', error);
            
            if (error instanceof EstablishmentAccessDeniedError) {
                return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
            }

            return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
        }
    })(request);
}
