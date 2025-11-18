import { NextResponse } from 'next/server';
import { blacklistToken } from '@/lib/auth/token-blacklist';

export async function POST(request: Request) {
  try {
    console.log('🚪 Logout request received');

    // Get the access token from Authorization header
    const authHeader = request.headers.get('authorization');
    let accessToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
      console.log('📋 Access token found in Authorization header');
    }

    // Get the refresh token from cookies or body
    const cookies = request.headers.get('cookie') || '';
    const refreshTokenCookie = cookies.split(';').find(c => c.trim().startsWith('refresh-token='));

    let refreshToken: string | null = null;

    if (refreshTokenCookie) {
      refreshToken = refreshTokenCookie.split('=')[1];
      console.log('🍪 Refresh token found in cookies');
    } else {
      // Try to get from request body
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
        if (refreshToken) {
          console.log('📋 Refresh token found in request body');
        }
      } catch {
        // Body might not be JSON
        console.log('📋 No refresh token in request body');
      }
    }

    // Blacklist both tokens if provided
    if (accessToken) {
      blacklistToken(accessToken);
      console.log('🚫 Access token blacklisted on logout');
    } else {
      console.log('⚠️ No access token to blacklist');
    }

    if (refreshToken) {
      blacklistToken(refreshToken);
      console.log('🚫 Refresh token blacklisted on logout');
    } else {
      console.log('⚠️ No refresh token to blacklist');
    }

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Supprimer les cookies d'authentification
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to logout' }
      },
      { status: 500 }
    );
  }
}
