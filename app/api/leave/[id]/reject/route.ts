import { NextRequest } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { reason } = body;

      if (!reason) {
        return createErrorResponse('VALIDATION_ERROR', 'Rejection reason is required', 400);
      }

      const leave = await LeaveService.reject(resolvedParams.id, (user as any).id, reason);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave, 'Leave request rejected successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
