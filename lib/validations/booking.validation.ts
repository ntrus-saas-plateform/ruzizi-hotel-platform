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
 * Booking pricing mode schema
 */
export const BookingPricingModeSchema = z.enum(['nightly', 'monthly', 'hourly']);

/**
 * Guest info schema
 */
export const GuestInfoSchema = z.object({
  firstName: z.string().min(1, 'Guest first name is required').max(50),
  lastName: z.string().min(1, 'Guest last name is required').max(50),
  relationshipToMainClient: z.string().max(50).optional(),
  isMinor: z.boolean().optional(),
});

/**
 * Client info schema (extended to match field mapper requirements)
 */
export const ClientInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  idNumber: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  gender: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  customerType: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  loyaltyCardNumber: z.string().max(50).optional(),
  preferredLanguage: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Pricing details schema for automatically calculated pricing
 */
export const PricingDetailsSchema = z.object({
  mode: BookingPricingModeSchema,
  unitPrice: z.number().positive('Unit price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
  discount: z.number().nonnegative('Discount must be non-negative').optional(),
  tax: z.number().nonnegative('Tax must be non-negative').optional(),
  total: z.number().nonnegative('Total must be non-negative'),
});

/**
 * Frontend booking validation schema (supports field mapping)
 * Accepts frontend field names: checkInDate, checkOutDate, mainClient
 */
export const FrontendBookingSchema = z
  .object({
    establishmentId: z.string().min(1, 'Establishment ID is required'),
    accommodationId: z.string().min(1, 'Accommodation ID is required'),
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkOutDate: z.string().min(1, 'Check-out date is required'),
    numberOfNights: z.number().int().min(1, 'Number of nights must be at least 1'),
    mainClient: ClientInfoSchema,
    guests: z.array(GuestInfoSchema).optional(),
    numberOfGuests: z.number().int().min(1, 'Number of guests must be at least 1'),
    specialRequests: z.string().max(1000).optional(),
    arrivalTime: z.string().optional(),
    totalAmount: z.number().nonnegative().optional(),
    pricingDetails: PricingDetailsSchema.partial().optional(),
  })
  .refine((data) => {
    // Validate dates if they can be parsed
    try {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      return checkOut > checkIn;
    } catch {
      return false;
    }
  }, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  })
  .refine((data) => {
    // Validate check-in is not in the past
    try {
      const checkIn = new Date(data.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    } catch {
      return false;
    }
  }, {
    message: 'Check-in date cannot be in the past',
    path: ['checkInDate'],
  });

/**
 * Create booking validation schema (after field mapping)
 * Uses database field names: checkIn, checkOut, clientInfo
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
    guests: z.array(GuestInfoSchema).optional(),
    specialRequests: z.string().max(1000).optional(),
    arrivalTime: z.string().optional(),
    totalAmount: z.number().nonnegative().optional(),
    pricingDetails: PricingDetailsSchema.optional(),
    notes: z.string().max(500).optional(),
    createdBy: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  })
  .refine((data) => {
    // Validate check-in is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.checkIn >= today;
  }, {
    message: 'Check-in date cannot be in the past',
    path: ['checkIn'],
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
    guests: z.array(GuestInfoSchema).optional(),
    specialRequests: z.string().max(1000).optional(),
    arrivalTime: z.string().optional(),
    totalAmount: z.number().nonnegative().optional(),
    pricingDetails: PricingDetailsSchema.optional(),
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

/**
 * Complete booking validation schema (with required pricing details)
 * Used for validating fully processed bookings before database insertion
 */
export const CompleteBookingSchema = z
  .object({
    establishmentId: z.string().min(1, 'Establishment ID is required'),
    accommodationId: z.string().min(1, 'Accommodation ID is required'),
    clientInfo: ClientInfoSchema,
    bookingType: BookingTypeSchema.default('online'),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    numberOfGuests: z.number().int().min(1, 'Number of guests must be at least 1'),
    guests: z.array(GuestInfoSchema).optional(),
    specialRequests: z.string().max(1000).optional(),
    arrivalTime: z.string().optional(),
    totalAmount: z.number().nonnegative().optional(),
    pricingDetails: PricingDetailsSchema, // Required for complete bookings
    notes: z.string().max(500).optional(),
    createdBy: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  })
  .refine((data) => {
    // Validate check-in is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.checkIn >= today;
  }, {
    message: 'Check-in date cannot be in the past',
    path: ['checkIn'],
  });

// Export types inferred from schemas
export type FrontendBookingInput = z.infer<typeof FrontendBookingSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type CompleteBookingInput = z.infer<typeof CompleteBookingSchema>;
export type BookingFilterInput = z.infer<typeof BookingFilterSchema>;
export type PricingDetailsInput = z.infer<typeof PricingDetailsSchema>;
export type ClientInfoInput = z.infer<typeof ClientInfoSchema>;
export type GuestInfoInput = z.infer<typeof GuestInfoSchema>;
