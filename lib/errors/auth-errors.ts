/**
 * Authentication-specific error classes with enhanced error handling
 * Provides specific error types for different authentication failure scenarios
 */

/**
 * Base class for authentication-related errors
 */
export abstract class AuthError extends Error {
  abstract code: string;
  abstract statusCode: number;
  details?: Record<string, any>;
  retryable: boolean = false;
  userMessage?: string;

  constructor(message: string, details?: Record<string, any>, userMessage?: string) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.userMessage = userMessage;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        userMessage: this.userMessage,
        details: this.details,
        retryable: this.retryable,
      },
    };
  }
}

/**
 * Error thrown when user provides invalid credentials
 */
export class InvalidCredentialsError extends AuthError {
  code = 'INVALID_CREDENTIALS';
  statusCode = 401;

  constructor(details?: Record<string, any>) {
    super(
      'Invalid email or password',
      details,
      'The email or password you entered is incorrect. Please try again.'
    );
  }
}

/**
 * Error thrown when user account is deactivated
 */
export class AccountDeactivatedError extends AuthError {
  code = 'ACCOUNT_DEACTIVATED';
  statusCode = 403;

  constructor(details?: Record<string, any>) {
    super(
      'Account has been deactivated',
      details,
      'Your account has been deactivated. Please contact support for assistance.'
    );
  }
}

/**
 * Error thrown when access token has expired
 */
export class TokenExpiredError extends AuthError {
  code = 'TOKEN_EXPIRED';
  statusCode = 401;
  retryable = true;

  constructor(details?: Record<string, any>) {
    super(
      'Access token has expired',
      details,
      'Your session has expired. Please log in again.'
    );
  }
}

/**
 * Error thrown when refresh token is invalid or expired
 */
export class RefreshTokenExpiredError extends AuthError {
  code = 'REFRESH_TOKEN_EXPIRED';
  statusCode = 401;

  constructor(details?: Record<string, any>) {
    super(
      'Refresh token has expired',
      details,
      'Your session has expired. Please log in again.'
    );
  }
}

/**
 * Error thrown when token format is invalid
 */
export class InvalidTokenError extends AuthError {
  code = 'INVALID_TOKEN';
  statusCode = 401;

  constructor(details?: Record<string, any>) {
    super(
      'Invalid token format',
      details,
      'Authentication failed. Please log in again.'
    );
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends AuthError {
  code = 'NETWORK_ERROR';
  statusCode = 0;
  retryable = true;

  constructor(originalError?: Error, details?: Record<string, any>) {
    super(
      originalError?.message || 'Network request failed',
      { ...details, originalError: originalError?.message },
      'Connection failed. Please check your internet connection and try again.'
    );
  }
}

/**
 * Error thrown when server returns an error
 */
export class ServerError extends AuthError {
  code = 'SERVER_ERROR';
  statusCode = 500;
  retryable = true;

  constructor(statusCode: number = 500, details?: Record<string, any>) {
    super(
      `Server error (${statusCode})`,
      details,
      'A server error occurred. Please try again in a few moments.'
    );
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AuthError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;

  constructor(fields: string[], details?: Record<string, any>) {
    super(
      `Validation failed for fields: ${fields.join(', ')}`,
      { ...details, fields },
      'Please check your input and try again.'
    );
  }
}

/**
 * Error thrown when user lacks required permissions
 */
export class InsufficientPermissionsError extends AuthError {
  code = 'INSUFFICIENT_PERMISSIONS';
  statusCode = 403;

  constructor(requiredPermission?: string, details?: Record<string, any>) {
    super(
      requiredPermission 
        ? `Insufficient permissions: ${requiredPermission} required`
        : 'Insufficient permissions',
      { ...details, requiredPermission },
      'You do not have permission to perform this action.'
    );
  }
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Create appropriate auth error from API response
 */
export function createAuthErrorFromResponse(response: Response, data?: any): AuthError {
  const errorCode = data?.error?.code || data?.code;
  const errorMessage = data?.error?.message || data?.message;
  const details = data?.error?.details || data?.details;

  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
      return new InvalidCredentialsError(details);
    case 'ACCOUNT_DEACTIVATED':
      return new AccountDeactivatedError(details);
    case 'TOKEN_EXPIRED':
      return new TokenExpiredError(details);
    case 'REFRESH_TOKEN_EXPIRED':
    case 'INVALID_REFRESH_TOKEN':
      return new RefreshTokenExpiredError(details);
    case 'INVALID_TOKEN':
      return new InvalidTokenError(details);
    case 'VALIDATION_ERROR':
      return new ValidationError(details?.fields || [], details);
    case 'INSUFFICIENT_PERMISSIONS':
      return new InsufficientPermissionsError(details?.requiredPermission, details);
    default:
      if (response.status >= 500) {
        return new ServerError(response.status, { ...details, message: errorMessage });
      } else if (response.status === 401) {
        return new TokenExpiredError({ ...details, message: errorMessage });
      } else if (response.status === 403) {
        return new InsufficientPermissionsError(undefined, { ...details, message: errorMessage });
      } else {
        return new ServerError(response.status, { ...details, message: errorMessage });
      }
  }
}

/**
 * Create network error from fetch error
 */
export function createNetworkError(originalError: Error): NetworkError {
  return new NetworkError(originalError, {
    timestamp: new Date().toISOString(),
    errorType: originalError.name,
  });
}