import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
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
      return NextResponse.json(
        { error: 'ID de l\'employé requis' },
        { status: 400 }
      );
    }

    const maintenance = await MaintenanceService.assign(id, assignedTo);
    return NextResponse.json(maintenance);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});
