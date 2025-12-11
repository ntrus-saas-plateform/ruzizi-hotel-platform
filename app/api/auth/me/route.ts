import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Vérifier le token
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: { message: 'Invalid token' } },
        { status: 401 }
      );
    }

    // Retourner les informations de l'utilisateur depuis le JWT
    // Pour l'instant, on utilise les données du token pour éviter les problèmes de DB
    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        userId: payload.userId, // Ajouter userId pour compatibilité
        email: payload.email,
        role: payload.role,
        establishmentId: payload.establishmentId,
        firstName: 'Admin', // Valeur temporaire
        lastName: 'User', // Valeur temporaire
        permissions: [], // Sera déterminé par le rôle
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
