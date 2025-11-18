import { NextRequest } from 'next/server';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Non autorisé', 401);
    }
    const user = authResult.user;

    const maintenance = await MaintenanceService.getById(resolvedParams.id);
    if (!maintenance) {
      return createErrorResponse('NOT_FOUND', 'Maintenance non trouvée', 404);
    }

    return createSuccessResponse(maintenance);
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Non autorisé', 401);
    }
    const user = authResult.user;

    if (user.role === 'staff') {
      return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
    }

    const data = await request.json();
    const maintenance = await MaintenanceService.update(resolvedParams.id, data);

    return createSuccessResponse(maintenance, 'Maintenance mise à jour avec succès');
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Non autorisé', 401);
    }
    const user = authResult.user;

    if (user.role !== 'super_admin') {
      return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
    }

    await MaintenanceService.delete(resolvedParams.id);
    return createSuccessResponse(null, 'Maintenance supprimée');
  } catch (error: any) {
    return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
  }
}
