import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const user = authResult.user;

    // Les utilisateurs peuvent voir leur propre profil
    // Les super_admin et manager peuvent voir tous les profils
    if (user.userId !== resolvedParams.id && user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const userData = await UserService.getById(resolvedParams.id);
    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const user = authResult.user;

    // Seuls les super_admin peuvent modifier les utilisateurs
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();
    const updatedUser = await UserService.update(resolvedParams.id, data);

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const user = authResult.user;

    // Seuls les super_admin peuvent supprimer des utilisateurs
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Empêcher la suppression de son propre compte
    if (user.userId === resolvedParams.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    await UserService.delete(resolvedParams.id);
    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
