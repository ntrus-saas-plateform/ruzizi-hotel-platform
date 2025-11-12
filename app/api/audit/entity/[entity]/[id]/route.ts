import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import AuditService from '@/services/Audit.service';
import { AuditEntity } from '@/types/audit.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
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

    const logs = await AuditService.getEntityLogs(
      resolvedParams.entity as AuditEntity,
      resolvedParams.id
    );

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
