import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';

// Mock the database connection and models
jest.mock('@/lib/db');
jest.mock('@/models/Booking.model');
jest.mock('@/models/Accommodation.model');
jest.mock('@/models/Establishment.model');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockBookingModel = BookingModel as jest.Mocked<typeof BookingModel>;
const mockAccommodationModel = AccommodationModel as jest.Mocked<typeof AccommodationModel>;
const mockEstablishmentModel = EstablishmentModel as jest.Mocked<typeof EstablishmentModel>;

describe('POST /api/public/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: booking-validation-fix, Property 5: Error handling resilience**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
     * 
     * For any invalid booking data or system error, the system should provide specific error messages, 
     * handle failures gracefully, and maintain data consistency without partial booking creation
     */
    test('Property 5: Error handling resilience', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for error scenario type
          fc.constantFrom('field_mapping_error', 'validation_error', 'pricing_calculation_error', 'not_found_error', 'business_logic_error'),
          async (errorType) => {
            // Generate specific error scenario based on type
            let errorScenario: any;
            
            switch (errorType) {
              case 'field_mapping_error':
                errorScenario = {
                  type: 'field_mapping_error',
                  establishmentId: '000000000000000000000000',
                  accommodationId: '000000000000000000000001',
                  checkInDate: 'invalid-date',
                  checkOutDate: '2024-12-17T00:00:00.000Z',
                  numberOfNights: 1,
                  mainClient: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                  },
                  numberOfGuests: 1
                };
                break;
                
              case 'validation_error':
                errorScenario = {
                  type: 'validation_error',
                  establishmentId: '',
                  accommodationId: '000000000000000000000001',
                  checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  numberOfNights: 1,
                  mainClient: {
                    firstName: '',
                    lastName: 'Doe',
                    email: 'invalid-email',
                    phone: '123'
                  },
                  numberOfGuests: 0
                };
                break;
                
              case 'pricing_calculation_error':
                errorScenario = {
                  type: 'pricing_calculation_error',
                  establishmentId: '000000000000000000000000',
                  accommodationId: '000000000000000000000001',
                  checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  numberOfNights: 1,
                  mainClient: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                  },
                  numberOfGuests: 1,
                  accommodationPricingIssue: 'missing_base_price'
                };
                break;
                
              case 'not_found_error':
                errorScenario = {
                  type: 'not_found_error',
                  establishmentId: '000000000000000000000000',
                  accommodationId: '000000000000000000000001',
                  checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  numberOfNights: 1,
                  mainClient: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                  },
                  numberOfGuests: 1,
                  notFoundType: 'establishment'
                };
                break;
                
              case 'business_logic_error':
                errorScenario = {
                  type: 'business_logic_error',
                  establishmentId: '000000000000000000000000',
                  accommodationId: '000000000000000000000001',
                  checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  numberOfNights: 1,
                  mainClient: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                  },
                  numberOfGuests: 10, // Exceed capacity
                  businessError: 'capacity_exceeded'
                };
                break;
            }
            // Reset mocks for each test iteration
            jest.clearAllMocks();
            mockConnectDB.mockResolvedValue(undefined as any);

            // Setup mocks based on error scenario type
            switch (errorScenario.type) {
              case 'field_mapping_error':
                // No special mock setup needed - invalid data will trigger field mapping errors
                break;
                
              case 'validation_error':
                // No special mock setup needed - invalid data will trigger validation errors
                break;
                
              case 'pricing_calculation_error':
                // Mock establishment exists
                mockEstablishmentModel.findById.mockResolvedValue({
                  _id: errorScenario.establishmentId,
                  name: 'Test Hotel'
                } as any);

                // Mock accommodation with pricing issues
                let accommodationMock: any = {
                  _id: errorScenario.accommodationId,
                  status: 'available',
                  capacity: { maxGuests: 10 },
                  establishmentId: errorScenario.establishmentId
                };

                switch (errorScenario.accommodationPricingIssue) {
                  case 'missing_base_price':
                    accommodationMock.pricing = {};
                    accommodationMock.pricingMode = 'nightly';
                    break;
                  case 'invalid_pricing_mode':
                    accommodationMock.pricing = { basePrice: 100 };
                    accommodationMock.pricingMode = null;
                    break;
                  case 'missing_pricing_object':
                    accommodationMock.pricingMode = 'nightly';
                    // pricing object is missing entirely
                    break;
                }

                mockAccommodationModel.findOne.mockResolvedValue(accommodationMock);
                mockBookingModel.findOne.mockResolvedValue(null); // No conflicts
                break;
                
              case 'not_found_error':
                switch (errorScenario.notFoundType) {
                  case 'establishment':
                    mockEstablishmentModel.findById.mockResolvedValue(null);
                    break;
                  case 'accommodation':
                    mockEstablishmentModel.findById.mockResolvedValue({
                      _id: errorScenario.establishmentId,
                      name: 'Test Hotel'
                    } as any);
                    mockAccommodationModel.findOne.mockResolvedValue(null);
                    break;
                  case 'accommodation_not_in_establishment':
                    mockEstablishmentModel.findById.mockResolvedValue({
                      _id: errorScenario.establishmentId,
                      name: 'Test Hotel'
                    } as any);
                    mockAccommodationModel.findOne.mockResolvedValue(null); // Not found in this establishment
                    break;
                }
                break;
                
              case 'business_logic_error':
                // Mock establishment exists
                mockEstablishmentModel.findById.mockResolvedValue({
                  _id: errorScenario.establishmentId,
                  name: 'Test Hotel'
                } as any);

                let businessAccommodationMock: any = {
                  _id: errorScenario.accommodationId,
                  capacity: { maxGuests: 2 }, // Small capacity to trigger capacity exceeded
                  pricing: { basePrice: 100 },
                  pricingMode: 'nightly',
                  establishmentId: errorScenario.establishmentId
                };

                switch (errorScenario.businessError) {
                  case 'capacity_exceeded':
                    businessAccommodationMock.status = 'available';
                    mockBookingModel.findOne.mockResolvedValue(null); // No conflicts
                    break;
                  case 'accommodation_unavailable':
                    businessAccommodationMock.status = 'maintenance';
                    mockBookingModel.findOne.mockResolvedValue(null); // No conflicts
                    break;
                  case 'conflicting_booking':
                    businessAccommodationMock.status = 'available';
                    businessAccommodationMock.capacity.maxGuests = 10; // Sufficient capacity
                    // Mock conflicting booking exists
                    mockBookingModel.findOne.mockResolvedValue({
                      _id: 'existing-booking',
                      status: 'confirmed'
                    } as any);
                    break;
                }

                mockAccommodationModel.findOne.mockResolvedValue(businessAccommodationMock);
                break;
            }

            // Create mock request
            const requestData = {
              establishmentId: errorScenario.establishmentId,
              accommodationId: errorScenario.accommodationId,
              checkInDate: errorScenario.checkInDate,
              checkOutDate: errorScenario.checkOutDate,
              numberOfNights: errorScenario.numberOfNights,
              mainClient: errorScenario.mainClient,
              numberOfGuests: errorScenario.numberOfGuests
            };

            const request = new NextRequest('http://localhost:3000/api/public/bookings', {
              method: 'POST',
              body: JSON.stringify(requestData),
              headers: {
                'Content-Type': 'application/json'
              }
            });

            // Execute the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Property: For any invalid booking data or system error, the system should provide specific error messages,
            // handle failures gracefully, and maintain data consistency without partial booking creation

            // 1. System should return error response (Requirement 4.1)
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);
            expect(responseData.success).toBe(false);
            expect(responseData.error).toBeDefined();

            // 2. Error should have specific code and message (Requirement 4.1, 4.2)
            expect(responseData.error.code).toBeDefined();
            expect(typeof responseData.error.code).toBe('string');
            expect(responseData.error.code.length).toBeGreaterThan(0);
            expect(responseData.error.message).toBeDefined();
            expect(typeof responseData.error.message).toBe('string');
            expect(responseData.error.message.length).toBeGreaterThan(0);

            // 3. Error codes should be appropriate for the error type (Requirement 4.1, 4.2)
            const validErrorCodes = [
              'FIELD_MAPPING_ERROR',
              'VALIDATION_ERROR', 
              'PRICING_CALCULATION_ERROR',
              'NOT_FOUND',
              'NOT_AVAILABLE',
              'CAPACITY_EXCEEDED',
              'INTERNAL_ERROR'
            ];
            expect(validErrorCodes).toContain(responseData.error.code);

            // 4. Field mapping errors should provide specific details (Requirement 4.2)
            if (errorScenario.type === 'field_mapping_error') {
              expect(responseData.error.code).toBe('FIELD_MAPPING_ERROR');
              expect(responseData.error.details).toBeDefined();
              expect(typeof responseData.error.details).toBe('object');
            }

            // 5. Validation errors should provide specific field information (Requirement 4.2)
            if (errorScenario.type === 'validation_error') {
              expect(responseData.error.code).toBe('VALIDATION_ERROR');
              expect(responseData.error.details).toBeDefined();
              expect(typeof responseData.error.details).toBe('object');
            }

            // 6. Pricing calculation errors should be handled gracefully (Requirement 4.3)
            if (errorScenario.type === 'pricing_calculation_error') {
              expect(responseData.error.code).toBe('PRICING_CALCULATION_ERROR');
              expect(responseData.error.details).toBeDefined();
            }

            // 7. Database constraint violations should return appropriate error codes (Requirement 4.4)
            if (errorScenario.type === 'not_found_error') {
              expect(responseData.error.code).toBe('NOT_FOUND');
            }

            if (errorScenario.type === 'business_logic_error') {
              if (errorScenario.businessError === 'capacity_exceeded') {
                expect(responseData.error.code).toBe('CAPACITY_EXCEEDED');
              } else if (errorScenario.businessError === 'accommodation_unavailable' || errorScenario.businessError === 'conflicting_booking') {
                expect(responseData.error.code).toBe('NOT_AVAILABLE');
              }
            }

            // 8. No partial booking creation should occur (Requirement 4.5)
            // Verify that BookingModel.create was never called for error scenarios
            expect(mockBookingModel.create).not.toHaveBeenCalled();

            // 9. Error response should maintain consistent structure (Requirement 4.1)
            expect(responseData).toHaveProperty('success');
            expect(responseData).toHaveProperty('error');
            expect(responseData.error).toHaveProperty('code');
            expect(responseData.error).toHaveProperty('message');

            // 10. Error messages should be user-friendly (not expose internal details) (Requirement 4.1)
            expect(responseData.error.message).not.toContain('Error:');
            expect(responseData.error.message).not.toContain('TypeError');
            expect(responseData.error.message).not.toContain('ReferenceError');
            expect(responseData.error.message).not.toContain('undefined');
            expect(responseData.error.message).not.toContain('null');

            // 11. System should maintain data consistency - no database operations for failed requests (Requirement 4.5)
            if (errorScenario.type === 'field_mapping_error' || errorScenario.type === 'validation_error') {
              // For early validation failures, no database queries should be made beyond connection
              expect(mockEstablishmentModel.findById).not.toHaveBeenCalled();
              expect(mockAccommodationModel.findOne).not.toHaveBeenCalled();
              expect(mockBookingModel.findOne).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    /**
     * **Feature: booking-validation-fix, Property 1: Complete booking acceptance**
     * **Validates: Requirements 1.1**
     * 
     * For any valid booking form data, the system should accept all required fields without validation errors
     */
    test('Property 1: Complete booking acceptance', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid booking data
          fc.record({
            establishmentId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0').substring(0, 24)),
            accommodationId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0').substring(0, 24)),
            checkInDate: fc.date({ 
              min: new Date(Date.now() + 24 * 60 * 60 * 1000),
              max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }),
            numberOfNights: fc.integer({ min: 1, max: 30 }),
            mainClient: fc.record({
              firstName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              lastName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              email: fc.emailAddress(),
              phone: fc.string({ minLength: 8, maxLength: 20 }).map(s => s.replace(/[^0-9+\-\s]/g, '')).filter(s => s.length >= 8)
            }),
            numberOfGuests: fc.integer({ min: 1, max: 8 }),
            specialRequests: fc.option(fc.string({ maxLength: 500 })),
            arrivalTime: fc.option(fc.string({ minLength: 5, maxLength: 5 }).map(() => '14:00'))
          }).map(data => ({
            ...data,
            checkInDate: data.checkInDate.toISOString(),
            checkOutDate: new Date(data.checkInDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000).toISOString()
          })),
          async (bookingData) => {
            // Reset mocks for each test iteration
            jest.clearAllMocks();
            mockConnectDB.mockResolvedValue(undefined as any);

            // Mock establishment exists and is valid
            const mockEstablishment = {
              _id: bookingData.establishmentId,
              name: 'Test Hotel',
              location: { city: 'Test City' }
            };
            mockEstablishmentModel.findById.mockResolvedValue(mockEstablishment as any);

            // Mock accommodation exists, is available, and has valid pricing
            const mockAccommodation = {
              _id: bookingData.accommodationId,
              name: 'Test Room',
              type: 'standard',
              status: 'available',
              capacity: { maxGuests: Math.max(8, bookingData.numberOfGuests) },
              pricing: {
                basePrice: 100,
                seasonalPrice: 120
              },
              pricingMode: 'nightly',
              establishmentId: bookingData.establishmentId
            };
            mockAccommodationModel.findOne.mockResolvedValue(mockAccommodation as any);

            // Mock no conflicting bookings
            mockBookingModel.findOne.mockResolvedValue(null);

            // Mock successful booking creation
            const mockCreatedBooking = {
              _id: '507f1f77bcf86cd799439013',
              bookingCode: 'TES123456ABC',
              status: 'pending',
              pricingDetails: { total: 200 },
              checkIn: new Date(bookingData.checkInDate),
              checkOut: new Date(bookingData.checkOutDate)
            };
            mockBookingModel.create.mockResolvedValue(mockCreatedBooking as any);

            // Create mock request
            const request = new NextRequest('http://localhost:3000/api/public/bookings', {
              method: 'POST',
              body: JSON.stringify(bookingData),
              headers: {
                'Content-Type': 'application/json'
              }
            });

            // Execute the API route
            const response = await POST(request);
            const responseData = await response.json();

            // Property: For any valid booking form data, the system should accept all required fields without validation errors
            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);
            expect(responseData.data).toBeDefined();
            expect(responseData.data.id).toBeDefined();
            expect(responseData.data.bookingCode).toBeDefined();
            expect(responseData.data.status).toBe('pending');

            // Verify that the booking was created with proper field mapping
            expect(mockBookingModel.create).toHaveBeenCalledWith(
              expect.objectContaining({
                establishmentId: bookingData.establishmentId,
                accommodationId: bookingData.accommodationId,
                checkIn: expect.any(Date),
                checkOut: expect.any(Date),
                clientInfo: expect.objectContaining({
                  firstName: bookingData.mainClient.firstName,
                  lastName: bookingData.mainClient.lastName,
                  email: bookingData.mainClient.email,
                  phone: bookingData.mainClient.phone
                }),
                numberOfGuests: bookingData.numberOfGuests,
                pricingDetails: expect.objectContaining({
                  mode: expect.any(String),
                  unitPrice: expect.any(Number),
                  quantity: expect.any(Number),
                  subtotal: expect.any(Number),
                  total: expect.any(Number)
                }),
                status: 'pending',
                paymentStatus: 'unpaid'
              })
            );

            // Verify that field mapping occurred correctly (checkInDate -> checkIn, checkOutDate -> checkOut)
            const createCall = mockBookingModel.create.mock.calls[0][0] as any;
            expect(createCall.checkIn).toBeInstanceOf(Date);
            expect(createCall.checkOut).toBeInstanceOf(Date);
            expect(createCall.checkIn.toISOString()).toBe(new Date(bookingData.checkInDate).toISOString());
            expect(createCall.checkOut.toISOString()).toBe(new Date(bookingData.checkOutDate).toISOString());

            // Verify that mainClient was mapped to clientInfo
            expect(createCall.clientInfo).toBeDefined();
            expect(createCall.clientInfo.firstName).toBe(bookingData.mainClient.firstName);
            expect(createCall.clientInfo.lastName).toBe(bookingData.mainClient.lastName);
            expect(createCall.clientInfo.email).toBe(bookingData.mainClient.email);
            expect(createCall.clientInfo.phone).toBe(bookingData.mainClient.phone);

            // Verify that pricing details were automatically calculated
            expect(createCall.pricingDetails).toBeDefined();
            expect(createCall.pricingDetails.mode).toBeDefined();
            expect(createCall.pricingDetails.unitPrice).toBeGreaterThan(0);
            expect(createCall.pricingDetails.quantity).toBeGreaterThan(0);
            expect(createCall.pricingDetails.total).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in the design document
      );
    });
  });

  describe('Unit Tests', () => {
    test('should handle field mapping errors gracefully', async () => {
      const invalidData = {
        establishmentId: 'invalid',
        accommodationId: 'invalid',
        checkInDate: 'invalid-date',
        checkOutDate: '2024-12-17T00:00:00.000Z',
        mainClient: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890'
        },
        numberOfGuests: 1
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('FIELD_MAPPING_ERROR');
    });

    test('should handle validation errors after mapping', async () => {
      const incompleteData = {
        establishmentId: '',
        accommodationId: 'acc456',
        checkInDate: '2024-12-15T00:00:00.000Z',
        checkOutDate: '2024-12-17T00:00:00.000Z',
        mainClient: {
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          phone: '123'
        },
        numberOfGuests: 0
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle pricing calculation errors', async () => {
      const bookingData = {
        establishmentId: '507f1f77bcf86cd799439011',
        accommodationId: '507f1f77bcf86cd799439012',
        checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        numberOfNights: 1,
        mainClient: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890'
        },
        numberOfGuests: 2
      };

      // Mock establishment exists
      mockEstablishmentModel.findById.mockResolvedValue({
        _id: bookingData.establishmentId,
        name: 'Test Hotel'
      } as any);

      // Mock accommodation with invalid pricing (missing basePrice)
      mockAccommodationModel.findOne.mockResolvedValue({
        _id: bookingData.accommodationId,
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: {}, // Missing basePrice to trigger pricing error
        pricingMode: 'nightly',
        establishmentId: bookingData.establishmentId
      } as any);

      // Mock no conflicting bookings
      mockBookingModel.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('PRICING_CALCULATION_ERROR');
    });
  });
});