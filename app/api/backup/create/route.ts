import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const POST = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const result = await BackupService.createBackup();
    
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
});