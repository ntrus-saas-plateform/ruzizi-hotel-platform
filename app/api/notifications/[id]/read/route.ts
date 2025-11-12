import { NextRequest } from 'next/server';
import { NotificationService } from '@/services/Notification.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const notification = await NotificationService.markAsRead(resolvedParams.id);

      if (!notification) {
        return createErrorResponse('NOT_FOUND', 'Notification not found', 404);
      }

      return createSuccessResponse(notification);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
