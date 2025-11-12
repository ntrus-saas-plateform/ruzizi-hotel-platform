import { NextRequest } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get('employeeId');
      const year = searchParams.get('year');

      if (!employeeId) {
        return createErrorResponse('VALIDATION_ERROR', 'Employee ID is required', 400);
      }

      const balance = await LeaveService.getBalance(
        employeeId,
        year ? parseInt(year) : new Date().getFullYear()
      );

      return createSuccessResponse(balance);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
