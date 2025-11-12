import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import AuditService from '@/services/Audit.service';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les super_admin et manager peuvent voir les logs d'audit
    if (user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const filters: any = { limit, skip };
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entity) filters.entity = entity;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await AuditService.getAllLogs(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
