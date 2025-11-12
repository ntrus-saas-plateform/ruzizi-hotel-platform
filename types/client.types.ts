import { Types } from 'mongoose';

/**
 * Client classification
 */
export type ClientClassification = 'regular' | 'walkin' | 'corporate';

/**
 * Personal information
 */
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber?: string;
  address?: string;
}

/**
 * Discount information
 */
export interface Discount {
  type: string;
  percentage: number;
  validUntil?: Date;
}

/**
 * Client document interface
 */
export interface IClient {
  _id: Types.ObjectId;
  personalInfo: PersonalInfo;
  classification: ClientClassification;
  preferences?: string[];
  bookingHistory: Types.ObjectId[];
  totalStays: number;
  totalSpent: number;
  debt: number;
  discounts: Discount[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create client input
 */
export interface CreateClientInput {
  personalInfo: PersonalInfo;
  classification?: ClientClassification;
  preferences?: string[];
  notes?: string;
}

/**
 * Update client input
 */
export interface UpdateClientInput {
  personalInfo?: Partial<PersonalInfo>;
  classification?: ClientClassification;
  preferences?: string[];
  debt?: number;
  discounts?: Discount[];
  notes?: string;
}

/**
 * Client response
 */
export interface ClientResponse {
  id: string;
  personalInfo: PersonalInfo;
  classification: ClientClassification;
  preferences?: string[];
  bookingHistory: string[];
  totalStays: number;
  totalSpent: number;
  debt: number;
  discounts: Discount[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client filter options
 */
export interface ClientFilterOptions {
  classification?: ClientClassification;
  email?: string;
  phone?: string;
  search?: string;
}
