import { NextRequest, NextResponse } from 'next/server';
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
});