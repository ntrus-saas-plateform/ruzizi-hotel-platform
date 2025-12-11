import * as fc from 'fast-check';
import { BookingFieldMapper, FrontendBookingData, ClientInfo, GuestInfo } from '../booking-field-mapper';

describe('BookingFieldMapper', () => {
  describe('Property-Based Tests', () => {
    /**
     * **Feature: booking-validation-fix, Property 2: Field mapping correctness**
     * **Validates: Requirements 1.2, 1.4, 2.2, 2.3, 2.4**
     * 
     * For any frontend booking data, the field mapping should correctly transform 
     * checkInDate to checkIn, checkOutDate to checkOut, and mainClient to clientInfo
     */
    test('Property 2: Field mapping correctness', () => {
      fc.assert(
        fc.property(
          // Generator for valid frontend booking data
          fc.record({
            establishmentId: fc.string({ minLength: 1, maxLength: 24 }),
            accommodationId: fc.string({ minLength: 1, maxLength: 24 }),
            checkInDate: fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 }).map(ms => new Date(ms).toISOString()),
            checkOutDate: fc.integer({ min: Date.now() + 24 * 60 * 60 * 1000, max: Date.now() + 366 * 24 * 60 * 60 * 1000 }).map(ms => new Date(ms).toISOString()),
            numberOfNights: fc.integer({ min: 1, max: 30 }),
            mainClient: fc.record({
              firstName: fc.string({ minLength: 1, maxLength: 50 }),
              lastName: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
              phone: fc.string({ minLength: 8, maxLength: 20 }),
              idNumber: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              address: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
              city: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              country: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              nationality: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              gender: fc.option(fc.constantFrom('male', 'female', 'other'), { nil: undefined }),
              dateOfBirth: fc.option(fc.integer({ min: new Date('1920-01-01').getTime(), max: new Date('2010-01-01').getTime() }).map(ms => new Date(ms).toISOString()), { nil: undefined }),
              customerType: fc.option(fc.constantFrom('individual', 'corporate'), { nil: undefined }),
              companyName: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
              loyaltyCardNumber: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
              preferredLanguage: fc.option(fc.constantFrom('en', 'fr', 'es'), { nil: undefined }),
              notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
            }),
            numberOfGuests: fc.integer({ min: 1, max: 10 }),
            guests: fc.option(fc.array(fc.record({
              firstName: fc.string({ minLength: 1, maxLength: 50 }),
              lastName: fc.string({ minLength: 1, maxLength: 50 }),
              relationshipToMainClient: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
              isMinor: fc.option(fc.boolean(), { nil: undefined })
            }), { maxLength: 5 }), { nil: undefined }),
            specialRequests: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            arrivalTime: fc.option(fc.string({ maxLength: 10 }), { nil: undefined }),
            totalAmount: fc.option(fc.float({ min: 0, max: 10000 }), { nil: undefined }),
            pricingDetails: fc.option(fc.record({
              mode: fc.constantFrom('nightly', 'monthly', 'hourly'),
              unitPrice: fc.float({ min: 0, max: 1000 }),
              quantity: fc.integer({ min: 1, max: 30 }),
              subtotal: fc.float({ min: 0, max: 10000 }),
              discount: fc.option(fc.float({ min: 0, max: 1000 }), { nil: undefined }),
              tax: fc.option(fc.float({ min: 0, max: 1000 }), { nil: undefined }),
              total: fc.float({ min: 0, max: 10000 })
            }), { nil: undefined })
          }).filter(data => {
            // Ensure checkOut is after checkIn
            const checkIn = new Date(data.checkInDate);
            const checkOut = new Date(data.checkOutDate);
            return checkOut > checkIn;
          }),
          (frontendData: FrontendBookingData) => {
            // Execute the mapping
            const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);

            // Verify field mapping correctness
            
            // 1. checkInDate should map to checkIn (Date object)
            expect(mappedData.checkIn).toBeInstanceOf(Date);
            expect(mappedData.checkIn.toISOString()).toBe(new Date(frontendData.checkInDate).toISOString());

            // 2. checkOutDate should map to checkOut (Date object)
            expect(mappedData.checkOut).toBeInstanceOf(Date);
            expect(mappedData.checkOut.toISOString()).toBe(new Date(frontendData.checkOutDate).toISOString());

            // 3. mainClient should map to clientInfo structure
            expect(mappedData.clientInfo).toBeDefined();
            expect(mappedData.clientInfo.firstName).toBe(frontendData.mainClient.firstName);
            expect(mappedData.clientInfo.lastName).toBe(frontendData.mainClient.lastName);
            expect(mappedData.clientInfo.email).toBe(frontendData.mainClient.email);
            expect(mappedData.clientInfo.phone).toBe(frontendData.mainClient.phone);

            // 4. Optional client fields should be preserved
            if (frontendData.mainClient.idNumber) {
              expect(mappedData.clientInfo.idNumber).toBe(frontendData.mainClient.idNumber);
            }
            if (frontendData.mainClient.address) {
              expect(mappedData.clientInfo.address).toBe(frontendData.mainClient.address);
            }
            if (frontendData.mainClient.city) {
              expect(mappedData.clientInfo.city).toBe(frontendData.mainClient.city);
            }

            // 5. Other fields should be preserved unchanged
            expect(mappedData.establishmentId).toBe(frontendData.establishmentId);
            expect(mappedData.accommodationId).toBe(frontendData.accommodationId);
            expect(mappedData.numberOfGuests).toBe(frontendData.numberOfGuests);

            // 6. Optional fields should be preserved if present
            if (frontendData.guests) {
              expect(mappedData.guests).toEqual(frontendData.guests);
            }
            if (frontendData.specialRequests) {
              expect(mappedData.specialRequests).toBe(frontendData.specialRequests);
            }
            if (frontendData.arrivalTime) {
              expect(mappedData.arrivalTime).toBe(frontendData.arrivalTime);
            }
            if (frontendData.totalAmount) {
              expect(mappedData.totalAmount).toBe(frontendData.totalAmount);
            }
            if (frontendData.pricingDetails) {
              expect(mappedData.pricingDetails).toEqual(frontendData.pricingDetails);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    /**
     * Property test for validation after mapping
     */
    test('Property: Validation succeeds for properly mapped valid data', () => {
      fc.assert(
        fc.property(
          // Generator for valid frontend booking data
          fc.record({
            establishmentId: fc.string({ minLength: 1, maxLength: 24 }),
            accommodationId: fc.string({ minLength: 1, maxLength: 24 }),
            checkInDate: fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 }).map(ms => new Date(ms).toISOString()),
            checkOutDate: fc.integer({ min: Date.now() + 24 * 60 * 60 * 1000, max: Date.now() + 366 * 24 * 60 * 60 * 1000 }).map(ms => new Date(ms).toISOString()),
            numberOfNights: fc.integer({ min: 1, max: 30 }),
            mainClient: fc.record({
              firstName: fc.string({ minLength: 1, maxLength: 50 }),
              lastName: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
              phone: fc.string({ minLength: 8, maxLength: 20 }),
              idNumber: fc.option(fc.string({ maxLength: 50 }), { nil: undefined })
            }),
            numberOfGuests: fc.integer({ min: 1, max: 10 })
          }).filter(data => {
            // Ensure checkOut is after checkIn and checkIn is not in the past
            const checkIn = new Date(data.checkInDate);
            const checkOut = new Date(data.checkOutDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return checkOut > checkIn && checkIn >= now;
          }),
          (frontendData: FrontendBookingData) => {
            // Execute the mapping
            const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);
            
            // Validate the mapped data
            const validation = BookingFieldMapper.validateRequiredFields(mappedData);
            
            // For valid input data, validation should succeed
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
            expect(validation.missingFields).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    test('should map basic required fields correctly', () => {
      const frontendData: FrontendBookingData = {
        establishmentId: 'est123',
        accommodationId: 'acc456',
        checkInDate: '2024-12-15T00:00:00.000Z',
        checkOutDate: '2024-12-17T00:00:00.000Z',
        numberOfNights: 2,
        mainClient: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890'
        },
        numberOfGuests: 2
      };

      const mappedData = BookingFieldMapper.mapFrontendToModel(frontendData);

      expect(mappedData.checkIn).toEqual(new Date('2024-12-15T00:00:00.000Z'));
      expect(mappedData.checkOut).toEqual(new Date('2024-12-17T00:00:00.000Z'));
      expect(mappedData.clientInfo.firstName).toBe('John');
      expect(mappedData.clientInfo.lastName).toBe('Doe');
      expect(mappedData.clientInfo.email).toBe('john.doe@example.com');
      expect(mappedData.clientInfo.phone).toBe('1234567890');
    });

    test('should throw error for invalid date format', () => {
      const frontendData: FrontendBookingData = {
        establishmentId: 'est123',
        accommodationId: 'acc456',
        checkInDate: 'invalid-date',
        checkOutDate: '2024-12-17T00:00:00.000Z',
        numberOfNights: 2,
        mainClient: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890'
        },
        numberOfGuests: 2
      };

      expect(() => {
        BookingFieldMapper.mapFrontendToModel(frontendData);
      }).toThrow('Invalid date format for field \'checkInDate\'');
    });

    test('should throw error for missing mainClient', () => {
      const frontendData = {
        establishmentId: 'est123',
        accommodationId: 'acc456',
        checkInDate: '2024-12-15T00:00:00.000Z',
        checkOutDate: '2024-12-17T00:00:00.000Z',
        numberOfNights: 2,
        mainClient: null,
        numberOfGuests: 2
      } as any;

      expect(() => {
        BookingFieldMapper.mapFrontendToModel(frontendData);
      }).toThrow('Main client information is required');
    });

    test('should validate required fields and return errors for missing data', () => {
      const incompleteData = {
        establishmentId: '',
        accommodationId: 'acc456',
        checkIn: new Date('2024-12-15'),
        checkOut: new Date('2024-12-17'),
        clientInfo: {
          firstName: 'John',
          lastName: '',
          email: 'invalid-email',
          phone: '123'
        },
        numberOfGuests: 0
      } as any;

      const validation = BookingFieldMapper.validateRequiredFields(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.missingFields).toContain('establishmentId');
    });
  });
});