import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/Auth.service';
import { CreateUserSchema } from '@/lib/validations/user.validation';
import { ZodError } from 'zod';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateUserSchema.parse(body);

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
}
