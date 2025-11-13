import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le refresh token depuis les cookies
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: 'No refresh token provided' } },
        { status: 401 }
      );
    }

    // Vérifier le refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: { message: 'Invalid refresh token' } },
        { status: 401 }
      );
    }

    // Générer un nouveau access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      establishmentId: payload.establishmentId,
    });

    // Créer la réponse avec le nouveau token
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        establishmentId: payload.establishmentId,
      },
    });

    // Définir le nouveau access token dans les cookies
    response.cookies.set('auth-token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to refresh token' } },
      { status: 500 }
    );
  }
}
