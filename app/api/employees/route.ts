import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/services/Employee.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';
import { z } from 'zod';

const CreateEmployeeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(['male', 'female', 'other']),
    nationality: z.string().min(1),
    idNumber: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    address: z.string().min(1),
  }),
  employmentInfo: z.object({
    position: z.string().min(1),
    department: z.string().min(1),
    establishmentId: z.string().min(1),
    hireDate: z.coerce.date(),
    contractType: z.enum(['permanent', 'temporary', 'contract']),
    salary: z.number().min(0),
    status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  }),
  documents: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        establishmentId: searchParams.get('establishmentId') || undefined,
        status: searchParams.get('status') || undefined,
        department: searchParams.get('department') || undefined,
        search: searchParams.get('search') || undefined,
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

      // Get employees with establishment context
      // The service context will automatically filter by establishment for non-admins
      const result = await EmployeeService.getAll(
        {
          establishmentId: requestedEstablishmentId,
          status: filters.status,
          department: filters.department,
          search: filters.search,
        },
        page,
        limit,
        context.serviceContext
      );

      return createSuccessResponse(result);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
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
      const validatedData = CreateEmployeeSchema.parse(body);

      // For non-admin users, enforce their establishment
      // For admin users, require an establishmentId to be specified
      let establishmentId: string;
      
      if (context.serviceContext.canAccessAll()) {
        // Admins must specify an establishment
        if (!validatedData.employmentInfo.establishmentId) {
          return createErrorResponse('VALIDATION_ERROR', 'Establishment ID is required', 400);
        }
        establishmentId = validatedData.employmentInfo.establishmentId;
      } else {
        // Non-admins: automatically use their establishment, ignore any provided value
        establishmentId = context.establishmentId!;
      }

      const employeeData = {
        ...validatedData,
        employmentInfo: {
          ...validatedData.employmentInfo,
          establishmentId,
        },
      };

      // Create employee via service with establishment context
      const employee = await EmployeeService.create(employeeData, context.serviceContext);

      return createSuccessResponse(employee, 'Employee created successfully', 201);
    } catch (error: any) {
      console.error('Error creating employee:', error);
      
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
