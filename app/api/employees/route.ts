import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/services/Employee.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
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
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters: any = {
        establishmentId: searchParams.get('establishmentId') || undefined,
        status: searchParams.get('status') || undefined,
        department: searchParams.get('department') || undefined,
        search: searchParams.get('search') || undefined,
      };

      if ((user as any).role === 'manager' && (user as any).establishmentId) {
        filters.establishmentId = (user as any).establishmentId;
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const result = await EmployeeService.getAll(filters, page, limit);

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
      const validatedData = CreateEmployeeSchema.parse(body);

      const employee = await EmployeeService.create(validatedData);

      return createSuccessResponse(employee, 'Employee created successfully', 201);
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
