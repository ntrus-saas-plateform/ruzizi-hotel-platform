import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import PerformanceService from '@/services/Performance.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const stats = await PerformanceService.getStats({
      employeeId: employeeId || undefined,
      startDate,
      endDate
    });
    
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});