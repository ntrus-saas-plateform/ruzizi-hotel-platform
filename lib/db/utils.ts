import mongoose from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Convert a string to MongoDB ObjectId
 * Throws an error if the string is not a valid ObjectId
 */
export function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
}

/**
 * Convert an ObjectId to string
 */
export function objectIdToString(id: mongoose.Types.ObjectId): string {
  return id.toString();
}

/**
 * Generate a new ObjectId
 */
export function generateObjectId(): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId();
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Apply pagination to a Mongoose query
 */
export async function paginate<T>(
  query: mongoose.Query<T[], T>,
  options: PaginationOptions = {}
): Promise<PaginationResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const skip = (page - 1) * limit;

  // Apply sorting if provided
  if (options.sort) {
    query = query.sort(options.sort);
  }

  // Execute query with pagination
  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit).exec(),
    query.model.countDocuments(query.getFilter()),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Transaction helper
 * Executes a function within a MongoDB transaction
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Sanitize user input to prevent NoSQL injection
 */
export function sanitizeQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  const sanitized: any = {};

  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      // Remove keys starting with $
      if (key.startsWith('$')) {
        continue;
      }

      const value = query[key];

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeQuery(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Build a search query for text fields
 */
export function buildSearchQuery(searchTerm: string, fields: string[]): any {
  if (!searchTerm || fields.length === 0) {
    return {};
  }

  const regex = new RegExp(searchTerm, 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

/**
 * Build a date range query
 */
export function buildDateRangeQuery(
  field: string,
  startDate?: Date,
  endDate?: Date
): Record<string, any> {
  const query: Record<string, any> = {};

  if (startDate || endDate) {
    query[field] = {};

    if (startDate) {
      query[field].$gte = startDate;
    }

    if (endDate) {
      query[field].$lte = endDate;
    }
  }

  return query;
}
