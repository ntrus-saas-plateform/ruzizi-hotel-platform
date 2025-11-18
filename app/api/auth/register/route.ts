import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/Auth.service';
import { CreateUserSchema } from '@/lib/validations/user.validation';
import { withValidation } from '@/lib/security/validation-middleware';

/**
 * POST /api/auth/register
 * Register a new user
 */
export const POST = withValidation(CreateUserSchema, async (request: NextRequest, validatedData) => {
  try {
    // Register user
    const result = await AuthService.register(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (error) {
    // Duplicate email error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: error.message,
          },
        },
        { status: 409 }
      );
    }

    // Other errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
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
