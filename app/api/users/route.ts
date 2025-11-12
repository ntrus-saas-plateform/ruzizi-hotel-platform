import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/middleware';
import UserService from '@/services/User.service';

/**
 * GET /api/users
 * Get all users (Super Admin only)
 */
export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Récupérer tous les utilisateurs
    const allUsers = await UserService.getAll({ search });

    // Implémenter la pagination côté API
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const users = allUsers.slice(startIndex, endIndex);

    // Retourner avec métadonnées de pagination
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/users
 * Create a new user (Super Admin only)
 */
export const POST = withRole(['super_admin'], async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    const newUser = await UserService.create(data);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
});
