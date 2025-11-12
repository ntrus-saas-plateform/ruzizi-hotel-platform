import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import PerformanceService from '@/services/Performance.service';

/**
 * GET /api/performance
 * Get all performance evaluations (Manager or Super Admin)
 */
export const GET = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const evaluatorId = searchParams.get('evaluatorId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (evaluatorId) filters.evaluatorId = evaluatorId;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const performances = await PerformanceService.getAll(filters);
    return NextResponse.json(performances);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/performance
 * Create a new performance evaluation (Manager or Super Admin)
 */
export const POST = withRole(['manager', 'super_admin'], async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    const performance = await PerformanceService.create({
      ...data,
      evaluatorId: user.userId,
    });

    return NextResponse.json(performance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});
