import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { z } from 'zod';
import AttendanceService from '@/services/Attendance.service';

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
    return requireAuth(async () => {
        try {
            const attendance = await AttendanceService.getById(resolvedParams.id);

            if (!attendance) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(attendance);
        } catch (error) {
            if (error instanceof Error) {
                return createErrorResponse('SERVER_ERROR', error.message, 500);
            }
            return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
        }
    })(request);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    return requireAuth(async (req) => {
        try {
            const body = await req.json();
            const validatedData = UpdateAttendanceSchema.parse(body);

            const attendance = await AttendanceService.update(resolvedParams.id, validatedData);

            if (!attendance) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(attendance, 'Attendance record updated successfully');
        } catch (error) {
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

            if (error instanceof Error) {
                return createErrorResponse('SERVER_ERROR', error.message, 500);
            }

            return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
        }
    })(request);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    return requireAuth(async () => {
        try {
            const deleted = await AttendanceService.delete(resolvedParams.id);

            if (!deleted) {
                return createErrorResponse('NOT_FOUND', 'Attendance record not found', 404);
            }

            return createSuccessResponse(null, 'Attendance record deleted successfully');
        } catch (error) {
            if (error instanceof Error) {
                return createErrorResponse('SERVER_ERROR', error.message, 500);
            }
            return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
        }
    })(request);
}
