import { NextRequest } from 'next/server';
import { EmployeeService } from '@/services/Employee.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const employee = await EmployeeService.getById(resolvedParams.id);

      if (!employee) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(employee);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async (req) => {
    try {
      const body = await req.json();

      const employee = await EmployeeService.update(resolvedParams.id, body);

      if (!employee) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(employee, 'Employee updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return requireAuth(async () => {
    try {
      const deleted = await EmployeeService.delete(resolvedParams.id);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(null, 'Employee deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse('SERVER_ERROR', error.message, 500);
      }
      return createErrorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
    }
  })(request);
}
