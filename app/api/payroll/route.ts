import { NextRequest, NextResponse } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
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
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        employeeId: searchParams.get('employeeId') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
        month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
        status: searchParams.get('status') || undefined,
      };

      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const result = await PayrollService.getAll(filters, page, limit);

      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req) => {
    try {
      const body = await req.json();
      const validatedData = CreatePayrollSchema.parse(body);

      const payroll = await PayrollService.create(validatedData);

      return createSuccessResponse(payroll, 'Payroll record created successfully', 201);
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
