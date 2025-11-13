import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/Auth.service';
import { LoginSchema } from '@/lib/validations/user.validation';
import { ZodError } from 'zod';

/**
 * POST /api/auth/login
 * Login user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API Login - Requête reçue');
    
    const body = await request.json();
    console.log('📦 Body reçu:', { email: body.email, hasPassword: !!body.password });

    // Validate request body
    const validatedData = LoginSchema.parse(body);
    console.log('✅ Validation réussie');

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
    // Validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

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
}
