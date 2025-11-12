import { NextRequest } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const leaves = await LeaveService.getPending();

      return createSuccessResponse(leaves);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
