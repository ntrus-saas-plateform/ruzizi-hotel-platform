import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les super_admin et manager peuvent voir les utilisateurs
    if (user.role === 'staff') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const establishmentId = searchParams.get('establishmentId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const filters: any = {};
    if (role) filters.role = role;
    if (establishmentId) filters.establishmentId = establishmentId;
    if (isActive) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const users = await UserService.getAll(filters);
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les super_admin peuvent créer des utilisateurs
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();
    const newUser = await UserService.create(data);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
