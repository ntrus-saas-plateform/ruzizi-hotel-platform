import { NextRequest, NextResponse } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { z } from 'zod';

const CreateLeaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        employeeId: searchParams.get('employeeId') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      };

      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const result = await LeaveService.getAll(filters, page, limit);

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
      const validatedData = CreateLeaveSchema.parse(body);

      const leave = await LeaveService.create(validatedData);

      return createSuccessResponse(leave, 'Leave request created successfully', 201);
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
