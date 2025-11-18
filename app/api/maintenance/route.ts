import { NextRequest } from 'next/server';
import { withRole, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const maintenances = await MaintenanceService.getAll(filters);
    return createSuccessResponse(maintenances);
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
});