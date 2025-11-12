import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const accommodationId = searchParams.get('accommodationId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const filters: any = {};
    if (establishmentId) filters.establishmentId = establishmentId;
    if (accommodationId) filters.accommodationId = accommodationId;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const maintenances = await MaintenanceService.getAll(filters);
    return NextResponse.json(maintenances);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();
    const maintenance = await MaintenanceService.create({
      ...data,
      reportedBy: user.userId,
    });

    return NextResponse.json(maintenance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
