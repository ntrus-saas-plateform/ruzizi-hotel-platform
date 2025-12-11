import { z } from 'zod';

/**
 * Frontend booking data structure (as received from the frontend)
 */
export interface FrontendBookingData {
  establishmentId: string;
  accommodationId: string;
  checkInDate: string;        // Maps to checkIn
  checkOutDate: string;       // Maps to checkOut
  numberOfNights: number;
  mainClient: ClientInfo;     // Maps to clientInfo
  guests?: GuestInfo[];
  numberOfGuests: number;
  specialRequests?: string;
  arrivalTime?: string;
  totalAmount?: number;
  pricingDetails?: Partial<PricingDetails>;
}

/**
 * Guest information structure
 */
export interface GuestInfo {
  firstName: string;
  lastName: string;
  relationshipToMainClient?: string;
  isMinor?: boolean;
}

/**
 * Client information structure (extended from validation schema)
 */
export interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  gender?: string;
  dateOfBirth?: string;
  customerType?: string;
  companyName?: string;
  loyaltyCardNumber?: string;
  preferredLanguage?: string;
  notes?: string;
}

/**
 * Pricing details structure
 */
export interface PricingDetails {
  mode: 'nightly' | 'monthly' | 'hourly';
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
}

/**
 * Database model booking data structure (target format)
 */
export interface ModelBookingData {
  establishmentId: string;
  accommodationId: string;
  checkIn: Date;              // Mapped from checkInDate
  checkOut: Date;             // Mapped from checkOutDate
  clientInfo: ClientInfo;     // Mapped from mainClient
  numberOfGuests: number;
  guests?: GuestInfo[];
  specialRequests?: string;
  arrivalTime?: string;
  totalAmount?: number;
  pricingDetails?: PricingDetails;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
}

/**
 * Field mapping error interface
 */
export interface FieldMappingError extends Error {
  code: 'FIELD_MAPPING_ERROR';
  details: Record<string, string>;
}

/**
 * Booking field mapper service
 */
