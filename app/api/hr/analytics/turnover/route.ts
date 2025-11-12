import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import HRAnalyticsService from '@/services/HRAnalytics.service';

export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const months = parseInt(searchParams.get('months') || '12');

    const analytics = await HRAnalyticsService.getTurnoverAnalysis(establishmentId || undefined, months);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});