import { Types } from 'mongoose';

/**
 * Booking type
 */
export type BookingType = 'online' | 'onsite' | 'walkin';

/**
 * Booking status
 */
export type BookingStatus = 'pending' | 'accepted' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Payment status
 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

/**
 * Pricing mode for booking
 */
export type BookingPricingMode = 'nightly' | 'monthly' | 'hourly';

/**
 * Client information
 */
export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber?: string;
}

/**
 * Pricing details
 */
export interface PricingDetails {
  mode: BookingPricingMode;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
}

/**
 * Booking document interface
 */
export interface IBooking {
  _id: Types.ObjectId;
  bookingCode: string;
  establishmentId: Types.ObjectId;
  accommodationId: Types.ObjectId;
  clientInfo: ClientInfo;
  bookingType: BookingType;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  pricingDetails: PricingDetails;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create booking input
 */
export interface CreateBookingInput {
  establishmentId: string;
  accommodationId: string;
  clientInfo: ClientInfo;
  bookingType?: BookingType;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  notes?: string;
  createdBy?: string;
}

/**
 * Update booking input
 */
export interface UpdateBookingInput {
  clientInfo?: ClientInfo;
  checkIn?: Date;
  checkOut?: Date;
  numberOfGuests?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

/**
 * Booking response
 */
export interface BookingResponse {
  id: string;
  bookingCode: string;
  establishmentId: string;
  accommodationId: string;
  clientInfo: ClientInfo;
  bookingType: BookingType;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  pricingDetails: PricingDetails;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking filter options
 */
export interface BookingFilterOptions {
  establishmentId?: string;
  accommodationId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  bookingType?: BookingType;
  clientEmail?: string;
  bookingCode?: string;
  checkInFrom?: Date;
  checkInTo?: Date;
  search?: string;
}
