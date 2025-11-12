import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Empêcher la désactivation de son propre compte
    if (user.userId === resolvedParams.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas désactiver votre propre compte' },
        { status: 400 }
      );
    }

    const deactivatedUser = await UserService.deactivate(resolvedParams.id);
    return NextResponse.json(deactivatedUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
