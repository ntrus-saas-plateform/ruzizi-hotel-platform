import { z } from 'zod';

/**
 * Pricing mode schema
 */
export const PricingModeSchema = z.enum(['nightly', 'monthly']);

/**
 * Location schema
 */
export const LocationSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

/**
 * Contacts schema
 */
export const ContactsSchema = z.object({
  phone: z
    .array(z.string().min(8, 'Phone number must be at least 8 characters').max(20))
    .min(1, 'At least one phone number is required'),
  email: z.string().email('Invalid email address'),
});

/**
 * Create establishment validation schema
 */
export const CreateEstablishmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  location: LocationSchema,
  pricingMode: PricingModeSchema,
  contacts: ContactsSchema,
  services: z.array(z.string()).default([]),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  managerId: z.string().min(1, 'Manager ID is required'),
  staffIds: z.array(z.string()).default([]),
  totalCapacity: z.number().int().min(1, 'Total capacity must be at least 1'),
  isActive: z.boolean().default(true),
});

/**
 * Update establishment validation schema
 */
export const UpdateEstablishmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000)
    .optional(),
  location: LocationSchema.optional(),
  pricingMode: PricingModeSchema.optional(),
  contacts: ContactsSchema.optional(),
  services: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  managerId: z.string().min(1, 'Manager ID is required').optional(),
  staffIds: z.array(z.string()).optional(),
  totalCapacity: z.number().int().min(1, 'Total capacity must be at least 1').optional(),
  isActive: z.boolean().optional(),
});

/**
 * Establishment filter schema
 */
export const EstablishmentFilterSchema = z.object({
  city: z.string().optional(),
  pricingMode: PricingModeSchema.optional(),
  isActive: z.boolean().optional(),
  managerId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types inferred from schemas
export type CreateEstablishmentInput = z.infer<typeof CreateEstablishmentSchema>;
export type UpdateEstablishmentInput = z.infer<typeof UpdateEstablishmentSchema>;
export type EstablishmentFilterInput = z.infer<typeof EstablishmentFilterSchema>;
