import { NextRequest } from 'next/server';
import { NotificationService } from '@/services/Notification.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const notifications = await NotificationService.getByUser((user as any).id);
      const unreadCount = await NotificationService.getUnreadCount((user as any).id);

      return createSuccessResponse({ notifications, unreadCount });
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
