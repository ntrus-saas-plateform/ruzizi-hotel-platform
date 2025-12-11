import { BookingFieldMapper, FrontendBookingData } from '../booking-field-mapper';

describe('BookingFieldMapper Integration', () => {
  test('should integrate with existing booking API data structure', () => {
    // Simulate data as it would come from the frontend booking form
    const frontendBookingData: FrontendBookingData = {
      establishmentId: '507f1f77bcf86cd799439011',
      accommodationId: '507f1f77bcf86cd799439012',
      checkInDate: '2025-12-15T00:00:00.000Z',
      checkOutDate: '2025-12-17T00:00:00.000Z',
      numberOfNights: 2,
      mainClient: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        idNumber: 'ID123456',
        address: '123 Main St',
        city: 'Anytown',
        country: 'Country',
        nationality: 'Nationality',
        gender: 'male',
        customerType: 'individual',
        preferredLanguage: 'en'
      },
      numberOfGuests: 2,
      guests: [
        {
          firstName: 'Jane',
          lastName: 'Doe',
          relationshipToMainClient: 'spouse',
          isMinor: false
        }
      ],
      specialRequests: 'Late check-in requested',
      arrivalTime: '18:00',
      totalAmount: 200.00,
      pricingDetails: {
        mode: 'nightly',
        unitPrice: 100.00,
        quantity: 2,
        subtotal: 200.00,
        total: 200.00
      }
    };

    // Map the frontend data to database model format
    const mappedData = BookingFieldMapper.mapFrontendToModel(frontendBookingData);

    // Verify the mapping matches what the database model expects
    expect(mappedData.establishmentId).toBe('507f1f77bcf86cd799439011');
    expect(mappedData.accommodationId).toBe('507f1f77bcf86cd799439012');
    
    // Verify date field mapping
    expect(mappedData.checkIn).toBeInstanceOf(Date);
    expect(mappedData.checkOut).toBeInstanceOf(Date);
    expect(mappedData.checkIn.toISOString()).toBe('2025-12-15T00:00:00.000Z');
    expect(mappedData.checkOut.toISOString()).toBe('2025-12-17T00:00:00.000Z');

    // Verify client info mapping (mainClient → clientInfo)
    expect(mappedData.clientInfo).toBeDefined();
    expect(mappedData.clientInfo.firstName).toBe('John');
    expect(mappedData.clientInfo.lastName).toBe('Doe');
    expect(mappedData.clientInfo.email).toBe('john.doe@example.com');
    expect(mappedData.clientInfo.phone).toBe('1234567890');
    expect(mappedData.clientInfo.idNumber).toBe('ID123456');
    expect(mappedData.clientInfo.address).toBe('123 Main St');
    expect(mappedData.clientInfo.city).toBe('Anytown');
    expect(mappedData.clientInfo.country).toBe('Country');

    // Verify other fields are preserved
    expect(mappedData.numberOfGuests).toBe(2);
    expect(mappedData.guests).toEqual(frontendBookingData.guests);
    expect(mappedData.specialRequests).toBe('Late check-in requested');
    expect(mappedData.arrivalTime).toBe('18:00');
    expect(mappedData.totalAmount).toBe(200.00);
    expect(mappedData.pricingDetails).toEqual(frontendBookingData.pricingDetails);

    // Validate the mapped data
    const validation = BookingFieldMapper.validateRequiredFields(mappedData);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.missingFields).toHaveLength(0);
  });

  test('should handle minimal required data correctly', () => {
    const minimalFrontendData: FrontendBookingData = {
      establishmentId: '507f1f77bcf86cd799439011',
      accommodationId: '507f1f77bcf86cd799439012',
      checkInDate: '2025-12-15T00:00:00.000Z',
      checkOutDate: '2025-12-17T00:00:00.000Z',
      numberOfNights: 2,
      mainClient: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890'
      },
      numberOfGuests: 1
    };

    const mappedData = BookingFieldMapper.mapFrontendToModel(minimalFrontendData);
    const validation = BookingFieldMapper.validateRequiredFields(mappedData);

    expect(validation.isValid).toBe(true);
    expect(mappedData.clientInfo.firstName).toBe('John');
    expect(mappedData.clientInfo.lastName).toBe('Doe');
    expect(mappedData.checkIn).toBeInstanceOf(Date);
    expect(mappedData.checkOut).toBeInstanceOf(Date);
  });

  test('should validate and catch missing required fields', () => {
    const invalidFrontendData = {
      establishmentId: '',
      accommodationId: '507f1f77bcf86cd799439012',
      checkInDate: '2025-12-15T00:00:00.000Z',
      checkOutDate: '2025-12-17T00:00:00.000Z',
      numberOfNights: 2,
      mainClient: {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '123' // Too short
      },
      numberOfGuests: 0 // Invalid
    } as FrontendBookingData;

    const mappedData = BookingFieldMapper.mapFrontendToModel(invalidFrontendData);
    const validation = BookingFieldMapper.validateRequiredFields(mappedData);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.missingFields).toContain('establishmentId');
    expect(validation.errors.some(error => error.includes('email'))).toBe(true);
    expect(validation.errors.some(error => error.includes('Phone number'))).toBe(true);
    expect(validation.errors.some(error => error.includes('numberOfGuests'))).toBe(true);
  });
});