import { NextRequest, NextResponse } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError, CrossEstablishmentRelationshipError } from '@/lib/errors/establishment-errors';
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
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const leave = await LeaveService.getById(resolvedParams.id, context.serviceContext);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave);
    } catch (error: any) {
      console.error('Error fetching leave request:', error);
      
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
      const validatedData = UpdateLeaveSchema.parse(body);

      const leave = await LeaveService.update(resolvedParams.id, validatedData, context.serviceContext);

      if (!leave) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(leave, 'Leave request updated successfully');
    } catch (error: any) {
      console.error('Error updating leave request:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      if (error instanceof CrossEstablishmentRelationshipError) {
        return createErrorResponse('CROSS_ESTABLISHMENT_RELATIONSHIP', error.message, 400);
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
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const deleted = await LeaveService.delete(resolvedParams.id, context.serviceContext);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Leave request not found', 404);
      }

      return createSuccessResponse(null, 'Leave request deleted successfully');
    } catch (error: any) {
      console.error('Error deleting leave request:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
