import { NextRequest, NextResponse } from 'next/server';
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
});