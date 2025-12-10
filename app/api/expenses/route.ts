import { NextRequest, NextResponse } from 'next/server';
import { ExpenseService } from '@/services/Expense.service';
import {
  CreateExpenseSchema,
  ExpenseFilterSchema,
} from '@/lib/validations/expense.validation';
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';
import { ZodError } from 'zod';

/**
 * GET /api/expenses
 * Get all expenses with filters and pagination
 */
export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      // Validate query parameters
      const validationResult = ExpenseFilterSchema.safeParse({
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

      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid query parameters');
      }

      const filters = validationResult.data;

      // For admins, allow optional establishment filtering via query param
      const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
      if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
        // Non-admin users cannot request a different establishment
        if (requestedEstablishmentId !== context.establishmentId) {
          return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Access to this establishment denied', 403);
        }
      }

      // Get expenses with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await ExpenseService.getAll(
        {
          establishmentId: requestedEstablishmentId,
          category: filters.category,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search: filters.search,
        },
        filters.page,
        filters.limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof ZodError) {
        return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = CreateExpenseSchema.safeParse({
        ...body,
        createdBy: context.userId,
      });

      if (!validationResult.success) {
        return createValidationErrorResponse(validationResult.error, 'Invalid expense data');
      }

      const validatedData = validationResult.data;

      // For non-admin users, enforce their establishment
      // For admin users, require an establishmentId to be specified
      let establishmentId: string;
      
      if (context.serviceContext.canAccessAll()) {
        // Admins must specify an establishment
        if (!validatedData.establishmentId) {
          return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
        }
        establishmentId = validatedData.establishmentId;
      } else {
        // Non-admins: automatically use their establishment, ignore any provided value
        establishmentId = context.establishmentId!;
      }

      const expenseData = {
        ...validatedData,
        establishmentId,
        createdBy: context.userId,
      };

      // Create expense via service with establishment context
      const expense = await ExpenseService.create(expenseData, context.serviceContext);

      return createSuccessResponse(expense, 'Expense created successfully', 201);
    } catch (error: any) {
      console.error('Error creating expense:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      if (error instanceof EstablishmentNotFoundError) {
        return createErrorResponse('ESTABLISHMENT_NOT_FOUND', error.message, 404);
      }

      if (error instanceof ZodError) {
        return createValidationErrorResponse(error, 'Invalid input data');
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
