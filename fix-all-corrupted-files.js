const fs = require('fs');

// Templates pour différents types de fichiers
const templates = {
  backup: {
    create: `import { NextRequest, NextResponse } from 'next/server';
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
});`,
    
    delete: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const DELETE = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { backupPath } = await request.json();
    
    const result = await BackupService.deleteBackup(backupPath);
    
    if (result.success) {
      return NextResponse.json({ message: 'Backup supprimé avec succès' });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la suppression du backup' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`,
    
    list: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import BackupService from '@/services/Backup.service';

export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const backups = await BackupService.listBackups();
    return NextResponse.json(backups);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`,
    
    restore: `import { NextRequest, NextResponse } from 'next/server';
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
});`
  },
  
  hr: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import HRAnalyticsService from '@/services/HRAnalytics.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (establishmentId) filters.establishmentId = establishmentId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const analytics = await HRAnalyticsService.getAnalytics(filters);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`,
  
  maintenance: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import MaintenanceService from '@/services/Maintenance.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;

    const maintenances = await MaintenanceService.getAll(filters);
    return NextResponse.json(maintenances);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`,
  
  performanceCriteria: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import PerformanceService from '@/services/Performance.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const criteria = PerformanceService.getDefaultCriteria();
    return NextResponse.json(criteria);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`,
  
  performanceStats: `import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import PerformanceService from '@/services/Performance.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const period = searchParams.get('period') || 'month';

    const stats = await PerformanceService.getStats({
      establishmentId,
      period
    });
    
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});`
};

// Mapping des fichiers vers leurs templates
const fileMapping = {
  './app/api/backup/create/route.ts': templates.backup.create,
  './app/api/backup/delete/route.ts': templates.backup.delete,
  './app/api/backup/list/route.ts': templates.backup.list,
  './app/api/backup/restore/route.ts': templates.backup.restore,
  './app/api/hr/analytics/kpis/route.ts': templates.hr,
  './app/api/hr/analytics/report/route.ts': templates.hr,
  './app/api/hr/analytics/salary-cost/route.ts': templates.hr,
  './app/api/hr/analytics/turnover/route.ts': templates.hr,
  './app/api/maintenance/route.ts': templates.maintenance,
  './app/api/performance/criteria/route.ts': templates.performanceCriteria,
  './app/api/performance/stats/route.ts': templates.performanceStats
};

console.log('🔧 Rewriting corrupted files with clean templates...');

Object.entries(fileMapping).forEach(([filePath, template]) => {
  try {
    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✅ Rewrote: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error rewriting ${filePath}:`, error.message);
  }
});

console.log('✅ Done!');