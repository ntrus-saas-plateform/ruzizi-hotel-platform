import { NextRequest } from 'next/server';
import { ReportService } from '@/services/Report.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const establishmentIds = searchParams.get('establishmentIds');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!establishmentIds || !startDate || !endDate) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'establishmentIds, startDate, and endDate are required',
          400
        );
      }

      const ids = establishmentIds.split(',');

      const report = await ReportService.generateComparisonReport(
        ids,
        new Date(startDate),
        new Date(endDate)
      );

      return createSuccessResponse(report);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
