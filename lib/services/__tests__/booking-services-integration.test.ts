import { BookingFieldMapper, FrontendBookingData } from '../booking-field-mapper';
import { BookingPricingCalculator } from '../booking-pricing-calculator';
import type { IAccommodation } from '@/types/accommodation.types';
import { Types } from 'mongoose';

describe('Booking Services Integration', () => {
  const createMockAccommodation = (): IAccommodation => ({
    _id: new Types.ObjectId(),
    establishmentId: new Types.ObjectId(),
    name: 'Test Room',
    type: 'standard_room',
    pricingMode: 'nightly',
    pricing: {
      basePrice: 100,
      currency: 'BIF'
    },
    capacity: {
      maxGuests: 4,
      bedrooms: 1,
      bathrooms: 1,
      showers: 1,
      livingRooms: 1,
      kitchens: 0,
      balconies: 0
    },
    details: {},
    amenities: [],
    status: 'available',
    images: [],
    maintenanceHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  test('should integrate field mapping and pricing calculation', () => {
    // Create frontend booking data with future dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);

    const frontendData: FrontendBookingData = {
      establishmentId: 'est123',
      accommodationId: 'acc456',
      checkInDate: tomorrow.toISOString(),
      checkOutDate: dayAfterTomorrow.toISOString(),
      numberOfNights: 2,
      mainClient: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890'
      },
      numberOfGuests: 2
    };

    // Create mock accommodation
    const accommodation = createMockAccommodation();

    // Step 1: Map frontend data to model format
    const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);

    // Verify mapping worked correctly
    expect(mappedData.checkIn).toBeInstanceOf(Date);
    expect(mappedData.checkOut).toBeInstanceOf(Date);
    expect(mappedData.clientInfo.firstName).toBe('John');

    // Step 2: Calculate pricing details
    const pricingResult = BookingPricingCalculator.calculatePricingDetails({
      accommodation,
      checkIn: mappedData.checkIn,
      checkOut: mappedData.checkOut,
      numberOfGuests: mappedData.numberOfGuests
    });

    // Verify pricing calculation worked correctly
    expect(pricingResult.pricingDetails.mode).toBe('nightly');
    expect(pricingResult.pricingDetails.unitPrice).toBe(100);
    expect(pricingResult.pricingDetails.quantity).toBe(2);
    expect(pricingResult.pricingDetails.subtotal).toBe(200);
    expect(pricingResult.pricingDetails.total).toBe(200);

    // Step 3: Combine mapped data with pricing details
    const completeBookingData = {
      ...mappedData,
      pricingDetails: pricingResult.pricingDetails
    };

    // Verify the complete booking data has all required fields
    expect(completeBookingData.establishmentId).toBe(frontendData.establishmentId);
    expect(completeBookingData.accommodationId).toBe(frontendData.accommodationId);
    expect(completeBookingData.checkIn).toBeInstanceOf(Date);
    expect(completeBookingData.checkOut).toBeInstanceOf(Date);
    expect(completeBookingData.clientInfo).toBeDefined();
    expect(completeBookingData.numberOfGuests).toBe(frontendData.numberOfGuests);
    expect(completeBookingData.pricingDetails).toBeDefined();
    expect(completeBookingData.pricingDetails.mode).toBe('nightly');
    expect(completeBookingData.pricingDetails.total).toBeGreaterThan(0);

    // Step 4: Validate the complete data
    const validation = BookingFieldMapper.validateRequiredFields(completeBookingData);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should handle seasonal pricing in integration', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const frontendData: FrontendBookingData = {
      establishmentId: 'est123',
      accommodationId: 'acc456',
      checkInDate: tomorrow.toISOString(),
      checkOutDate: dayAfterTomorrow.toISOString(),
      numberOfNights: 1,
      mainClient: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '0987654321'
      },
      numberOfGuests: 1
    };

    const accommodation = createMockAccommodation();
    accommodation.pricing.seasonalPrice = 150; // Higher seasonal price

    // Map and calculate pricing
    const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);
    const pricingResult = BookingPricingCalculator.calculatePricingDetails({
      accommodation,
      checkIn: mappedData.checkIn,
      checkOut: mappedData.checkOut,
      numberOfGuests: mappedData.numberOfGuests
    });

    // Verify seasonal price is used
    expect(pricingResult.pricingDetails.unitPrice).toBe(150);
    expect(pricingResult.pricingDetails.total).toBe(150);
  });

  test('should handle long stay discounts in integration', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const frontendData: FrontendBookingData = {
      establishmentId: 'est123',
      accommodationId: 'acc456',
      checkInDate: nextWeek.toISOString(),
      checkOutDate: twoWeeksLater.toISOString(), // 7 nights
      numberOfNights: 7,
      mainClient: {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '1122334455'
      },
      numberOfGuests: 2
    };

    const accommodation = createMockAccommodation();

    // Map and calculate pricing
    const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);
    const pricingResult = BookingPricingCalculator.calculatePricingDetails({
      accommodation,
      checkIn: mappedData.checkIn,
      checkOut: mappedData.checkOut,
      numberOfGuests: mappedData.numberOfGuests
    });

    // Verify discount is applied for 7+ nights
    expect(pricingResult.pricingDetails.subtotal).toBe(700); // 7 nights * 100
    expect(pricingResult.pricingDetails.discount).toBe(35); // 5% discount
    expect(pricingResult.pricingDetails.total).toBe(665); // 700 - 35
  });
});