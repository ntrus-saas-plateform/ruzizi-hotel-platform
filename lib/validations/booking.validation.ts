import { z } from 'zod';

/**
 * Booking type schema
 */
export const BookingTypeSchema = z.enum(['online', 'onsite', 'walkin']);

/**
 * Booking status schema
 */
export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

/**
 * Payment status schema
 */
export const PaymentStatusSchema = z.enum(['unpaid', 'partial', 'paid']);

/**
 * Client info schema
 */
export const ClientInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  idNumber: z.string().max(50).optional(),
});

/**
 * Create booking validation schema
 */
export const CreateBookingSchema = z
  .object({
    establishmentId: z.string().min(1, 'Establishment ID is required'),
    accommodationId: z.string().min(1, 'Accommodation ID is required'),
    clientInfo: ClientInfoSchema,
    bookingType: BookingTypeSchema.default('online'),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    numberOfGuests: z.number().int().min(1, 'Number of guests must be at least 1'),
    notes: z.string().max(500).optional(),
    createdBy: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  });

/**
 * Update booking validation schema
 */
export const UpdateBookingSchema = z
  .object({
    clientInfo: ClientInfoSchema.optional(),
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional(),
    numberOfGuests: z.number().int().min(1, 'Number of guests must be at least 1').optional(),
    status: BookingStatusSchema.optional(),
    paymentStatus: PaymentStatusSchema.optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        return data.checkOut > data.checkIn;
      }
      return true;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOut'],
    }
  );

/**
 * Booking filter schema
 */
export const BookingFilterSchema = z.object({
  establishmentId: z.string().optional(),
  accommodationId: z.string().optional(),
  status: BookingStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  bookingType: BookingTypeSchema.optional(),
  clientEmail: z.string().email().optional(),
  bookingCode: z.string().optional(),
  checkInFrom: z.coerce.date().optional(),
  checkInTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export types inferred from schemas
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type BookingFilterInput = z.infer<typeof BookingFilterSchema>;
