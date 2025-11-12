/**
 * Custom database error classes
 */

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string = 'Failed to connect to database') {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateKeyError extends DatabaseError {
  public field: string;

  constructor(field: string, message?: string) {
    super(message || `Duplicate key error for field: ${field}`);
    this.name = 'DuplicateKeyError';
    this.field = field;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Handle Mongoose errors and convert them to custom errors
 */
export function handleMongooseError(error: any): DatabaseError {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'unknown';
    return new DuplicateKeyError(field);
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map((err: any) => err.message)
      .join(', ');
    return new ValidationError(messages);
  }

  // Cast error (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  // Connection error
  if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
    return new ConnectionError(error.message);
  }

  // Default to generic database error
  return new DatabaseError(error.message || 'An unknown database error occurred');
}
