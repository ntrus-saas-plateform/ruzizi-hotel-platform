import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { backupPath } = await request.json();

    if (!backupPath) {
      return NextResponse.json(
        { error: 'Chemin du backup requis' },
        { status: 400 }
      );
    }

    const result = await BackupService.restoreBackup(backupPath);

    if (result.success) {
      return NextResponse.json({
        message: 'Backup restauré avec succès',
        duration: result.duration,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la restauration du backup' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
