import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services/Attendance.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';
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
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        employeeId: searchParams.get('employeeId') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
        dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      };

      // For admins, allow optional establishment filtering via query param
      const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
      if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
        // Non-admin users cannot request a different establishment
        if (requestedEstablishmentId !== context.establishmentId) {
          return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Access to this establishment denied', 403);
        }
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      // Get attendance records with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await AttendanceService.getAll(
        {
          employeeId: filters.employeeId,
          establishmentId: requestedEstablishmentId,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        page,
        limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching attendance records:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = CreateAttendanceSchema.parse(body);

      // Create attendance record via service with establishment context
      // The service will validate that the employee belongs to the user's establishment
      const attendance = await AttendanceService.create(validatedData, context.serviceContext);

      return createSuccessResponse(attendance, 'Attendance record created successfully', 201);
    } catch (error: any) {
      console.error('Error creating attendance record:', error);
      
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
