import { NextRequest, NextResponse } from 'next/server';
import { LeaveService } from '@/services/Leave.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError, CrossEstablishmentRelationshipError } from '@/lib/errors/establishment-errors';
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
  return withEstablishmentIsolation(async (req, context) => {
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

      // Get leave requests with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await LeaveService.getAll(
        {
          employeeId: filters.employeeId,
          establishmentId: requestedEstablishmentId,
          type: filters.type,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        page,
        limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      
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
      const validatedData = CreateLeaveSchema.parse(body);

      // Create leave request via service with establishment context
      // The service will validate that the employee belongs to the user's establishment
      const leave = await LeaveService.create(validatedData, context.serviceContext);

      return createSuccessResponse(leave, 'Leave request created successfully', 201);
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }
      
      if (error instanceof EstablishmentNotFoundError) {
        return createErrorResponse('ESTABLISHMENT_NOT_FOUND', error.message, 404);
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
