import { NextRequest } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

// Approve all pending payroll records for a given period (year + month)
export async function POST(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const body = await request.json();
      const { year, month } = body as {
        year?: number;
        month?: number;
      };

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      const payrolls = await PayrollService.approvePeriod(year, month);

      return createSuccessResponse(
        {
          count: payrolls.length,
          payrolls,
        },
        `Payroll period ${month}/${year} approved for ${payrolls.length} records`
      );
    } catch (error: any) {
      console.error('💥 Error in payroll period approve API:', error);
      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
