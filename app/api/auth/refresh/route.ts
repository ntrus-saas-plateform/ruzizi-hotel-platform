import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokens } from '@/lib/auth/jwt';
import { AuthService } from '@/services/Auth.service';
import { isTokenBlacklisted } from '@/lib/auth/token-blacklist';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Token refresh request received');

    const body = await request.json();
    const refreshToken = body.refreshToken || request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      console.log('❌ No refresh token provided');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'No refresh token provided'
          }
        },
        { status: 401 }
      );
    }

    console.log('🔍 Checking if refresh token is blacklisted...');

    // Check if token is blacklisted
    if (isTokenBlacklisted(refreshToken)) {
      console.log('🚫 Refresh token is blacklisted');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_BLACKLISTED',
            message: 'Refresh token has been invalidated'
          }
        },
        { status: 401 }
      );
    }

    console.log('✅ Refresh token not blacklisted, proceeding with refresh');

    // Utiliser le service d'authentification pour rafraîchir le token
    const tokens = await AuthService.refreshToken(refreshToken);

    // Récupérer les informations de l'utilisateur
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token' 
          } 
        },
        { status: 401 }
      );
    }

    // Créer la réponse avec les nouveaux tokens
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        user: {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          establishmentId: payload.establishmentId,
        },
      },
    });

    // Définir les tokens dans les cookies (optionnel, pour compatibilité)
    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false,
          error: { 
            code: 'REFRESH_FAILED',
            message: error.message 
          } 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to refresh token' 
        } 
      },
      { status: 500 }
    );
  }
}
