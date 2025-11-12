import { NextRequest, NextResponse } from 'next/server';
import { ExpenseService } from '@/services/Expense.service';
import {
  CreateExpenseSchema,
  ExpenseFilterSchema,
} from '@/lib/validations/expense.validation';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth/middleware';
import { ZodError } from 'zod';

/**
 * GET /api/expenses
 * Get all expenses with filters and pagination
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters = ExpenseFilterSchema.parse({
        establishmentId: searchParams.get('establishmentId') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom')
          ? new Date(searchParams.get('dateFrom')!)
          : undefined,
        dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // If user is a manager, only show their establishment's expenses
      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const result = await ExpenseService.getAll(filters, filters.page, filters.limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400);
      }

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await req.json();

      const validatedData = CreateExpenseSchema.parse({
        ...body,
        createdBy: (user as any).id,
      });

      const expense = await ExpenseService.create(validatedData);

      return createSuccessResponse(expense, 'Expense created successfully', 201);
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
