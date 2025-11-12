import { z } from 'zod';

/**
 * Accommodation type schema
 */
export const AccommodationTypeSchema = z.enum(['standard_room', 'suite', 'house', 'apartment']);

/**
 * Pricing mode schema
 */
export const AccommodationPricingModeSchema = z.enum(['nightly', 'monthly', 'hourly']);

/**
 * Status schema
 */
export const AccommodationStatusSchema = z.enum([
  'available',
  'occupied',
  'maintenance',
  'reserved',
]);

/**
 * Pricing schema
 */
export const PricingSchema = z.object({
  basePrice: z.number().min(0, 'Base price must be positive'),
  seasonalPrice: z.number().min(0, 'Seasonal price must be positive').optional(),
  currency: z.literal('BIF'),
});

/**
 * Capacity schema
 */
export const CapacitySchema = z.object({
  maxGuests: z.number().int().min(1, 'Max guests must be at least 1'),
  bedrooms: z.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.number().int().min(0, 'Bathrooms must be non-negative'),
  showers: z.number().int().min(0, 'Showers must be non-negative'),
  livingRooms: z.number().int().min(0, 'Living rooms must be non-negative'),
  kitchens: z.number().int().min(0, 'Kitchens must be non-negative'),
  balconies: z.number().int().min(0, 'Balconies must be non-negative'),
});

/**
 * Details schema
 */
export const DetailsSchema = z.object({
  floor: z.number().int().optional(),
  area: z.number().min(0, 'Area must be positive').optional(),
  view: z.string().max(100).optional(),
  bedType: z.string().max(50).optional(),
});

/**
 * Maintenance history schema
 */
export const MaintenanceHistorySchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, 'Description is required').max(500),
  cost: z.number().min(0, 'Cost must be positive').optional(),
});

/**
 * Create accommodation validation schema
 */
export const CreateAccommodationSchema = z.object({
  establishmentId: z.string().min(1, 'Establishment ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  type: AccommodationTypeSchema,
  pricingMode: AccommodationPricingModeSchema,
  pricing: PricingSchema,
  capacity: CapacitySchema,
  details: DetailsSchema.optional(),
  amenities: z.array(z.string()).default([]),
  status: AccommodationStatusSchema.default('available'),
  images: z.array(z.string().url('Invalid image URL')).default([]),
});

/**
 * Update accommodation validation schema
 */
export const UpdateAccommodationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  type: AccommodationTypeSchema.optional(),
  pricingMode: AccommodationPricingModeSchema.optional(),
  pricing: PricingSchema.optional(),
  capacity: CapacitySchema.optional(),
  details: DetailsSchema.optional(),
  amenities: z.array(z.string()).optional(),
  status: AccommodationStatusSchema.optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

/**
 * Accommodation filter schema
 */
export const AccommodationFilterSchema = z.object({
  establishmentId: z.string().optional(),
  type: AccommodationTypeSchema.optional(),
  status: AccommodationStatusSchema.optional(),
  pricingMode: AccommodationPricingModeSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minGuests: z.number().int().min(1).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types inferred from schemas
export type CreateAccommodationInput = z.infer<typeof CreateAccommodationSchema>;
export type UpdateAccommodationInput = z.infer<typeof UpdateAccommodationSchema>;
export type AccommodationFilterInput = z.infer<typeof AccommodationFilterSchema>;
export type AddMaintenanceInput = z.infer<typeof MaintenanceHistorySchema>;
