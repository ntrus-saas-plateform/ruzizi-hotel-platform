import { NextRequest } from 'next/server';
import { POST } from '../route';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';
import AccommodationModel from '@/models/Accommodation.model';
import EstablishmentModel from '@/models/Establishment.model';
import { Types } from 'mongoose';

// Mock the database connection
jest.mock('@/lib/db');
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Booking API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  // Helper function to generate future dates
  const getFutureDates = (daysFromNow: number = 1, duration: number = 2) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + daysFromNow);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + daysFromNow + duration);
    return { checkIn, checkOut };
  };

  describe('Complete Booking Flow Integration', () => {
    test('should successfully create booking with complete end-to-end flow', async () => {
      // Setup test data
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);
      
      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi',
        location: {
          city: 'Bujumbura',
          address: '123 Main Street',
          coordinates: { lat: -3.3614, lng: 29.3599 }
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+25722123456'],
          email: 'info@hotelruzizi.bi'
        },
        totalCapacity: 50,
        isActive: true
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        type: 'standard_room',
        status: 'available',
        pricingMode: 'nightly',
        pricing: {
          basePrice: 50000,
          seasonalPrice: 60000,
          currency: 'BIF'
        },
        capacity: {
          maxGuests: 2,
          bedrooms: 1,
          bathrooms: 1,
          showers: 1,
          livingRooms: 0,
          kitchens: 0,
          balconies: 1
        },
        details: {
          floor: 1,
          area: 25,
          view: 'Lake view',
          bedType: 'Queen'
        },
        amenities: ['wifi', 'air_conditioning', 'tv'],
        images: []
      };

      const mockCreatedBooking = {
        _id: new Types.ObjectId(),
        bookingCode: 'RZ-1211-A3F',
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        clientInfo: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        bookingType: 'online',
        checkIn: checkIn,
        checkOut: checkOut,
        numberOfGuests: 2,
        pricingDetails: {
          mode: 'nightly',
          unitPrice: 60000,
          quantity: 2,
          subtotal: 120000,
          total: 120000
        },
        status: 'pending',
        paymentStatus: 'unpaid',
        notes: 'Client: Jean Dupont | Type: individual | Genre: non-spécifié, Nationalité: non-spécifiée | Adresse: , , ',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock database calls
      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null); // No conflicting bookings
      BookingModel.create = jest.fn().mockResolvedValue(mockCreatedBooking);

      // Frontend booking data (with frontend field names)
      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2,
        specialRequests: 'Late check-in requested',
        arrivalTime: '18:00'
      };

      // Create request
      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Execute API call
      const response = await POST(request);
      const responseData = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.id).toBeDefined();
      expect(responseData.data.bookingCode).toBe('RZ-1211-A3F');
      expect(responseData.data.status).toBe('pending');
      expect(responseData.data.totalAmount).toBe(120000);

      // Verify establishment lookup was called
      expect(EstablishmentModel.findById).toHaveBeenCalledWith(establishmentId);

      // Verify accommodation lookup was called with correct parameters
      expect(AccommodationModel.findOne).toHaveBeenCalledWith({
        _id: accommodationId,
        establishmentId: establishmentId
      });

      // Verify conflict check was performed
      expect(BookingModel.findOne).toHaveBeenCalledWith({
        accommodationId: accommodationId,
        status: { $in: ['pending', 'confirmed', 'checked_in'] },
        $or: [
          {
            checkIn: { $lte: checkOut },
            checkOut: { $gte: checkIn },
          },
        ],
      });

      // Verify booking creation with proper field mapping and pricing calculation
      expect(BookingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingCode: expect.any(String),
          establishmentId: establishmentId,
          accommodationId: accommodationId,
          clientInfo: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+25722987654'
          },
          bookingType: 'online',
          checkIn: checkIn,
          checkOut: checkOut,
          numberOfGuests: 2,
          pricingDetails: {
            mode: 'nightly',
            unitPrice: expect.any(Number),
            quantity: 2,
            subtotal: expect.any(Number),
            total: expect.any(Number)
          },
          status: 'pending',
          paymentStatus: 'unpaid',
          notes: expect.stringContaining('Jean Dupont')
        })
      );

      // Verify field mapping occurred (checkInDate -> checkIn, checkOutDate -> checkOut, mainClient -> clientInfo)
      const createCall = (BookingModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.checkIn).toBeInstanceOf(Date);
      expect(createCall.checkOut).toBeInstanceOf(Date);
      expect(createCall.clientInfo).toBeDefined();
      expect(createCall.clientInfo.firstName).toBe('Jean');
    });

    test('should handle establishment not found scenario', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      // Mock establishment not found
      EstablishmentModel.findById = jest.fn().mockResolvedValue(null);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_FOUND');
      expect(responseData.error.message).toBe('Établissement non trouvé');

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });

    test('should handle accommodation not found in establishment', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi',
        location: { city: 'Bujumbura' }
      };

      // Mock establishment exists but accommodation not found
      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(null);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_FOUND');
      expect(responseData.error.message).toBe('Hébergement non trouvé dans cet établissement');

      // Verify accommodation lookup was called with correct parameters
      expect(AccommodationModel.findOne).toHaveBeenCalledWith({
        _id: accommodationId,
        establishmentId: establishmentId
      });

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });

    test('should handle accommodation unavailable scenario', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'maintenance', // Not available
        capacity: { maxGuests: 2 }
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_AVAILABLE');
      expect(responseData.error.message).toBe('Cet hébergement n\'est pas disponible actuellement');

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });

    test('should handle capacity exceeded scenario', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 2 } // Only 2 guests allowed
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 5 // Exceeds capacity
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('CAPACITY_EXCEEDED');
      expect(responseData.error.message).toBe('Cet hébergement ne peut accueillir que 2 personnes maximum');

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });

    test('should handle conflicting booking scenario', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { basePrice: 50000 },
        pricingMode: 'nightly'
      };

      // Create conflicting booking that overlaps with our test dates
      const conflictCheckIn = new Date(checkIn);
      conflictCheckIn.setDate(conflictCheckIn.getDate() - 1);
      const conflictCheckOut = new Date(checkOut);
      conflictCheckOut.setDate(conflictCheckOut.getDate() - 1);

      const mockConflictingBooking = {
        _id: new Types.ObjectId(),
        accommodationId: accommodationId,
        status: 'confirmed',
        checkIn: conflictCheckIn,
        checkOut: conflictCheckOut
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(mockConflictingBooking);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_AVAILABLE');
      expect(responseData.error.message).toBe("Cet hébergement n'est pas disponible pour les dates sélectionnées");

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });

    test('should handle database constraint violations during booking creation', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { basePrice: 50000 },
        pricingMode: 'nightly'
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null); // No conflicts

      // Mock duplicate key error
      const duplicateKeyError = new Error('Duplicate key error');
      (duplicateKeyError as any).code = 11000;
      (duplicateKeyError as any).keyPattern = { bookingCode: 1 };
      BookingModel.create = jest.fn().mockRejectedValue(duplicateKeyError);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('DUPLICATE_BOOKING');
      expect(responseData.error.message).toBe('Une réservation avec ces informations existe déjà');
      expect(responseData.error.details.duplicateField).toBe('bookingCode');
    });

    test('should handle mongoose validation errors during booking creation', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { basePrice: 50000 },
        pricingMode: 'nightly'
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null); // No conflicts

      // Mock validation error
      const validationError = new Error('Validation failed');
      (validationError as any).name = 'ValidationError';
      (validationError as any).errors = {
        'clientInfo.email': { message: 'Email is required' },
        'pricingDetails.total': { message: 'Total must be positive' }
      };
      BookingModel.create = jest.fn().mockRejectedValue(validationError);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('DATABASE_VALIDATION_ERROR');
      expect(responseData.error.message).toBe('Les données de réservation ne respectent pas les contraintes de la base de données');
      expect(responseData.error.details).toEqual({
        'clientInfo.email': 'Email is required',
        'pricingDetails.total': 'Total must be positive'
      });
    });
  });

  describe('Field Mapping Verification', () => {
    test('should correctly map all frontend fields to database schema', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { basePrice: 50000, seasonalPrice: 60000 },
        pricingMode: 'nightly'
      };

      const mockCreatedBooking = {
        _id: new Types.ObjectId(),
        bookingCode: 'RZ-1211-B4G',
        status: 'pending',
        pricingDetails: { total: 120000 }
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null);
      BookingModel.create = jest.fn().mockResolvedValue(mockCreatedBooking);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(), // Should map to checkIn
        checkOutDate: checkOut.toISOString(), // Should map to checkOut
        numberOfNights: 2,
        mainClient: { // Should map to clientInfo
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2,
        specialRequests: 'Late check-in',
        arrivalTime: '18:00'
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify field mapping in the create call
      const createCall = (BookingModel.create as jest.Mock).mock.calls[0][0];
      
      // Verify date field mapping
      expect(createCall.checkIn).toBeInstanceOf(Date);
      expect(createCall.checkOut).toBeInstanceOf(Date);
      expect(createCall.checkIn.toISOString()).toBe(checkIn.toISOString());
      expect(createCall.checkOut.toISOString()).toBe(checkOut.toISOString());
      
      // Verify client info mapping
      expect(createCall.clientInfo).toBeDefined();
      expect(createCall.clientInfo.firstName).toBe('Jean');
      expect(createCall.clientInfo.lastName).toBe('Dupont');
      expect(createCall.clientInfo.email).toBe('jean.dupont@email.com');
      expect(createCall.clientInfo.phone).toBe('+25722987654');
      
      // Verify other fields are preserved
      expect(createCall.numberOfGuests).toBe(2);
      expect(createCall.establishmentId).toBe(establishmentId);
      expect(createCall.accommodationId).toBe(accommodationId);
    });
  });

  describe('Pricing Calculation Verification', () => {
    test('should automatically calculate pricing details when missing', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { 
          basePrice: 50000,
          seasonalPrice: 60000,
          currency: 'BIF'
        },
        pricingMode: 'nightly'
      };

      const mockCreatedBooking = {
        _id: new Types.ObjectId(),
        bookingCode: 'RZ-1211-C5H',
        status: 'pending',
        pricingDetails: { 
          mode: 'nightly',
          unitPrice: 60000,
          quantity: 2,
          subtotal: 120000,
          total: 120000
        }
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null);
      BookingModel.create = jest.fn().mockResolvedValue(mockCreatedBooking);

      // Frontend data without pricing details
      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
        // No pricingDetails provided
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify pricing details were calculated and included
      const createCall = (BookingModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.pricingDetails).toBeDefined();
      expect(createCall.pricingDetails.mode).toBe('nightly');
      expect(createCall.pricingDetails.unitPrice).toBeGreaterThan(0);
      expect(createCall.pricingDetails.quantity).toBe(2);
      expect(createCall.pricingDetails.subtotal).toBeGreaterThan(0);
      expect(createCall.pricingDetails.total).toBeGreaterThan(0);
    });

    test('should handle pricing calculation errors gracefully', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      };

      // Accommodation with invalid pricing (missing basePrice)
      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: {}, // Missing basePrice
        pricingMode: 'nightly'
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('PRICING_CALCULATION_ERROR');
      expect(responseData.error.message).toBe('Impossible de calculer le prix de la réservation. Veuillez vérifier les informations de l\'hébergement.');

      // Verify no booking was created
      expect(BookingModel.create).not.toHaveBeenCalled();
    });
  });

  describe('Booking Status Validation', () => {
    test('should always create booking with pending status regardless of input', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      const mockEstablishment = {
        _id: establishmentId,
        name: 'Hotel Ruzizi',
        location: { city: 'Bujumbura' }
      };

      const mockAccommodation = {
        _id: accommodationId,
        establishmentId: establishmentId,
        name: 'Standard Room 101',
        status: 'available',
        capacity: { maxGuests: 4 },
        pricing: { basePrice: 50000, seasonalPrice: 60000 },
        pricingMode: 'nightly'
      };

      const mockCreatedBooking = {
        _id: new Types.ObjectId(),
        bookingCode: 'RZ-1211-D6I',
        status: 'pending', // Always pending regardless of input
        pricingDetails: { total: 120000 }
      };

      EstablishmentModel.findById = jest.fn().mockResolvedValue(mockEstablishment);
      AccommodationModel.findOne = jest.fn().mockResolvedValue(mockAccommodation);
      BookingModel.findOne = jest.fn().mockResolvedValue(null);
      BookingModel.create = jest.fn().mockResolvedValue(mockCreatedBooking);

      // Try to send a different status in the request (should be ignored)
      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2,
        status: 'confirmed', // This should be ignored
        paymentStatus: 'paid' // This should be ignored
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe('pending');

      // Verify that the booking was created with status 'pending' and paymentStatus 'unpaid'
      const createCall = (BookingModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.status).toBe('pending');
      expect(createCall.paymentStatus).toBe('unpaid');
      
      // Verify that any status sent in the request is ignored
      expect(createCall.status).not.toBe('confirmed');
      expect(createCall.paymentStatus).not.toBe('paid');
    });
  });

  describe('Error Recovery and Data Consistency', () => {
    test('should maintain data consistency when errors occur', async () => {
      const establishmentId = new Types.ObjectId().toString();
      const accommodationId = new Types.ObjectId().toString();
      const { checkIn, checkOut } = getFutureDates(1, 2);

      // Mock establishment exists
      EstablishmentModel.findById = jest.fn().mockResolvedValue({
        _id: establishmentId,
        name: 'Hotel Ruzizi'
      });

      // Mock accommodation not found (error scenario)
      AccommodationModel.findOne = jest.fn().mockResolvedValue(null);

      const frontendBookingData = {
        establishmentId: establishmentId,
        accommodationId: accommodationId,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfNights: 2,
        mainClient: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+25722987654'
        },
        numberOfGuests: 2
      };

      const request = new NextRequest('http://localhost:3000/api/public/bookings', {
        method: 'POST',
        body: JSON.stringify(frontendBookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);

      // Verify data consistency: no partial operations were performed
      expect(BookingModel.create).not.toHaveBeenCalled();
      expect(BookingModel.findOne).not.toHaveBeenCalled(); // Conflict check should not run
    });

    test('should provide helpful error feedback for validation failures', async () => {
      // Test with invalid frontend data
      const invalidData = {
        establishmentId: '', // Invalid - empty
        accommodationId: 'invalid-id', // Invalid format
        checkInDate: 'invalid-date', // Invalid date
        checkOutDate: '2024-12-22T11:00:00.000Z',
        numberOfNights: 2,
        mainClient: {
          firstName: '', // Invalid - empty
          lastName: 'Dupont',
          email: 'invalid-email', // Invalid format
          phone: '123' // Too short
        },
        numberOfGuests: 0 // Invalid - must be at least 1
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
      
      // Should be either field mapping error or validation error
      expect(['FIELD_MAPPING_ERROR', 'VALIDATION_ERROR']).toContain(responseData.error.code);
      expect(responseData.error.message).toBeDefined();
      expect(responseData.error.details).toBeDefined();

      // Verify no database operations were performed
      expect(EstablishmentModel.findById).not.toHaveBeenCalled();
      expect(AccommodationModel.findOne).not.toHaveBeenCalled();
      expect(BookingModel.create).not.toHaveBeenCalled();
    });
  });
});