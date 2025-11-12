import { NextRequest, NextResponse } from 'next/server';
import { ExpenseService } from '@/services/Expense.service';
import { UpdateExpenseSchema } from '@/lib/validations/expense.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/expenses/[id]
 * Get expense by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      const expense = await ExpenseService.getById(resolvedParams.id);

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      if (
        (user as any).role === 'manager' &&
        (user as any).establishmentId &&
        expense.establishmentId !== (user as any).establishmentId
      ) {
        return createErrorResponse('FORBIDDEN', 'You do not have access to this expense', 403);
      }

      return createSuccessResponse(expense);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * PUT /api/expenses/[id]
 * Update expense
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

      const body = await req.json();
      const validatedData = UpdateExpenseSchema.parse(body);

      const expense = await ExpenseService.update(resolvedParams.id, validatedData);

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(expense, 'Expense updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * DELETE /api/expenses/[id]
 * Delete expense
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

      const deleted = await ExpenseService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(null, 'Expense deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
