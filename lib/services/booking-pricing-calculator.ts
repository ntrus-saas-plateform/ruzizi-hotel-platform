import type { IAccommodation, AccommodationPricingMode } from '@/types/accommodation.types';
import type { PricingDetails, BookingPricingMode } from '@/types/booking.types';

/**
 * Pricing calculation input interface
 */
export interface PricingCalculationInput {
  accommodation: IAccommodation;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
}

/**
 * Pricing calculation result interface
 */
export interface PricingCalculationResult {
  pricingDetails: PricingDetails;
  calculationBreakdown: {
    basePrice: number;
    effectivePrice: number;
    durationInDays: number;
    durationInHours: number;
    durationInMonths: number;
    appliedMode: BookingPricingMode;
  };
}

/**
 * Pricing calculation error interface
 */
export interface PricingCalculationError extends Error {
  code: 'PRICING_CALCULATION_ERROR';
  details: Record<string, any>;
}

/**
 * Booking pricing calculator service
 */
export class BookingPricingCalculator {
  /**
   * Calculates complete pricing details from accommodation data
   */
  static calculatePricingDetails(input: PricingCalculationInput): PricingCalculationResult {
    try {
      // Validate input
      this.validateInput(input);

      const { accommodation, checkIn, checkOut, numberOfGuests } = input;

      // Calculate duration metrics
      const durationInDays = this.calculateDurationInDays(checkIn, checkOut);
      const durationInHours = this.calculateDurationInHours(checkIn, checkOut);
      const durationInMonths = this.calculateDurationInMonths(checkIn, checkOut);

      // Determine pricing mode
      const appliedMode = this.determinePricingMode(accommodation);

      // Get effective price (seasonal or base)
      const basePrice = accommodation.pricing.basePrice;
      const effectivePrice = accommodation.pricing.seasonalPrice || basePrice;

      // Calculate quantity based on pricing mode
      const quantity = this.calculateQuantity(appliedMode, durationInDays, durationInHours, durationInMonths);

      // Calculate subtotal
      const subtotal = effectivePrice * quantity;

      // Calculate discount (if any)
      const discount = this.calculateDiscount(subtotal, durationInDays, appliedMode);

      // Calculate tax (if any)
      const tax = this.calculateTax(subtotal - (discount || 0));

      // Calculate total
      const total = subtotal - (discount || 0) + (tax || 0);

      const pricingDetails: PricingDetails = {
        mode: appliedMode,
        unitPrice: effectivePrice,
        quantity,
        subtotal,
        discount,
        tax,
        total,
      };

      const calculationBreakdown = {
        basePrice,
        effectivePrice,
        durationInDays,
        durationInHours,
        durationInMonths,
        appliedMode,
      };

      return {
        pricingDetails,
        calculationBreakdown,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw pricing calculation errors
      }
      throw this.createPricingError('Unexpected error during pricing calculation', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Determines the pricing mode based on accommodation configuration
   */
  static determinePricingMode(accommodation: IAccommodation): BookingPricingMode {
    // Use the accommodation's configured pricing mode
    return accommodation.pricingMode as BookingPricingMode;
  }

  /**
   * Calculates quantity based on pricing mode and duration
   */
  private static calculateQuantity(
    mode: BookingPricingMode,
    durationInDays: number,
    durationInHours: number,
    durationInMonths: number
  ): number {
    switch (mode) {
      case 'nightly':
        return Math.max(1, durationInDays); // Minimum 1 night
      case 'hourly':
        return Math.max(1, durationInHours); // Minimum 1 hour
      case 'monthly':
        return Math.max(1, Math.ceil(durationInMonths)); // Round up to full months
      default:
        throw this.createPricingError('Invalid pricing mode', { mode });
    }
  }

  /**
   * Calculates duration in days between check-in and check-out
   */
  private static calculateDurationInDays(checkIn: Date, checkOut: Date): number {
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return Math.max(1, daysDiff); // Minimum 1 day
  }

  /**
   * Calculates duration in hours between check-in and check-out
   */
  private static calculateDurationInHours(checkIn: Date, checkOut: Date): number {
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
    return Math.max(1, hoursDiff); // Minimum 1 hour
  }

  /**
   * Calculates duration in months between check-in and check-out
   */
  private static calculateDurationInMonths(checkIn: Date, checkOut: Date): number {
    const yearDiff = checkOut.getFullYear() - checkIn.getFullYear();
    const monthDiff = checkOut.getMonth() - checkIn.getMonth();
    const dayDiff = checkOut.getDate() - checkIn.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // If we haven't completed a full month, round up
    if (dayDiff > 0) {
      totalMonths += 1;
    }
    
    return Math.max(1, totalMonths); // Minimum 1 month
  }

  /**
   * Calculates discount based on duration and pricing mode
   */
  private static calculateDiscount(
    subtotal: number,
    durationInDays: number,
    mode: BookingPricingMode
  ): number | undefined {
    // Apply discounts for longer stays
    if (mode === 'nightly') {
      if (durationInDays >= 30) {
        return subtotal * 0.15; // 15% discount for 30+ days
      } else if (durationInDays >= 14) {
        return subtotal * 0.10; // 10% discount for 14+ days
      } else if (durationInDays >= 7) {
        return subtotal * 0.05; // 5% discount for 7+ days
      }
    }
    
    // No discount for other modes or shorter stays
    return undefined;
  }

  /**
   * Calculates tax (currently returns undefined as no tax system is implemented)
   */
  private static calculateTax(taxableAmount: number): number | undefined {
    // No tax calculation implemented yet
    // This can be extended in the future to include VAT, service charges, etc.
    return undefined;
  }

  /**
   * Validates pricing calculation input
   */
  private static validateInput(input: PricingCalculationInput): void {
    if (!input) {
      throw this.createPricingError('Pricing calculation input is required', { input: 'null or undefined' });
    }

    const { accommodation, checkIn, checkOut, numberOfGuests } = input;

    // Validate accommodation
    if (!accommodation) {
      throw this.createPricingError('Accommodation is required', { accommodation: 'null or undefined' });
    }

    if (!accommodation.pricing) {
      throw this.createPricingError('Accommodation pricing information is required', {
        accommodationId: accommodation._id?.toString() || 'unknown',
      });
    }

    if (!accommodation.pricing.basePrice || accommodation.pricing.basePrice <= 0) {
      throw this.createPricingError('Valid base price is required', {
        basePrice: accommodation.pricing.basePrice,
      });
    }

    if (!accommodation.pricingMode) {
      throw this.createPricingError('Accommodation pricing mode is required', {
        accommodationId: accommodation._id?.toString() || 'unknown',
      });
    }

    // Validate dates
    if (!checkIn || !checkOut) {
      throw this.createPricingError('Check-in and check-out dates are required', {
        checkIn: checkIn?.toString() || 'null',
        checkOut: checkOut?.toString() || 'null',
      });
    }

    if (checkIn >= checkOut) {
      throw this.createPricingError('Check-out date must be after check-in date', {
        checkIn: checkIn.toString(),
        checkOut: checkOut.toString(),
      });
    }

    // Validate number of guests
    if (!numberOfGuests || numberOfGuests < 1) {
      throw this.createPricingError('Number of guests must be at least 1', {
        numberOfGuests,
      });
    }

    if (numberOfGuests > accommodation.capacity.maxGuests) {
      throw this.createPricingError('Number of guests exceeds accommodation capacity', {
        numberOfGuests,
        maxGuests: accommodation.capacity.maxGuests,
      });
    }
  }

  /**
   * Creates a pricing calculation error
   */
  private static createPricingError(message: string, details: Record<string, any>): PricingCalculationError {
    const error = new Error(message) as PricingCalculationError;
    error.code = 'PRICING_CALCULATION_ERROR';
    error.details = details;
    return error;
  }
}

export default BookingPricingCalculator;