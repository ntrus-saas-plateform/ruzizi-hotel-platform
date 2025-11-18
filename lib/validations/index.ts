import { cache } from '@/lib/performance/cache';
import { z } from 'zod';

// Import all validation schemas
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  BookingFilterSchema,
  ClientInfoSchema,
  BookingTypeSchema,
  BookingStatusSchema,
  PaymentStatusSchema,
} from './booking.validation';

import {
  CreateAccommodationSchema,
  UpdateAccommodationSchema,
  AccommodationFilterSchema,
} from './accommodation.validation';

import {
  CreateClientSchema,
  UpdateClientSchema,
  ClientFilterSchema,
} from './client.validation';

import {
  CreateEstablishmentSchema,
  UpdateEstablishmentSchema,
  EstablishmentFilterSchema,
} from './establishment.validation';

import {
  CreateUserSchema,
  UpdateUserSchema,
  UserFilterSchema,
  LoginSchema,
  ChangePasswordSchema,
} from './user.validation';

import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseFilterSchema,
} from './expense.validation';

import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceFilterSchema,
} from './invoice.validation';

/**
 * Validation Schemas Cache
 * Pre-compiled and cached Zod schemas for improved performance
 */
class ValidationCache {
  private static readonly CACHE_PREFIX = 'validation_schema:';
  private static readonly CACHE_TTL = 3600; // 1 hour

  public static readonly schemas = {
    // Booking schemas
    CreateBookingSchema,
    UpdateBookingSchema,
    BookingFilterSchema,
    ClientInfoSchema,
    BookingTypeSchema,
    BookingStatusSchema,
    PaymentStatusSchema,

    // Accommodation schemas
    CreateAccommodationSchema,
    UpdateAccommodationSchema,
    AccommodationFilterSchema,

    // Client schemas
    CreateClientSchema,
    UpdateClientSchema,
    ClientFilterSchema,

    // Establishment schemas
    CreateEstablishmentSchema,
    UpdateEstablishmentSchema,
    EstablishmentFilterSchema,

    // User schemas
    CreateUserSchema,
    UpdateUserSchema,
    UserFilterSchema,
    LoginSchema,
    ChangePasswordSchema,

    // Expense schemas
    CreateExpenseSchema,
    UpdateExpenseSchema,
    ExpenseFilterSchema,

    // Invoice schemas
    CreateInvoiceSchema,
    UpdateInvoiceSchema,
    InvoiceFilterSchema,
  };

  /**
   * Preload all validation schemas into cache
   * This ensures schemas are compiled and ready for use
   */
  static async preloadSchemas(): Promise<void> {
    try {
      console.log('🔄 Preloading validation schemas...');

      // Cache each schema individually for better granularity
      const schemaEntries = Object.entries(this.schemas);

      for (const [name, schema] of schemaEntries) {
        const cacheKey = this.CACHE_PREFIX + name;
        await cache.set(cacheKey, schema, this.CACHE_TTL);
      }

      console.log(`✅ Preloaded ${schemaEntries.length} validation schemas`);
    } catch (error) {
      console.error('❌ Failed to preload validation schemas:', error);
    }
  }

  /**
   * Get a cached schema by name
   */
  static async getSchema<T extends z.ZodTypeAny>(name: string): Promise<T | null> {
    const cacheKey = this.CACHE_PREFIX + name;
    return cache.get<T>(cacheKey);
  }

  /**
   * Get all cached schemas
   */
  static async getAllSchemas() {
    const schemas: Record<string, z.ZodTypeAny> = {};

    for (const name of Object.keys(this.schemas)) {
      const schema = await this.getSchema(name);
      if (schema) {
        schemas[name] = schema;
      }
    }

    return schemas;
  }
}

// Export the cached schemas for direct use
export const validationSchemas = ValidationCache.schemas;

// Export the cache class for preloading
export { ValidationCache };

// Re-export all schemas for backward compatibility
export * from './booking.validation';
export * from './accommodation.validation';
export * from './client.validation';
export * from './establishment.validation';
export * from './user.validation';
export * from './expense.validation';
export * from './invoice.validation';