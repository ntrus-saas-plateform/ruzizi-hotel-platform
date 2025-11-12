import { NextRequest } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const payroll = await PayrollService.markAsPaid(resolvedParams.id);

      if (!payroll) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(payroll, 'Payroll marked as paid successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
