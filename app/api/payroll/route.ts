import { NextRequest, NextResponse } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';
import { z } from 'zod';

const CreatePayrollSchema = z.object({
  employeeId: z.string().min(1),
  period: z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2000),
  }),
  baseSalary: z.number().min(0),
  allowances: z
    .array(
      z.object({
        type: z.string(),
        amount: z.number().min(0),
      })
    )
    .optional(),
  deductions: z
    .array(
      z.object({
        type: z.string(),
        amount: z.number().min(0),
      })
    )
    .optional(),
  bonuses: z
    .array(
      z.object({
        type: z.string(),
        amount: z.number().min(0),
      })
    )
    .optional(),
  overtimeHours: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        employeeId: searchParams.get('employeeId') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
        month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
        status: searchParams.get('status') || undefined,
      };

      // For admins, allow optional establishment filtering via query param
      const requestedEstablishmentId = searchParams.get('establishmentId') ?? undefined;
      if (requestedEstablishmentId && !context.serviceContext.canAccessAll()) {
        // Non-admin users cannot request a different establishment
        if (requestedEstablishmentId !== context.establishmentId) {
          return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', 'Access to this establishment denied', 403);
        }
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      // Get payroll records with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await PayrollService.getAll(
        {
          employeeId: filters.employeeId,
          establishmentId: requestedEstablishmentId,
          year: filters.year,
          month: filters.month,
          status: filters.status,
        },
        page,
        limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching payroll records:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = CreatePayrollSchema.parse(body);

      // Create payroll record via service with establishment context
      // The service will validate that the employee belongs to the user's establishment
      const payroll = await PayrollService.create(validatedData, context.serviceContext);

      return createSuccessResponse(payroll, 'Payroll record created successfully', 201);
    } catch (error: any) {
      console.error('Error creating payroll record:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      if (error instanceof EstablishmentNotFoundError) {
        return createErrorResponse('ESTABLISHMENT_NOT_FOUND', error.message, 404);
      }

      if (error instanceof z.ZodError) {
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

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
