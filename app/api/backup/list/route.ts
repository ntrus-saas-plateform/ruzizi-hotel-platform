import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const outputDir = searchParams.get('outputDir') || undefined;
    
    const backups = await BackupService.listBackups(outputDir);
    return NextResponse.json(backups);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});