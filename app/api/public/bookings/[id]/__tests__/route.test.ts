import { NextRequest } from 'next/server';
import { GET } from '../route';
import { connectDB } from '@/lib/db';
import BookingModel from '@/models/Booking.model';

// Mock the database connection and models
jest.mock('@/lib/db');
jest.mock('@/models/Booking.model');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockBookingModel = BookingModel as jest.Mocked<typeof BookingModel>;

describe('GET /api/public/bookings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('Invalid ID handling', () => {
    test('should handle undefined ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/bookings/undefined');
      const params = Promise.resolve({ id: 'undefined' });

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_ID');
      expect(responseData.error.message).toBe('ID de réservation invalide');
    });

    test('should handle empty ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/bookings/');
      const params = Promise.resolve({ id: '' });

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_ID');
      expect(responseData.error.message).toBe('ID de réservation invalide');
    });

    test('should handle invalid ObjectId format with correct length', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/bookings/invalid-id-format-test');
      const params = Promise.resolve({ id: 'invalid-id-format-test' });

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_ID');
      expect(responseData.error.message).toBe('ID de réservation invalide');
    });

    test('should handle invalid ObjectId format with 24 chars', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/bookings/gggggggggggggggggggggggg');
      const params = Promise.resolve({ id: 'gggggggggggggggggggggggg' });

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_ID');
      expect(responseData.error.message).toBe('Format d\'ID invalide');
    });

    test('should handle short ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/public/bookings/123');
      const params = Promise.resolve({ id: '123' });

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_ID');
      expect(responseData.error.message).toBe('ID de réservation invalide');
    });
  });

  describe('Valid ID handling', () => {
    test('should handle valid ObjectId that does not exist', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const request = new NextRequest(`http://localhost:3000/api/public/bookings/${validId}`);
      const params = Promise.resolve({ id: validId });

      // Mock that booking is not found
      mockBookingModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
          })
        })
      } as any);

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_FOUND');
      expect(responseData.error.message).toBe('Réservation non trouvée');
    });

    test('should handle valid ObjectId that exists', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const request = new NextRequest(`http://localhost:3000/api/public/bookings/${validId}`);
      const params = Promise.resolve({ id: validId });

      const mockBooking = {
        _id: validId,
        bookingCode: 'TEST123456',
        checkIn: new Date('2025-12-15T14:00:00.000Z'),
        checkOut: new Date('2025-12-17T11:00:00.000Z'),
        numberOfGuests: 2,
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+25722123456'
        },
        pricingDetails: {
          total: 200000,
          unitPrice: 100000,
          mode: 'nightly',
          quantity: 2
        },
        status: 'confirmed',
        paymentStatus: 'paid',
        accommodationId: {
          _id: '507f1f77bcf86cd799439012',
          name: 'Standard Room',
          type: 'standard_room',
          capacity: { maxGuests: 2 },
          amenities: ['wifi', 'tv'],
          images: []
        },
        establishmentId: {
          _id: '507f1f77bcf86cd799439013',
          name: 'Hotel Test',
          location: { city: 'Bujumbura' },
          contact: { phone: ['+25722123456'] }
        },
        notes: 'Test booking',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock that booking is found
      mockBookingModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBooking)
          })
        })
      } as any);

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.id).toBe(validId);
      expect(responseData.data.bookingCode).toBe('TEST123456');
      expect(responseData.data.bookingNumber).toBe('TEST123456');
      expect(responseData.data.numberOfGuests).toBe(2);
      expect(responseData.data.mainGuest.firstName).toBe('John');
      expect(responseData.data.mainGuest.lastName).toBe('Doe');
      expect(responseData.data.totalAmount).toBe(200000);
    });
  });

  describe('Database errors', () => {
    test('should handle database connection errors', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const request = new NextRequest(`http://localhost:3000/api/public/bookings/${validId}`);
      const params = Promise.resolve({ id: validId });

      // Mock database error
      mockConnectDB.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_ERROR');
      expect(responseData.error.message).toBe('Database connection failed');
    });

    test('should handle booking query errors', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const request = new NextRequest(`http://localhost:3000/api/public/bookings/${validId}`);
      const params = Promise.resolve({ id: validId });

      // Mock query error
      mockBookingModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('Query failed'))
          })
        })
      } as any);

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INTERNAL_ERROR');
      expect(responseData.error.message).toBe('Query failed');
    });
  });
});