import { NextRequest, NextResponse } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError } from '@/lib/errors/establishment-errors';
import { z } from 'zod';

const UpdatePayrollSchema = z.object({
  baseSalary: z.number().min(0).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (_, context) => {
    try {
      const payroll = await PayrollService.getById(resolvedParams.id, context.serviceContext);

      if (!payroll) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(payroll);
    } catch (error: any) {
      console.error('Error fetching payroll record:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = UpdatePayrollSchema.parse(body);

      const payroll = await PayrollService.update(resolvedParams.id, validatedData, context.serviceContext);

      if (!payroll) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(payroll, 'Payroll record updated successfully');
    } catch (error: any) {
      console.error('Error updating payroll record:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (_, context) => {
    try {
      const deleted = await PayrollService.delete(resolvedParams.id, context.serviceContext);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(null, 'Payroll record deleted successfully');
    } catch (error: any) {
      console.error('Error deleting payroll record:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
