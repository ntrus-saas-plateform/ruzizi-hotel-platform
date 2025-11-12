import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const stats = await UserService.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});
