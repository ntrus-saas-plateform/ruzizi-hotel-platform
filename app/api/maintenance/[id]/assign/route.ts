import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { assignedTo } = await request.json();
    if (!assignedTo) {
      return NextResponse.json(
        { error: 'ID de l\'employé requis' },
        { status: 400 }
      );
    }

    const maintenance = await MaintenanceService.assign(resolvedParams.id, assignedTo);
    return NextResponse.json(maintenance);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
