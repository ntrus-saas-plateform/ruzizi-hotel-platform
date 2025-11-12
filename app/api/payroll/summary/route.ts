import { NextRequest } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const year = searchParams.get('year');
      const month = searchParams.get('month');

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      const summary = await PayrollService.getSummary(parseInt(year), parseInt(month));

      return createSuccessResponse(summary);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
