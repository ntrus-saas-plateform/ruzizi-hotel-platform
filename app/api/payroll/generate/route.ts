import { NextRequest } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const { year, month, establishmentId } = body;

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      const payrolls = await PayrollService.generateForAllEmployees(year, month, establishmentId);

      return createSuccessResponse(
        { count: payrolls.length, payrolls },
        `Generated ${payrolls.length} payroll records`
      );
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
