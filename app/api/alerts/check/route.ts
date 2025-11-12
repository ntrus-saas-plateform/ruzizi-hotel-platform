import { NextRequest } from 'next/server';
import { AlertService } from '@/services/Alert.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      // Seuls les super_admin peuvent déclencher les vérifications
      if ((user as any).role !== 'super_admin') {
        return createErrorResponse('FORBIDDEN', 'Access denied', 403);
      }

      const results = await AlertService.runAllChecks();

      return createSuccessResponse(results, 'Alert checks completed successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
