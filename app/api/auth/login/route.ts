import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/Auth.service';
import { LoginSchema } from '@/lib/validations/user.validation';
import { withValidation } from '@/lib/security/validation-middleware';

/**
 * POST /api/auth/login
 * Login user with email and password
 */
export const POST = withValidation(LoginSchema, async (request: NextRequest, validatedData) => {
  try {
    console.log('🔐 API Login - Requête reçue');
    console.log('📦 Body validé:', { email: validatedData.email, hasPassword: !!validatedData.password });

    // Login user
    const result = await AuthService.login(validatedData);
    console.log('✅ Authentification réussie:', {
      userId: result.user.id,
      email: result.user.email,
      hasTokens: !!result.tokens
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erreur dans API Login:', error);

    // Authentication error
    if (error instanceof Error) {
      const isAuthError =
        error.message.includes('Invalid email or password') ||
        error.message.includes('deactivated');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isAuthError ? 'AUTH_FAILED' : 'SERVER_ERROR',
            message: error.message,
          },
        },
        { status: isAuthError ? 401 : 500 }
      );
    }

    // Unknown error
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
});
