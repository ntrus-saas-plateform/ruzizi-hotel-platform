import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import AttendanceService from '@/services/Attendance.service';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get('employeeId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!employeeId || !startDate || !endDate) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'employeeId, startDate, and endDate are required',
          400
        );
      }

      const summary = await AttendanceService.getSummary(
        employeeId,
        new Date(startDate),
        new Date(endDate)
      );

      return createSuccessResponse(summary);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
