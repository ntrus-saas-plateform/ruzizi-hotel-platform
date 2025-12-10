import { NextRequest } from 'next/server';
import { EmployeeService } from '@/services/Employee.service';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import { withEstablishmentIsolation } from '@/lib/auth/establishment-isolation.middleware';
import { EstablishmentAccessDeniedError, EstablishmentNotFoundError } from '@/lib/errors/establishment-errors';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const employee = await EmployeeService.getById(resolvedParams.id, context.serviceContext);

      if (!employee) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(employee);
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const body = await req.json();

      const employee = await EmployeeService.update(resolvedParams.id, body, context.serviceContext);

      if (!employee) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(employee, 'Employee updated successfully');
    } catch (error: any) {
      console.error('Error updating employee:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withEstablishmentIsolation(async (req, context) => {
    try {
      const deleted = await EmployeeService.delete(resolvedParams.id, context.serviceContext);

      if (!deleted) {
        return createErrorResponse('NOT_FOUND', 'Employee not found', 404);
      }

      return createSuccessResponse(null, 'Employee deleted successfully');
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      
      if (error instanceof EstablishmentAccessDeniedError) {
        return createErrorResponse('ESTABLISHMENT_ACCESS_DENIED', error.message, 403);
      }

      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
