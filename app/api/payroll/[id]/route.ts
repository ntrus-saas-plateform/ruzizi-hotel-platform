import { NextRequest, NextResponse } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
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
  return requireAuth(async () => {
    try {
      const payroll = await PayrollService.getById(resolvedParams.id);

      if (!payroll) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(payroll);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const validatedData = UpdatePayrollSchema.parse(body);

      const payroll = await PayrollService.update(resolvedParams.id, validatedData);

      if (!payroll) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(payroll, 'Payroll record updated successfully');
    } catch (error) {
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

      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }

      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const deleted = await PayrollService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Payroll record not found', 404);
      }

      return createSuccessResponse(null, 'Payroll record deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
