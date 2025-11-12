import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/Auth.service';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Refresh token is required',
          },
        },
        { status: 400 }
      );
    }

    // Refresh tokens
    const tokens = await AuthService.refreshToken(refreshToken);

    return NextResponse.json(
      {
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const isTokenError = error.message.includes('Token') || error.message.includes('expired');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isTokenError ? 'INVALID_TOKEN' : 'SERVER_ERROR',
            message: error.message,
          },
        },
        { status: isTokenError ? 401 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
