import { Types } from 'mongoose';

/**
 * Gender types
 */
export type Gender = 'M' | 'F' | 'Autre';

/**
 * ID types
 */
export type IDType = 'passport' | 'id_card' | 'driver_license' | 'birth_certificate';

/**
 * Customer types
 */
export type CustomerType = 'individual' | 'corporate' | 'agency' | 'other';

/**
 * Relationship to main client
 */
export type RelationshipType = 
  | 'spouse' 
  | 'child' 
  | 'parent' 
  | 'sibling' 
  | 'friend' 
  | 'colleague' 
  | 'other';

/**
 * Complete client information
 */
export interface CompleteClientInfo {
  // Basic info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Personal details
  nationality: string;
  gender: Gender;
  dateOfBirth: Date;
  
  // Identification
  idType: IDType;
  idNumber: string;
  idExpiryDate?: Date;
  
  // Address
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  
  // Preferences
  preferredLanguage?: string;
  
  // Customer classification
  customerType: CustomerType;
  companyName?: string; // If corporate or agency
  
  // Loyalty
  loyaltyCardNumber?: string;
  
  // Notes
  notes?: string; // VIP, allergies, special needs, etc.
}

/**
 * Guest information (accompanying persons)
 */
export interface GuestInfo {
  // Basic info
  firstName: string;
  lastName: string;
  
  // Personal details
  gender: Gender;
  dateOfBirth: Date;
  nationality: string;
  
  // Identification
  idType: IDType;
  idNumber: string;
  idExpiryDate?: Date;
  
  // Relationship
  relationshipToMainClient: RelationshipType;
  relationshipDetails?: string; // Additional details if needed
  
  // Special info
  isMinor: boolean;
  
  // Notes
  notes?: string; // Allergies, preferences, special needs
}

/**
 * Complete booking guest data
 */
export interface BookingGuestData {
  mainClient: CompleteClientInfo;
  guests: GuestInfo[];
  numberOfAdults: number;
  numberOfChildren: number;
  totalGuests: number;
}

/**
 * Guest validation result
 */
export interface GuestValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Create guest input
 */
export interface CreateGuestInput extends Omit<GuestInfo, 'isMinor'> {
  // isMinor will be calculated from dateOfBirth
}

/**
 * Update guest input
 */
export interface UpdateGuestInput extends Partial<GuestInfo> {}

/**
 * Guest response
 */
export interface GuestResponse extends GuestInfo {
  id: string;
  age: number;
}
