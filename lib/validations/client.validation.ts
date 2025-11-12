import { z } from 'zod';

/**
 * Client classification schema
 */
export const ClientClassificationSchema = z.enum(['regular', 'walkin', 'corporate']);

/**
 * Personal info schema
 */
export const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  idNumber: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
});

/**
 * Discount schema
 */
export const DiscountSchema = z.object({
  type: z.string().min(1, 'Discount type is required').max(50),
  percentage: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100'),
  validUntil: z.coerce.date().optional(),
});

/**
 * Create client validation schema
 */
export const CreateClientSchema = z.object({
  personalInfo: PersonalInfoSchema,
  classification: ClientClassificationSchema.default('regular'),
  preferences: z.array(z.string()).default([]),
  notes: z.string().max(500).optional(),
});

/**
 * Update client validation schema
 */
export const UpdateClientSchema = z.object({
  personalInfo: PersonalInfoSchema.partial().optional(),
  classification: ClientClassificationSchema.optional(),
  preferences: z.array(z.string()).optional(),
  debt: z.number().optional(),
  discounts: z.array(DiscountSchema).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Client filter schema
 */
export const ClientFilterSchema = z.object({
  classification: ClientClassificationSchema.optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types inferred from schemas
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ClientFilterInput = z.infer<typeof ClientFilterSchema>;
