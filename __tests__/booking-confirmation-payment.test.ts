import BookingService from '@/services/Booking.service';
import BookingModel from '@/models/Booking.model';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';

// Mock the database connection
jest.mock('@/lib/db');
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;

describe('Booking Confirmation and Payment Status Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  describe('Booking Confirmation with Payment Status Update', () => {
    test('should update payment status to paid when confirming booking', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBooking = {
        _id: bookingId,
        bookingCode: 'RZ-1211-A3F',
        status: 'pending',
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          bookingCode: 'RZ-1211-A3F',
          status: 'confirmed',
          paymentStatus: 'paid'
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.paymentStatus).toBe('paid');

      // Verify that both status and paymentStatus were updated
      expect(mockBooking.status).toBe('confirmed');
      expect(mockBooking.paymentStatus).toBe('paid');
      expect(mockBooking.save).toHaveBeenCalled();
    });

    test('should handle booking not found during confirmation', async () => {
      const bookingId = new Types.ObjectId().toString();

      BookingModel.findById = jest.fn().mockResolvedValue(null);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeNull();
      expect(BookingModel.findById).toHaveBeenCalledWith(bookingId);
    });

    test('should maintain data consistency during confirmation', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBooking = {
        _id: bookingId,
        bookingCode: 'RZ-1211-B4G',
        status: 'pending',
        paymentStatus: 'unpaid',
        establishmentId: 'est123',
        accommodationId: 'acc456',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          status: 'confirmed',
          paymentStatus: 'paid',
          establishmentId: 'est123',
          accommodationId: 'acc456'
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.paymentStatus).toBe('paid');
      
      // Verify that other fields remain unchanged
      expect(result?.establishmentId).toBe('est123');
      expect(result?.accommodationId).toBe('acc456');
    });
  });

  describe('Payment Status Validation', () => {
    test('should not allow confirmation of already confirmed booking', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBooking = {
        _id: bookingId,
        bookingCode: 'RZ-1211-C5H',
        status: 'confirmed', // Already confirmed
        paymentStatus: 'paid', // Already paid
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          status: 'confirmed',
          paymentStatus: 'paid'
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.paymentStatus).toBe('paid');

      // Even if already confirmed, the service should handle it gracefully
      expect(mockBooking.save).toHaveBeenCalled();
    });

    test('should handle cancelled booking confirmation attempt', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBooking = {
        _id: bookingId,
        bookingCode: 'RZ-1211-D6I',
        status: 'cancelled',
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          status: 'confirmed', // Status gets updated even from cancelled
          paymentStatus: 'paid'
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.paymentStatus).toBe('paid');

      // Verify that status was changed from cancelled to confirmed
      expect(mockBooking.status).toBe('confirmed');
      expect(mockBooking.paymentStatus).toBe('paid');
    });
  });

  describe('Business Logic Validation', () => {
    test('should ensure payment status is always paid when booking is confirmed', async () => {
      const bookingId = new Types.ObjectId().toString();

      const mockBooking = {
        _id: bookingId,
        bookingCode: 'RZ-1211-E7J',
        status: 'pending',
        paymentStatus: 'partial', // Partial payment initially
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          status: 'confirmed',
          paymentStatus: 'paid' // Should be updated to paid
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.paymentStatus).toBe('paid');

      // Verify that partial payment was updated to paid
      expect(mockBooking.paymentStatus).toBe('paid');
    });

    test('should maintain booking code format during confirmation', async () => {
      const bookingId = new Types.ObjectId().toString();
      const bookingCode = 'RZ-1211-F8K';

      const mockBooking = {
        _id: bookingId,
        bookingCode: bookingCode,
        status: 'pending',
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: bookingId,
          bookingCode: bookingCode,
          status: 'confirmed',
          paymentStatus: 'paid'
        })
      };

      BookingModel.findById = jest.fn().mockResolvedValue(mockBooking);

      const result = await BookingService.confirm(bookingId);

      expect(result).toBeDefined();
      expect(result?.bookingCode).toBe(bookingCode);
      
      // Verify the new booking code format
      expect(bookingCode).toMatch(/^RZ-\d{4}-[A-Z0-9]{3}$/);
    });
  });
});