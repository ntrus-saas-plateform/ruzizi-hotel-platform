import { NextRequest } from 'next/server';
import { AnalyticsService } from '@/services/Analytics.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const establishmentId = searchParams.get('establishmentId');
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      if (!startDateStr || !endDateStr) {
        return createErrorResponse('VALIDATION_ERROR', 'Start and end dates are required', 400);
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (!establishmentId) {
        return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
      }

      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        if (establishmentId !== (user as any).establishmentId) {
          return createErrorResponse('FORBIDDEN', 'Access denied', 403);
        }
      }

      const summary = await AnalyticsService.getFinancialSummary(
        establishmentId,
        startDate,
        endDate
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
