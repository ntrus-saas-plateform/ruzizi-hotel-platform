import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import HRAnalyticsService from '@/services/HRAnalytics.service';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const months = parseInt(searchParams.get('months') || '6');

    const analysis = await HRAnalyticsService.getSalaryCostAnalysis(
      establishmentId || undefined,
      months
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
