import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const POST = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { backupPath } = await request.json();
    
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
});