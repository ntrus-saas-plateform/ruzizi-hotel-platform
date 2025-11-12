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
      const leave = await LeaveService.approve(resolvedParams.id, (user as any).id);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave, 'Leave request approved successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
