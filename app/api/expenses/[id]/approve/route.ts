import { NextRequest } from 'next/server';
import { ExpenseService } from '@/services/Expense.service';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';

/**
 * POST /api/expenses/[id]/approve
 * Approve expense
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const existing = await ExpenseService.getById(resolvedParams.id);

      if (!existing) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        existing.establishmentId !== (user as any).establishmentId
      ) {
        return createErrorResponse('FORBIDDEN', 'You do not have access to this expense', 403);
      }

      const expense = await ExpenseService.approve(resolvedParams.id, {
        approvedBy: (user as any).id,
      });

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(expense, 'Expense approved successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
