import { Types } from 'mongoose';

/**
 * Accommodation type
 */
export type AccommodationType = 'standard_room' | 'suite' | 'house' | 'apartment';

/**
 * Pricing mode for accommodation
 */
export type AccommodationPricingMode = 'nightly' | 'monthly' | 'hourly';

/**
 * Accommodation status
 */
export type AccommodationStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

/**
 * Pricing information
 */
export interface Pricing {
  basePrice: number;
  seasonalPrice?: number;
  currency: 'BIF';
}

/**
 * Capacity information
 */
export interface Capacity {
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  showers: number;
  livingRooms: number;
  kitchens: number;
  balconies: number;
}

/**
 * Details information
 */
export interface Details {
  floor?: number;
  area?: number;
  view?: string;
  bedType?: string;
}

/**
 * Maintenance history entry
 */
export interface MaintenanceHistory {
  date: Date;
  description: string;
  cost?: number;
}

/**
 * Accommodation document interface
 */
export interface IAccommodation {
  _id: Types.ObjectId;
  establishmentId: Types.ObjectId;
  name: string;
  description?: string;
  type: AccommodationType;
  pricingMode: AccommodationPricingMode;
  pricing: Pricing;
  capacity: Capacity;
  details: Details;
  amenities: string[];
  status: AccommodationStatus;
  images: string[];
  maintenanceHistory: MaintenanceHistory[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create accommodation input
 */
export interface CreateAccommodationInput {
  establishmentId: string;
  name: string;
  description?: string;
  type: AccommodationType;
  pricingMode: AccommodationPricingMode;
  pricing: Pricing;
  capacity: Capacity;
  details?: Details;
  amenities?: string[];
  status?: AccommodationStatus;
  images?: string[];
}

/**
 * Update accommodation input
 */
export interface UpdateAccommodationInput {
  name?: string;
  description?: string;
  type?: AccommodationType;
  pricingMode?: AccommodationPricingMode;
  pricing?: Pricing;
  capacity?: Capacity;
  details?: Details;
  amenities?: string[];
  status?: AccommodationStatus;
  images?: string[];
}

/**
 * Accommodation response
 */
export interface AccommodationResponse {
  id: string;
  establishmentId: string;
  name: string;
  description?: string;
  type: AccommodationType;
  pricingMode: AccommodationPricingMode;
  pricing: Pricing;
  capacity: Capacity;
  details: Details;
  amenities: string[];
  status: AccommodationStatus;
  images: string[];
  maintenanceHistory: MaintenanceHistory[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Accommodation filter options
 */
export interface AccommodationFilterOptions {
  establishmentId?: string;
  type?: AccommodationType;
  status?: AccommodationStatus;
  pricingMode?: AccommodationPricingMode;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  search?: string;
}

/**
 * Add maintenance entry input
 */
export interface AddMaintenanceInput {
  date: Date;
  description: string;
  cost?: number;
}
