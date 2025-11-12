import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les super_admin peuvent créer des backups
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { compress, collections } = await request.json();

    const result = await BackupService.createBackup({
      compress: compress !== false, // Par défaut true
      collections,
    });

    if (result.success) {
      return NextResponse.json({
        message: 'Backup créé avec succès',
        filePath: result.filePath,
        size: result.size,
        duration: result.duration,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la création du backup' },
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
