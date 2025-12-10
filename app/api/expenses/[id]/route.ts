import { NextRequest, NextResponse } from 'next/server';
import { ExpenseService } from '@/services/Expense.service';
import { UpdateExpenseSchema } from '@/lib/validations/expense.validation';
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { ZodError } from 'zod';

/**
 * GET /api/expenses/[id]
 * Get expense by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Get expense with establishment context validation
      const expense = await ExpenseService.getById(resolvedParams.id, context.serviceContext);

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(expense);
    } catch (error: any) {
      console.error('Error fetching expense:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * PUT /api/expenses/[id]
 * Update expense
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validationResult = UpdateExpenseSchema.safeParse(body);
      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid expense data');
      }

      const validatedData = validationResult.data;

      // Update expense with establishment context validation
      const expense = await ExpenseService.update(resolvedParams.id, validatedData, context.serviceContext);

      if (!expense) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(expense, 'Expense updated successfully');
    } catch (error: any) {
      console.error('Error updating expense:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid input data');
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * DELETE /api/expenses/[id]
 * Delete expense
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      // Delete expense with establishment context validation
      const deleted = await ExpenseService.delete(resolvedParams.id, context.serviceContext);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Expense not found', 404);
      }

      return createSuccessResponse(null, 'Expense deleted successfully');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
