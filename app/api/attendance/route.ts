import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services/Attendance.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { z } from 'zod';

const CreateAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  breakStart: z.coerce.date().optional(),
  breakEnd: z.coerce.date().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'overtime']),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        employeeId: searchParams.get('employeeId') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
        dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      };

      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const result = await AttendanceService.getAll(filters, page, limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const validatedData = CreateAttendanceSchema.parse(body);

      const attendance = await AttendanceService.create(validatedData);

      return createSuccessResponse(attendance, 'Attendance record created successfully', 201);
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
