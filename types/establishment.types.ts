import { Types } from 'mongoose';

/**
 * Pricing mode for establishment
 */
export type PricingMode = 'nightly' | 'monthly';

/**
 * Location information
 */
export interface Location {
  city: string;
  address: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Contact information
 */
export interface Contacts {
  phone: string[];
  email: string;
}

/**
 * Establishment document interface
 */
export interface IEstablishment {
  _id: Types.ObjectId;
  name: string;
  description: string;
  location: Location;
  pricingMode: PricingMode;
  contacts: Contacts;
  services: string[];
  images: string[];
  managerId: Types.ObjectId;
  staffIds: Types.ObjectId[];
  totalCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create establishment input
 */
export interface CreateEstablishmentInput {
  name: string;
  description: string;
  location: Location;
  pricingMode: PricingMode;
  contacts: Contacts;
  services?: string[];
  images?: string[];
  managerId: string;
  staffIds?: string[];
  totalCapacity: number;
  isActive?: boolean;
}

/**
 * Update establishment input
 */
export interface UpdateEstablishmentInput {
  name?: string;
  description?: string;
  location?: Location;
  pricingMode?: PricingMode;
  contacts?: Contacts;
  services?: string[];
  images?: string[];
  managerId?: string;
  staffIds?: string[];
  totalCapacity?: number;
  isActive?: boolean;
}

/**
 * Establishment response
 */
export interface EstablishmentResponse {
  id: string;
  name: string;
  description: string;
  location: Location;
  pricingMode: PricingMode;
  contacts: Contacts;
  services: string[];
  images: string[];
  managerId: string;
  staffIds: string[];
  totalCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Establishment with statistics
 */
export interface EstablishmentWithStats extends EstablishmentResponse {
  stats: {
    totalAccommodations: number;
    availableAccommodations: number;
    occupancyRate: number;
    totalRevenue: number;
  };
}

/**
 * Establishment filter options
 */
export interface EstablishmentFilterOptions {
  city?: string;
  pricingMode?: PricingMode;
  isActive?: boolean;
  managerId?: string;
  search?: string;
}
