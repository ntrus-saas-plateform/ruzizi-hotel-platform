import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return requireAuth(async (req, user) => {
    try {
      if (user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      const activatedUser = await UserService.activate(resolvedParams.id);
      return NextResponse.json(activatedUser);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Erreur serveur' },
        { status: 500 }
      );
    }
  })(request);
}
