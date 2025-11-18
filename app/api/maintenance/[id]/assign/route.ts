import { NextRequest } from 'next/server';
import { withRole, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export const POST = withRole(['manager', 'super_admin'], async (
  request: NextRequest,
  user
) => {
  // Extract params from the URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.indexOf('maintenance') + 1];
  try {

    const { assignedTo } = await request.json();
    if (!assignedTo) {
      return createErrorResponse('VALIDATION_ERROR', 'ID de l\'employé requis', 400);
    }

    const maintenance = await MaintenanceService.assign(id, assignedTo);
    return createSuccessResponse(maintenance, 'Maintenance assignée avec succès');
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
});
