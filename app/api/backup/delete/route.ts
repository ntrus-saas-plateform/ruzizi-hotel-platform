import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export async function DELETE(request: NextRequest) {
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

    const success = await BackupService.deleteBackup(backupPath);

    if (success) {
      return NextResponse.json({ message: 'Backup supprimé avec succès' });
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du backup' },
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
