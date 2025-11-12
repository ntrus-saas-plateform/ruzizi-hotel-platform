import { NextRequest } from 'next/server';
import { ReportService } from '@/services/Report.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const establishmentId = searchParams.get('establishmentId');
      const year = searchParams.get('year');
      const month = searchParams.get('month');

      if (!establishmentId || !year || !month) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'establishmentId, year, and month are required',
          400
        );
      }

      const report = await ReportService.generateHRReport(
        establishmentId,
        parseInt(year),
        parseInt(month)
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