export class BookingFieldMapper {
  /**
   * Maps frontend booking data to database model format
   */
  static mapFrontendToModel(frontendData: FrontendBookingData): ModelBookingData {
    try {
      // Validate input data structure
      if (!frontendData) {
        throw this.createMappingError('Frontend data is required', { input: 'null or undefined' });
      }

      // Map date fields: checkInDate → checkIn, checkOutDate → checkOut
      const checkIn = this.parseDate(frontendData.checkInDate, 'checkInDate');
      const checkOut = this.parseDate(frontendData.checkOutDate, 'checkOutDate');

      // Map client information: mainClient → clientInfo
      const clientInfo = this.mapClientInfo(frontendData.mainClient);

      // Create mapped data structure
      const mappedData: ModelBookingData = {
        establishmentId: frontendData.establishmentId,
        accommodationId: frontendData.accommodationId,
        checkIn,
        checkOut,
        clientInfo,
        numberOfGuests: frontendData.numberOfGuests,
      };

      // Map optional fields
      if (frontendData.guests) {
        mappedData.guests = frontendData.guests;
      }

      if (frontendData.specialRequests) {
        mappedData.specialRequests = frontendData.specialRequests;
      }

      if (frontendData.arrivalTime) {
        mappedData.arrivalTime = frontendData.arrivalTime;
      }

      if (frontendData.totalAmount) {
        mappedData.totalAmount = frontendData.totalAmount;
      }

      if (frontendData.pricingDetails) {
        mappedData.pricingDetails = frontendData.pricingDetails as PricingDetails;
      }

      return mappedData;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw mapping errors
      }
      throw this.createMappingError('Unexpected error during field mapping', { 
        originalError: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Validates required fields after mapping
   */
  static validateRequiredFields(data: ModelBookingData): ValidationResult {
    const errors: string[] = [];
    const missingFields: string[] = [];

    // Check required fields
    const requiredFields = [
      'establishmentId',
      'accommodationId', 
      'checkIn',
      'checkOut',
      'clientInfo',
      'numberOfGuests'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof ModelBookingData]) {
        missingFields.push(field);
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate clientInfo structure
    if (data.clientInfo) {
      const clientValidation = this.validateClientInfo(data.clientInfo);
      if (!clientValidation.isValid) {
        errors.push(...clientValidation.errors);
        missingFields.push(...clientValidation.missingFields.map(f => `clientInfo.${f}`));
      }
    }

    // Validate date logic
    if (data.checkIn && data.checkOut) {
      if (data.checkIn >= data.checkOut) {
        errors.push('Check-out date must be after check-in date');
      }

      // Check if check-in is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (data.checkIn < today) {
        errors.push('Check-in date cannot be in the past');
      }
    }

    // Validate numberOfGuests
    if (data.numberOfGuests && data.numberOfGuests < 1) {
      errors.push('Number of guests must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
      missingFields
    };
  }

  /**
   * Validates client information structure
   */
  private static validateClientInfo(clientInfo: ClientInfo): ValidationResult {
    const errors: string[] = [];
    const missingFields: string[] = [];

    // Required client fields
    const requiredClientFields = ['firstName', 'lastName', 'email', 'phone'];

    for (const field of requiredClientFields) {
      if (!clientInfo[field as keyof ClientInfo]) {
        missingFields.push(field);
        errors.push(`Required client field '${field}' is missing`);
      }
    }

    // Validate email format
    if (clientInfo.email && !this.isValidEmail(clientInfo.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone format (basic check)
    if (clientInfo.phone && (clientInfo.phone.length < 8 || clientInfo.phone.length > 20)) {
      errors.push('Phone number must be between 8 and 20 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      missingFields
    };
  }

  /**
   * Maps client information from mainClient to clientInfo structure
   */
  private static mapClientInfo(mainClient: ClientInfo): ClientInfo {
    if (!mainClient) {
      throw this.createMappingError('Main client information is required', { mainClient: 'null or undefined' });
    }

    // Create a clean clientInfo object with all fields properly mapped
    const clientInfo: ClientInfo = {
      firstName: mainClient.firstName || '',
      lastName: mainClient.lastName || '',
      email: mainClient.email || '',
      phone: mainClient.phone || '',
    };

    // Map optional fields
    if (mainClient.idNumber) clientInfo.idNumber = mainClient.idNumber;
    if (mainClient.address) clientInfo.address = mainClient.address;
    if (mainClient.city) clientInfo.city = mainClient.city;
    if (mainClient.country) clientInfo.country = mainClient.country;
    if (mainClient.nationality) clientInfo.nationality = mainClient.nationality;
    if (mainClient.gender) clientInfo.gender = mainClient.gender;
    if (mainClient.dateOfBirth) clientInfo.dateOfBirth = mainClient.dateOfBirth;
    if (mainClient.customerType) clientInfo.customerType = mainClient.customerType;
    if (mainClient.companyName) clientInfo.companyName = mainClient.companyName;
    if (mainClient.loyaltyCardNumber) clientInfo.loyaltyCardNumber = mainClient.loyaltyCardNumber;
    if (mainClient.preferredLanguage) clientInfo.preferredLanguage = mainClient.preferredLanguage;
    if (mainClient.notes) clientInfo.notes = mainClient.notes;

    return clientInfo;
  }

  /**
   * Parses date string to Date object
   */
  private static parseDate(dateString: string, fieldName: string): Date {
    if (!dateString) {
      throw this.createMappingError(`Date field '${fieldName}' is required`, { [fieldName]: 'null or undefined' });
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw this.createMappingError(`Invalid date format for field '${fieldName}'`, { [fieldName]: dateString });
    }

    return date;
  }

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  }

  /**
   * Creates a field mapping error
   */
  private static createMappingError(message: string, details: Record<string, string>): FieldMappingError {
    const error = new Error(message) as FieldMappingError;
    error.code = 'FIELD_MAPPING_ERROR';
    error.details = details;
    return error;
  }
}

export default BookingFieldMapper;