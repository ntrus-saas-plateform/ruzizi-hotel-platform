/**
 * Base class for establishment-related errors
 */
export abstract class EstablishmentError extends Error {
  abstract statusCode: number;
  abstract code: string;
  details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Error thrown when a user attempts to access a resource from a different establishment
 * HTTP Status: 403 Forbidden
 */
export class EstablishmentAccessDeniedError extends EstablishmentError {
  statusCode = 403;
  code = 'ESTABLISHMENT_ACCESS_DENIED';

  constructor(details: {
    userId?: string;
    resourceType: string;
    resourceId: string;
    userEstablishmentId?: string;
    resourceEstablishmentId: string;
  }) {
    super('Access denied: Resource belongs to a different establishment', details);
  }
}

/**
 * Error thrown when a specified establishment does not exist
 * HTTP Status: 404 Not Found
 */
export class EstablishmentNotFoundError extends EstablishmentError {
  statusCode = 404;
  code = 'ESTABLISHMENT_NOT_FOUND';

  constructor(establishmentId: string) {
    super('Establishment not found', { establishmentId });
  }
}

/**
 * Error thrown when attempting to create a relationship between resources from different establishments
 * HTTP Status: 400 Bad Request
 */
export class CrossEstablishmentRelationshipError extends EstablishmentError {
  statusCode = 400;
  code = 'CROSS_ESTABLISHMENT_RELATIONSHIP';

  constructor(details: {
    parentResource: { type: string; id: string; establishmentId: string };
    childResource: { type: string; id: string; establishmentId: string };
  }) {
    super(
      'Cannot create relationship between resources from different establishments',
      {
        parentResource: details.parentResource,
        childResource: details.childResource,
        establishments: {
          parent: details.parentResource.establishmentId,
          child: details.childResource.establishmentId,
        },
      }
    );
  }
}

/**
 * Error thrown when establishment context is required but not provided
 * HTTP Status: 500 Internal Server Error
 */
export class MissingEstablishmentContextError extends EstablishmentError {
  statusCode = 500;
  code = 'MISSING_ESTABLISHMENT_CONTEXT';

  constructor(details: {
    userId?: string;
    operation: string;
  }) {
    super('Internal error: Establishment context required but not provided', details);
  }
}

/**
 * Format an establishment error into a NextResponse
 * Note: This function requires Next.js server environment
 */
export function formatErrorResponse(error: EstablishmentError) {
  // Dynamically import NextResponse to avoid issues in test environment
  const { NextResponse } = require('next/server');
  return NextResponse.json(error.toJSON(), { status: error.statusCode });
}

/**
 * Check if an error is an establishment error
 */
export function isEstablishmentError(error: any): error is EstablishmentError {
  return error instanceof EstablishmentError;
}
