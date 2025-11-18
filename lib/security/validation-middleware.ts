import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeObject } from './sanitize';

/**
 * Validation middleware for API routes
 * Sanitizes and validates request data
 */
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  handler: (request: NextRequest, validatedData: z.infer<T>) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get request body
      let body: unknown;

      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: 'Request body must be valid JSON',
            },
          },
          { status: 400 }
        );
      }

      // Sanitize input data
      const sanitizedData = sanitizeObject(body as Record<string, any>);

      // Validate with Zod schema
      const validatedData = schema.parse(sanitizedData);

      // Call the handler with validated data
      return handler(request, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Input validation failed',
              details: error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      console.error('Validation middleware error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
          },
        },
        { status: 400 }
      );
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function withQueryValidation<T extends z.ZodSchema>(
  schema: T,
  handler: (request: NextRequest, validatedQuery: z.infer<T>) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get query parameters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());

      // Sanitize query parameters
      const sanitizedQuery = sanitizeObject(queryParams);

      // Validate with Zod schema
      const validatedQuery = schema.parse(sanitizedQuery);

      // Call the handler with validated query
      return handler(request, validatedQuery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Query parameter validation failed',
              details: error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      console.error('Query validation middleware error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
          },
        },
        { status: 400 }
      );
    }
  };
}

/**
 * Combined validation middleware for both body and query
 */
export function withFullValidation<
  TBody extends z.ZodSchema,
  TQuery extends z.ZodSchema
>(
  bodySchema: TBody,
  querySchema: TQuery,
  handler: (
    request: NextRequest,
    validatedData: { body: z.infer<TBody>; query: z.infer<TQuery> }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Validate body
      let body: unknown;
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: 'Request body must be valid JSON',
            },
          },
          { status: 400 }
        );
      }

      const sanitizedBody = sanitizeObject(body as Record<string, any>);
      const validatedBody = bodySchema.parse(sanitizedBody);

      // Validate query
      const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
      const sanitizedQuery = sanitizeObject(queryParams);
      const validatedQuery = querySchema.parse(sanitizedQuery);

      // Call the handler with validated data
      return handler(request, { body: validatedBody, query: validatedQuery });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Input validation failed',
              details: error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      console.error('Full validation middleware error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
          },
        },
        { status: 400 }
      );
    }
  };
}