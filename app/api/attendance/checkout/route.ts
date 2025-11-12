import { NextRequest } from 'next/server';
import { AttendanceService } from '@/services/Attendance.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const { employeeId, checkOutTime } = body;

      if (!employeeId) {
        return createErrorResponse('VALIDATION_ERROR', 'Employee ID is required', 400);
      }

      const attendance = await AttendanceService.checkOut(
        employeeId,
        checkOutTime ? new Date(checkOutTime) : undefined
      );

      if (!attendance) {
        return createErrorResponse('NOT_FOUND', 'No check-in record found for today', 404);
      }

      return createSuccessResponse(attendance, 'Check-out recorded successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
