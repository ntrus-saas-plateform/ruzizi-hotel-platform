import {
  FrontendBookingSchema,
  CreateBookingSchema,
  CompleteBookingSchema,
  UpdateBookingSchema,
  PricingDetailsSchema,
  ClientInfoSchema,
  GuestInfoSchema,
  BookingPricingModeSchema,
} from '../booking.validation';

describe('Booking Validation Schemas', () => {
  describe('ClientInfoSchema', () => {
    const validClientInfo = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
    };

    it('should validate valid client info with required fields only', () => {
      const result = ClientInfoSchema.safeParse(validClientInfo);
      expect(result.success).toBe(true);
    });

    it('should validate client info with all optional fields', () => {
      const completeClientInfo = {
        ...validClientInfo,
        idNumber: 'ID123456',
        address: '123 Main St',
        city: 'New York',
        country: 'USA',
        nationality: 'American',
        gender: 'Male',
        dateOfBirth: '1990-01-01',
        customerType: 'Regular',
        companyName: 'Acme Corp',
        loyaltyCardNumber: 'LOYAL123',
        preferredLanguage: 'en',
        notes: 'VIP customer',
      };

      const result = ClientInfoSchema.safeParse(completeClientInfo);
      expect(result.success).toBe(true);
    });

    it('should reject client info with missing required fields', () => {
      const incompleteClientInfo = {
        firstName: 'John',
        // Missing lastName, email, phone
      };

      const result = ClientInfoSchema.safeParse(incompleteClientInfo);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(3); // lastName, email, phone
    });

    it('should reject client info with invalid email format', () => {
      const invalidEmailClientInfo = {
        ...validClientInfo,
        email: 'invalid-email',
      };

      const result = ClientInfoSchema.safeParse(invalidEmailClientInfo);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid email address');
    });

    it('should reject client info with phone number too short', () => {
      const shortPhoneClientInfo = {
        ...validClientInfo,
        phone: '123', // Too short
      };

      const result = ClientInfoSchema.safeParse(shortPhoneClientInfo);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Phone number must be at least 8 characters');
    });
  });

  describe('GuestInfoSchema', () => {
    const validGuestInfo = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should validate valid guest info with required fields only', () => {
      const result = GuestInfoSchema.safeParse(validGuestInfo);
      expect(result.success).toBe(true);
    });

    it('should validate guest info with optional fields', () => {
      const completeGuestInfo = {
        ...validGuestInfo,
        relationshipToMainClient: 'Spouse',
        isMinor: false,
      };

      const result = GuestInfoSchema.safeParse(completeGuestInfo);
      expect(result.success).toBe(true);
    });

    it('should reject guest info with missing required fields', () => {
      const incompleteGuestInfo = {
        firstName: 'Jane',
        // Missing lastName
      };

      const result = GuestInfoSchema.safeParse(incompleteGuestInfo);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('lastName');
    });
  });

  describe('PricingDetailsSchema', () => {
    const validPricingDetails = {
      mode: 'nightly' as const,
      unitPrice: 100,
      quantity: 3,
      subtotal: 300,
      total: 300,
    };

    it('should validate valid pricing details with required fields only', () => {
      const result = PricingDetailsSchema.safeParse(validPricingDetails);
      expect(result.success).toBe(true);
    });

    it('should validate pricing details with optional discount and tax', () => {
      const completePricingDetails = {
        ...validPricingDetails,
        discount: 30,
        tax: 27,
        total: 297, // 300 - 30 + 27
      };

      const result = PricingDetailsSchema.safeParse(completePricingDetails);
      expect(result.success).toBe(true);
    });

    it('should reject pricing details with negative unit price', () => {
      const invalidPricingDetails = {
        ...validPricingDetails,
        unitPrice: -100,
      };

      const result = PricingDetailsSchema.safeParse(invalidPricingDetails);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Unit price must be positive');
    });

    it('should reject pricing details with zero quantity', () => {
      const invalidPricingDetails = {
        ...validPricingDetails,
        quantity: 0,
      };

      const result = PricingDetailsSchema.safeParse(invalidPricingDetails);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Quantity must be a positive integer');
    });

    it('should reject pricing details with invalid pricing mode', () => {
      const invalidPricingDetails = {
        ...validPricingDetails,
        mode: 'invalid-mode',
      };

      const result = PricingDetailsSchema.safeParse(invalidPricingDetails);
      expect(result.success).toBe(false);
    });
  });

  describe('FrontendBookingSchema', () => {
    // Use future dates for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

    const validFrontendBooking = {
      establishmentId: 'est123',
      accommodationId: 'acc123',
      checkInDate: tomorrow.toISOString().split('T')[0],
      checkOutDate: dayAfterTomorrow.toISOString().split('T')[0],
      numberOfNights: 3,
      mainClient: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
      },
      numberOfGuests: 2,
    };

    it('should validate valid frontend booking with properly mapped field names', () => {
      const result = FrontendBookingSchema.safeParse(validFrontendBooking);
      expect(result.success).toBe(true);
    });

    it('should validate frontend booking with optional fields', () => {
      const completeBooking = {
        ...validFrontendBooking,
        guests: [
          {
            firstName: 'Jane',
            lastName: 'Smith',
            relationshipToMainClient: 'Spouse',
          },
        ],
        specialRequests: 'Late check-in',
        arrivalTime: '18:00',
        totalAmount: 300,
        pricingDetails: {
          mode: 'nightly' as const,
          unitPrice: 100,
        },
      };

      const result = FrontendBookingSchema.safeParse(completeBooking);
      expect(result.success).toBe(true);
    });

    it('should reject frontend booking with check-out before check-in', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const earlierDate = new Date();
      earlierDate.setDate(earlierDate.getDate() + 2);

      const invalidBooking = {
        ...validFrontendBooking,
        checkInDate: futureDate.toISOString().split('T')[0],
        checkOutDate: earlierDate.toISOString().split('T')[0], // Before check-in
      };

      const result = FrontendBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Check-out date must be after check-in date');
    });

    it('should reject frontend booking with check-in in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const invalidBooking = {
        ...validFrontendBooking,
        checkInDate: pastDate.toISOString().split('T')[0],
      };

      const result = FrontendBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Check-in date cannot be in the past');
    });

    it('should reject frontend booking with missing required fields', () => {
      const incompleteBooking = {
        establishmentId: 'est123',
        // Missing accommodationId, dates, mainClient, etc.
      };

      const result = FrontendBookingSchema.safeParse(incompleteBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('CreateBookingSchema', () => {
    // Use future dates for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

    const validCreateBooking = {
      establishmentId: 'est123',
      accommodationId: 'acc123',
      checkIn: tomorrow,
      checkOut: dayAfterTomorrow,
      clientInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
      },
      numberOfGuests: 2,
    };

    it('should validate valid create booking with properly mapped field names', () => {
      const result = CreateBookingSchema.safeParse(validCreateBooking);
      expect(result.success).toBe(true);
    });

    it('should validate create booking with complete pricing details', () => {
      const completeBooking = {
        ...validCreateBooking,
        pricingDetails: {
          mode: 'nightly' as const,
          unitPrice: 100,
          quantity: 3,
          subtotal: 300,
          total: 300,
        },
      };

      const result = CreateBookingSchema.safeParse(completeBooking);
      expect(result.success).toBe(true);
    });

    it('should reject create booking with invalid date order', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const earlierDate = new Date();
      earlierDate.setDate(earlierDate.getDate() + 2);

      const invalidBooking = {
        ...validCreateBooking,
        checkIn: futureDate,
        checkOut: earlierDate,
      };

      const result = CreateBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Check-out date must be after check-in date');
    });

    it('should reject create booking with past check-in date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const invalidBooking = {
        ...validCreateBooking,
        checkIn: pastDate,
      };

      const result = CreateBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Check-in date cannot be in the past');
    });
  });

  describe('CompleteBookingSchema', () => {
    // Use future dates for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

    const validCompleteBooking = {
      establishmentId: 'est123',
      accommodationId: 'acc123',
      checkIn: tomorrow,
      checkOut: dayAfterTomorrow,
      clientInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
      },
      numberOfGuests: 2,
      pricingDetails: {
        mode: 'nightly' as const,
        unitPrice: 100,
        quantity: 3,
        subtotal: 300,
        total: 300,
      },
    };

    it('should validate complete booking with required pricing details', () => {
      const result = CompleteBookingSchema.safeParse(validCompleteBooking);
      expect(result.success).toBe(true);
    });

    it('should reject complete booking without pricing details', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

      const incompleteBooking = {
        establishmentId: 'est123',
        accommodationId: 'acc123',
        checkIn: tomorrow,
        checkOut: dayAfterTomorrow,
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
        },
        numberOfGuests: 2,
        // Missing pricingDetails
      };

      const result = CompleteBookingSchema.safeParse(incompleteBooking);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('pricingDetails');
    });
  });

  describe('UpdateBookingSchema', () => {
    it('should validate update booking with partial data', () => {
      const partialUpdate = {
        numberOfGuests: 3,
        specialRequests: 'Updated request',
      };

      const result = UpdateBookingSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate update booking with new pricing details', () => {
      const updateWithPricing = {
        pricingDetails: {
          mode: 'monthly' as const,
          unitPrice: 2000,
          quantity: 1,
          subtotal: 2000,
          total: 2000,
        },
      };

      const result = UpdateBookingSchema.safeParse(updateWithPricing);
      expect(result.success).toBe(true);
    });

    it('should reject update booking with invalid date order', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const earlierDate = new Date();
      earlierDate.setDate(earlierDate.getDate() + 2);

      const invalidUpdate = {
        checkIn: futureDate,
        checkOut: earlierDate,
      };

      const result = UpdateBookingSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Check-out date must be after check-in date');
    });
  });

  describe('Validation Error Messages', () => {
    it('should provide specific error messages for missing fields', () => {
      const emptyBooking = {};

      const result = FrontendBookingSchema.safeParse(emptyBooking);
      expect(result.success).toBe(false);
      
      const errorPaths = result.error?.issues.map(issue => issue.path[0]) || [];
      expect(errorPaths).toContain('establishmentId');
      expect(errorPaths).toContain('accommodationId');
      expect(errorPaths).toContain('checkInDate');
      expect(errorPaths).toContain('checkOutDate');
      expect(errorPaths).toContain('numberOfNights');
      expect(errorPaths).toContain('mainClient');
      expect(errorPaths).toContain('numberOfGuests');
    });

    it('should provide specific error messages for invalid field types', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

      const invalidBooking = {
        establishmentId: 123, // Should be string
        accommodationId: 'acc123',
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: dayAfterTomorrow.toISOString().split('T')[0],
        numberOfNights: 'three', // Should be number
        mainClient: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
        },
        numberOfGuests: 2,
      };

      const result = FrontendBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
      
      const errorMessages = result.error?.issues.map(issue => issue.message) || [];
      // Check for type validation errors by looking at the error codes and paths
      const hasStringTypeError = result.error?.issues.some(issue => 
        issue.code === 'invalid_type' && issue.expected === 'string'
      ) || false;
      const hasNumberTypeError = result.error?.issues.some(issue => 
        issue.code === 'invalid_type' && issue.expected === 'number'
      ) || false;
      
      expect(hasStringTypeError).toBe(true);
      expect(hasNumberTypeError).toBe(true);
    });
  });
});