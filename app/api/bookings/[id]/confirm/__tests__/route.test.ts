import { NextRequest } from 'next/server';
import { POST } from '../route';
import BookingService from '@/services/Booking.service';
import { Types } from 'mongoose';

// Mock the BookingService
jest.mock('@/services/Booking.service');
const mockBookingService = BookingService as jest.Mocked<typeof BookingService>;

// Mock the auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  requireAuth: (handler: any) => (request: NextRequest) => {
    const mockUser = {
      id: 'user123',
      role: 'manager',
      establishmentId: 'est123'
    };
    return handler(request, mockUser);
  },
  createErrorResponse: jest.fn((code, message, status) => 
    new Response(JSON.stringify({ success: false, error: { code, message } }), { status })
  ),
  createSuccessResponse: jest.fn((data, message) => 
    new Response(JSON.stringify({ success: true, data, message }), { status: 200 })
  )
}));

describe('Booking Confirmation API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings/[id]/confirm', () => {
    test('should confirm booking and update payment status to paid', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockConfirmedBooking = {
        id: bookingId,
        bookingCode: 'RZ-1211-A3F',
        status: 'confirmed',
        paymentStatus: 'paid', // Should be updated to paid
        establishmentId: 'est123',
        clientInfo: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com'
        },
        pricingDetails: {
          total: 120000
        }
      };

      mockBookingService.confirm.mockResolvedValue(mockConfirmedBooking);

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe('confirmed');
      expect(responseData.data.paymentStatus).toBe('paid');

      // Verify that the service was called with the correct booking ID
      expect(mockBookingService.confirm).toHaveBeenCalledWith(bookingId);
    });

    test('should handle booking not found during confirmation', async () => {
      const bookingId = new Types.ObjectId().toString();

      mockBookingService.confirm.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('NOT_FOUND');

      expect(mockBookingService.confirm).toHaveBeenCalledWith(bookingId);
    });

    test('should enforce establishment access control', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBookingFromDifferentEstablishment = {
        id: bookingId,
        bookingCode: 'RZ-1211-B4G',
        status: 'confirmed',
        paymentStatus: 'paid',
        establishmentId: 'different_establishment', // Different establishment
        clientInfo: {
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      };

      mockBookingService.confirm.mockResolvedValue(mockBookingFromDifferentEstablishment);

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('FORBIDDEN');

      expect(mockBookingService.confirm).toHaveBeenCalledWith(bookingId);
    });

    test('should handle service errors gracefully', async () => {
      const bookingId = new Types.ObjectId().toString();

      mockBookingService.confirm.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('SERVER_ERROR');

      expect(mockBookingService.confirm).toHaveBeenCalledWith(bookingId);
    });

    test('should confirm booking with new booking code format', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockConfirmedBooking = {
        id: bookingId,
        bookingCode: 'RZ-1211-C5H', // New format
        status: 'confirmed',
        paymentStatus: 'paid',
        establishmentId: 'est123',
        clientInfo: {
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.com'
        },
        pricingDetails: {
          total: 85000
        }
      };

      mockBookingService.confirm.mockResolvedValue(mockConfirmedBooking);

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.bookingCode).toBe('RZ-1211-C5H');
      expect(responseData.data.status).toBe('confirmed');
      expect(responseData.data.paymentStatus).toBe('paid');

      // Verify the new booking code format
      expect(responseData.data.bookingCode).toMatch(/^RZ-\d{4}-[A-Z0-9]{3}$/);
    });

    test('should maintain data consistency during confirmation process', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockConfirmedBooking = {
        id: bookingId,
        bookingCode: 'RZ-1211-D6I',
        status: 'confirmed',
        paymentStatus: 'paid',
        establishmentId: 'est123',
        accommodationId: 'acc456',
        clientInfo: {
          firstName: 'Pierre',
          lastName: 'Dubois',
          email: 'pierre.dubois@email.com',
          phone: '+25722123456'
        },
        checkIn: new Date('2024-12-15'),
        checkOut: new Date('2024-12-17'),
        numberOfGuests: 2,
        pricingDetails: {
          mode: 'nightly',
          unitPrice: 60000,
          quantity: 2,
          subtotal: 120000,
          total: 120000
        }
      };

      mockBookingService.confirm.mockResolvedValue(mockConfirmedBooking);

      const request = new NextRequest(`http://localhost:3000/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const params = Promise.resolve({ id: bookingId });
      const response = await POST(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Verify that all booking data is preserved during confirmation
      expect(responseData.data.accommodationId).toBe('acc456');
      expect(responseData.data.clientInfo.firstName).toBe('Pierre');
      expect(responseData.data.numberOfGuests).toBe(2);
      expect(responseData.data.pricingDetails.total).toBe(120000);
      
      // Most importantly, verify status and payment status are updated
      expect(responseData.data.status).toBe('confirmed');
      expect(responseData.data.paymentStatus).toBe('paid');
    });
  });
});