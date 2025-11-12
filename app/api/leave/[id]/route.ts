import { NextRequest, NextResponse } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { z } from 'zod';

const UpdateLeaveSchema = z.object({
  type: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reason: z.string().min(1).optional(),
  attachments: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const leave = await LeaveService.getById(resolvedParams.id);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave);
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
      const validatedData = UpdateLeaveSchema.parse(body);

      const leave = await LeaveService.update(resolvedParams.id, validatedData);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave, 'Leave request updated successfully');
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
      const deleted = await LeaveService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(null, 'Leave request deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
