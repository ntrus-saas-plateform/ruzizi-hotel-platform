import * as fc from 'fast-check';
import { BookingPricingCalculator, PricingCalculationInput } from '../booking-pricing-calculator';
import type { IAccommodation, AccommodationPricingMode } from '@/types/accommodation.types';
import type { PricingDetails } from '@/types/booking.types';
import { Types } from 'mongoose';

describe('BookingPricingCalculator', () => {
  describe('Property-Based Tests', () => {
    /**
     * **Feature: booking-validation-fix, Property 4: Pricing calculation accuracy**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
     * 
     * For any accommodation with pricing information, the pricing calculator should correctly 
     * determine mode, unit price, quantity, and totals based on accommodation configuration 
     * and booking duration
     */
    test('Property 4: Pricing calculation accuracy', () => {
      fc.assert(
        fc.property(
          // Generator for valid accommodation data
          fc.record({
            _id: fc.constant(new Types.ObjectId()),
            establishmentId: fc.constant(new Types.ObjectId()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('standard_room', 'suite', 'house', 'apartment'),
            pricingMode: fc.constantFrom('nightly', 'monthly', 'hourly') as fc.Arbitrary<AccommodationPricingMode>,
            pricing: fc.record({
              basePrice: fc.float({ min: 10, max: 1000, noNaN: true }),
              seasonalPrice: fc.option(fc.float({ min: 10, max: 1500, noNaN: true }), { nil: undefined }),
              currency: fc.constant('BIF' as const)
            }),
            capacity: fc.record({
              maxGuests: fc.integer({ min: 1, max: 10 }),
              bedrooms: fc.integer({ min: 0, max: 5 }),
              bathrooms: fc.integer({ min: 0, max: 3 }),
              showers: fc.integer({ min: 0, max: 3 }),
              livingRooms: fc.integer({ min: 0, max: 2 }),
              kitchens: fc.integer({ min: 0, max: 2 }),
              balconies: fc.integer({ min: 0, max: 3 })
            }),
            details: fc.record({}),
            amenities: fc.array(fc.string()),
            status: fc.constantFrom('available', 'occupied', 'maintenance', 'reserved'),
            images: fc.array(fc.string()),
            maintenanceHistory: fc.array(fc.record({
              date: fc.date(),
              description: fc.string(),
              cost: fc.option(fc.float({ min: 0 }), { nil: undefined })
            })),
            createdAt: fc.date(),
            updatedAt: fc.date()
          }),
          // Generator for valid date range (checkIn before checkOut)
          fc.integer({ min: 1, max: 365 }).chain(daysFromNow => 
            fc.tuple(
              fc.constant(new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)),
              fc.integer({ min: 1, max: 30 }).map(additionalDays => 
                new Date(Date.now() + (daysFromNow + additionalDays) * 24 * 60 * 60 * 1000)
              )
            )
          ),
          // Generator for number of guests (within capacity)
          fc.integer({ min: 1, max: 10 }),
          (accommodation: IAccommodation, [checkIn, checkOut]: [Date, Date], numberOfGuests: number) => {
            // Ensure numberOfGuests doesn't exceed capacity
            const validNumberOfGuests = Math.min(numberOfGuests, accommodation.capacity.maxGuests);
            
            const input: PricingCalculationInput = {
              accommodation,
              checkIn,
              checkOut,
              numberOfGuests: validNumberOfGuests
            };

            // Execute pricing calculation
            const result = BookingPricingCalculator.calculatePricingDetails(input);
            const { pricingDetails, calculationBreakdown } = result;

            // Verify pricing mode matches accommodation configuration (Requirement 3.2)
            expect(pricingDetails.mode).toBe(accommodation.pricingMode);
            expect(calculationBreakdown.appliedMode).toBe(accommodation.pricingMode);

            // Verify unit price uses seasonal price if available, otherwise base price (Requirement 3.3)
            const expectedUnitPrice = accommodation.pricing.seasonalPrice || accommodation.pricing.basePrice;
            expect(pricingDetails.unitPrice).toBe(expectedUnitPrice);
            expect(calculationBreakdown.effectivePrice).toBe(expectedUnitPrice);

            // Verify quantity calculation based on pricing mode (Requirement 3.4)
            const timeDiff = checkOut.getTime() - checkIn.getTime();
            let expectedQuantity: number;
            
            switch (accommodation.pricingMode) {
              case 'nightly':
                expectedQuantity = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                break;
              case 'hourly':
                expectedQuantity = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60)));
                break;
              case 'monthly':
                const yearDiff = checkOut.getFullYear() - checkIn.getFullYear();
                const monthDiff = checkOut.getMonth() - checkIn.getMonth();
                const dayDiff = checkOut.getDate() - checkIn.getDate();
                let totalMonths = yearDiff * 12 + monthDiff;
                if (dayDiff > 0) totalMonths += 1;
                expectedQuantity = Math.max(1, totalMonths);
                break;
              default:
                expectedQuantity = 1;
            }
            
            expect(pricingDetails.quantity).toBe(expectedQuantity);

            // Verify subtotal calculation (Requirement 3.5)
            const expectedSubtotal = expectedUnitPrice * expectedQuantity;
            expect(pricingDetails.subtotal).toBe(expectedSubtotal);

            // Verify total calculation includes discount and tax (Requirement 3.5)
            const discount = pricingDetails.discount || 0;
            const tax = pricingDetails.tax || 0;
            const expectedTotal = expectedSubtotal - discount + tax;
            expect(pricingDetails.total).toBe(expectedTotal);

            // Verify discount logic for nightly bookings
            if (accommodation.pricingMode === 'nightly') {
              const durationInDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
              if (durationInDays >= 30) {
                expect(pricingDetails.discount).toBe(expectedSubtotal * 0.15);
              } else if (durationInDays >= 14) {
                expect(pricingDetails.discount).toBe(expectedSubtotal * 0.10);
              } else if (durationInDays >= 7) {
                expect(pricingDetails.discount).toBe(expectedSubtotal * 0.05);
              } else {
                expect(pricingDetails.discount).toBeUndefined();
              }
            }

            // Verify all required pricing fields are present and valid
            expect(pricingDetails.mode).toBeDefined();
            expect(pricingDetails.unitPrice).toBeGreaterThan(0);
            expect(pricingDetails.quantity).toBeGreaterThan(0);
            expect(pricingDetails.subtotal).toBeGreaterThanOrEqual(0);
            expect(pricingDetails.total).toBeGreaterThanOrEqual(0);

            // Verify calculation breakdown contains all required information
            expect(calculationBreakdown.basePrice).toBe(accommodation.pricing.basePrice);
            expect(calculationBreakdown.durationInDays).toBeGreaterThan(0);
            expect(calculationBreakdown.durationInHours).toBeGreaterThan(0);
            expect(calculationBreakdown.durationInMonths).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    /**
     * **Feature: booking-validation-fix, Property 3: Automatic pricing completion**
     * **Validates: Requirements 1.3, 1.5**
     * 
     * For any booking creation with accommodation data, the system should automatically 
     * populate all required pricing details (mode, unitPrice, quantity, subtotal, total)
     */
    test('Property 3: Automatic pricing completion', () => {
      fc.assert(
        fc.property(
          // Generator for valid accommodation data
          fc.record({
            _id: fc.constant(new Types.ObjectId()),
            establishmentId: fc.constant(new Types.ObjectId()),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('standard_room', 'suite', 'house', 'apartment'),
            pricingMode: fc.constantFrom('nightly', 'monthly', 'hourly') as fc.Arbitrary<AccommodationPricingMode>,
            pricing: fc.record({
              basePrice: fc.float({ min: 10, max: 1000, noNaN: true }),
              seasonalPrice: fc.option(fc.float({ min: 10, max: 1500, noNaN: true }), { nil: undefined }),
              currency: fc.constant('BIF' as const)
            }),
            capacity: fc.record({
              maxGuests: fc.integer({ min: 1, max: 10 }),
              bedrooms: fc.integer({ min: 0, max: 5 }),
              bathrooms: fc.integer({ min: 0, max: 3 }),
              showers: fc.integer({ min: 0, max: 3 }),
              livingRooms: fc.integer({ min: 0, max: 2 }),
              kitchens: fc.integer({ min: 0, max: 2 }),
              balconies: fc.integer({ min: 0, max: 3 })
            }),
            details: fc.record({}),
            amenities: fc.array(fc.string()),
            status: fc.constantFrom('available', 'occupied', 'maintenance', 'reserved'),
            images: fc.array(fc.string()),
            maintenanceHistory: fc.array(fc.record({
              date: fc.date(),
              description: fc.string(),
              cost: fc.option(fc.float({ min: 0 }), { nil: undefined })
            })),
            createdAt: fc.date(),
            updatedAt: fc.date()
          }),
          // Generator for valid date range
          fc.integer({ min: 1, max: 365 }).chain(daysFromNow => 
            fc.tuple(
              fc.constant(new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)),
              fc.integer({ min: 1, max: 30 }).map(additionalDays => 
                new Date(Date.now() + (daysFromNow + additionalDays) * 24 * 60 * 60 * 1000)
              )
            )
          ),
          // Generator for number of guests
          fc.integer({ min: 1, max: 10 }),
          (accommodation: IAccommodation, [checkIn, checkOut]: [Date, Date], numberOfGuests: number) => {
            // Ensure numberOfGuests doesn't exceed capacity
            const validNumberOfGuests = Math.min(numberOfGuests, accommodation.capacity.maxGuests);
            
            const input: PricingCalculationInput = {
              accommodation,
              checkIn,
              checkOut,
              numberOfGuests: validNumberOfGuests
            };

            // Execute pricing calculation
            const result = BookingPricingCalculator.calculatePricingDetails(input);
            const { pricingDetails } = result;

            // Verify all required pricing details are automatically populated (Requirement 1.3, 1.5)
            
            // 1. Mode should be populated from accommodation
            expect(pricingDetails.mode).toBeDefined();
            expect(['nightly', 'monthly', 'hourly']).toContain(pricingDetails.mode);

            // 2. Unit price should be populated (seasonal or base price)
            expect(pricingDetails.unitPrice).toBeDefined();
            expect(pricingDetails.unitPrice).toBeGreaterThan(0);
            expect(typeof pricingDetails.unitPrice).toBe('number');

            // 3. Quantity should be calculated and populated
            expect(pricingDetails.quantity).toBeDefined();
            expect(pricingDetails.quantity).toBeGreaterThan(0);
            expect(typeof pricingDetails.quantity).toBe('number');
            expect(Number.isInteger(pricingDetails.quantity)).toBe(true);

            // 4. Subtotal should be calculated and populated
            expect(pricingDetails.subtotal).toBeDefined();
            expect(pricingDetails.subtotal).toBeGreaterThanOrEqual(0);
            expect(typeof pricingDetails.subtotal).toBe('number');

            // 5. Total should be calculated and populated
            expect(pricingDetails.total).toBeDefined();
            expect(pricingDetails.total).toBeGreaterThanOrEqual(0);
            expect(typeof pricingDetails.total).toBe('number');

            // 6. Verify mathematical consistency
            const expectedSubtotal = pricingDetails.unitPrice * pricingDetails.quantity;
            expect(pricingDetails.subtotal).toBe(expectedSubtotal);

            const discount = pricingDetails.discount || 0;
            const tax = pricingDetails.tax || 0;
            const expectedTotal = pricingDetails.subtotal - discount + tax;
            expect(pricingDetails.total).toBe(expectedTotal);

            // 7. Verify optional fields are properly handled
            if (pricingDetails.discount !== undefined) {
              expect(pricingDetails.discount).toBeGreaterThanOrEqual(0);
              expect(typeof pricingDetails.discount).toBe('number');
            }

            if (pricingDetails.tax !== undefined) {
              expect(pricingDetails.tax).toBeGreaterThanOrEqual(0);
              expect(typeof pricingDetails.tax).toBe('number');
            }

            // 8. Verify the pricing details structure matches the expected interface
            const requiredFields: (keyof PricingDetails)[] = ['mode', 'unitPrice', 'quantity', 'subtotal', 'total'];
            for (const field of requiredFields) {
              expect(pricingDetails).toHaveProperty(field);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });
  });

  describe('Unit Tests', () => {
    const createMockAccommodation = (overrides: Partial<IAccommodation> = {}): IAccommodation => ({
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
      updatedAt: new Date(),
      ...overrides
    });

    test('should calculate nightly pricing correctly', () => {
      const accommodation = createMockAccommodation({
        pricingMode: 'nightly',
        pricing: { basePrice: 100, currency: 'BIF' }
      });

      const checkIn = new Date('2024-12-15');
      const checkOut = new Date('2024-12-17'); // 2 nights

      const result = BookingPricingCalculator.calculatePricingDetails({
        accommodation,
        checkIn,
        checkOut,
        numberOfGuests: 2
      });

      expect(result.pricingDetails.mode).toBe('nightly');
      expect(result.pricingDetails.unitPrice).toBe(100);
      expect(result.pricingDetails.quantity).toBe(2);
      expect(result.pricingDetails.subtotal).toBe(200);
      expect(result.pricingDetails.total).toBe(200);
    });

    test('should use seasonal price when available', () => {
      const accommodation = createMockAccommodation({
        pricing: { basePrice: 100, seasonalPrice: 150, currency: 'BIF' }
      });

      const checkIn = new Date('2024-12-15');
      const checkOut = new Date('2024-12-16');

      const result = BookingPricingCalculator.calculatePricingDetails({
        accommodation,
        checkIn,
        checkOut,
        numberOfGuests: 1
      });

      expect(result.pricingDetails.unitPrice).toBe(150);
    });

    test('should apply discount for long stays', () => {
      const accommodation = createMockAccommodation({
        pricingMode: 'nightly',
        pricing: { basePrice: 100, currency: 'BIF' }
      });

      const checkIn = new Date('2024-12-01');
      const checkOut = new Date('2024-12-08'); // 7 nights

      const result = BookingPricingCalculator.calculatePricingDetails({
        accommodation,
        checkIn,
        checkOut,
        numberOfGuests: 1
      });

      expect(result.pricingDetails.subtotal).toBe(700);
      expect(result.pricingDetails.discount).toBe(35); // 5% discount
      expect(result.pricingDetails.total).toBe(665);
    });

    test('should calculate hourly pricing correctly', () => {
      const accommodation = createMockAccommodation({
        pricingMode: 'hourly',
        pricing: { basePrice: 10, currency: 'BIF' }
      });

      const checkIn = new Date('2024-12-15T10:00:00');
      const checkOut = new Date('2024-12-15T15:00:00'); // 5 hours

      const result = BookingPricingCalculator.calculatePricingDetails({
        accommodation,
        checkIn,
        checkOut,
        numberOfGuests: 1
      });

      expect(result.pricingDetails.mode).toBe('hourly');
      expect(result.pricingDetails.quantity).toBe(5);
      expect(result.pricingDetails.subtotal).toBe(50);
    });

    test('should calculate monthly pricing correctly', () => {
      const accommodation = createMockAccommodation({
        pricingMode: 'monthly',
        pricing: { basePrice: 2000, currency: 'BIF' }
      });

      const checkIn = new Date('2024-12-01');
      const checkOut = new Date('2025-02-15'); // ~2.5 months

      const result = BookingPricingCalculator.calculatePricingDetails({
        accommodation,
        checkIn,
        checkOut,
        numberOfGuests: 1
      });

      expect(result.pricingDetails.mode).toBe('monthly');
      expect(result.pricingDetails.quantity).toBe(3); // Rounded up
      expect(result.pricingDetails.subtotal).toBe(6000);
    });

    test('should throw error for invalid input', () => {
      expect(() => {
        BookingPricingCalculator.calculatePricingDetails(null as any);
      }).toThrow('Pricing calculation input is required');
    });

    test('should throw error for missing accommodation pricing', () => {
      const accommodation = createMockAccommodation();
      delete (accommodation as any).pricing;

      expect(() => {
        BookingPricingCalculator.calculatePricingDetails({
          accommodation,
          checkIn: new Date('2024-12-15'),
          checkOut: new Date('2024-12-16'),
          numberOfGuests: 1
        });
      }).toThrow('Accommodation pricing information is required');
    });

    test('should throw error when checkOut is before checkIn', () => {
      const accommodation = createMockAccommodation();

      expect(() => {
        BookingPricingCalculator.calculatePricingDetails({
          accommodation,
          checkIn: new Date('2024-12-16'),
          checkOut: new Date('2024-12-15'),
          numberOfGuests: 1
        });
      }).toThrow('Check-out date must be after check-in date');
    });

    test('should throw error when guests exceed capacity', () => {
      const accommodation = createMockAccommodation({
        capacity: { maxGuests: 2, bedrooms: 1, bathrooms: 1, showers: 1, livingRooms: 1, kitchens: 0, balconies: 0 }
      });

      expect(() => {
        BookingPricingCalculator.calculatePricingDetails({
          accommodation,
          checkIn: new Date('2024-12-15'),
          checkOut: new Date('2024-12-16'),
          numberOfGuests: 5
        });
      }).toThrow('Number of guests exceeds accommodation capacity');
    });
  });
});