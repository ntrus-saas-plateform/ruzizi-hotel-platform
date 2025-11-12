import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const DELETE = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { backupPath } = await request.json();
    
    const result = await BackupService.deleteBackup(backupPath);
    
    if (result) {
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
});