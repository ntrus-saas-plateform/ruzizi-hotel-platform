import { BookingService } from '@/services/Booking.service';
import { BookingModel } from '@/models/Booking.model';
import { AccommodationModel } from '@/models/Accommodation.model';

// Mock dependencies
jest.mock('@/models/Booking.model');
jest.mock('@/models/Accommodation.model');
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  dbConnect: jest.fn().mockResolvedValue({}),
}));

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return true when accommodation is available', async () => {
      const accommodationId = 'acc123';
      const checkIn = new Date('2025-01-15');
      const checkOut = new Date('2025-01-20');

      (BookingModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await BookingService.checkAvailability(
        accommodationId,
        checkIn,
        checkOut
      );

      expect(result).toBe(true);
    });

    it('should return false when accommodation is not available', async () => {
      const accommodationId = 'acc123';
      const checkIn = new Date('2025-01-15');
      const checkOut = new Date('2025-01-20');

      const mockBooking = {
        _id: 'booking123',
        accommodationId,
        checkIn: new Date('2025-01-16'),
        checkOut: new Date('2025-01-19'),
        status: 'confirmed',
      };

      (BookingModel.findOne as jest.Mock).mockResolvedValue(mockBooking);

      const result = await BookingService.checkAvailability(
        accommodationId,
        checkIn,
        checkOut
      );

      expect(result).toBe(false);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate nightly price correctly', async () => {
      const mockAccommodation = {
        _id: 'acc123',
        pricing: {
          basePrice: 50000,
          mode: 'nightly',
        },
      };

      (AccommodationModel.findById as jest.Mock).mockResolvedValue(mockAccommodation);

      const checkIn = new Date('2025-01-15');
      const checkOut = new Date('2025-01-20'); // 5 nights

      const result = await BookingService.calculatePrice(
        'acc123',
        checkIn,
        checkOut
      );

      expect(result.unitPrice).toBe(50000);
      expect(result.quantity).toBe(5);
      expect(result.subtotal).toBe(250000);
      expect(result.total).toBe(250000);
    });

    it('should calculate monthly price correctly', async () => {
      const mockAccommodation = {
        _id: 'acc123',
        pricing: {
          basePrice: 500000,
          mode: 'monthly',
        },
      };

      (AccommodationModel.findById as jest.Mock).mockResolvedValue(mockAccommodation);

      const checkIn = new Date('2025-01-01');
      const checkOut = new Date('2025-03-01'); // 2 months

      const result = await BookingService.calculatePrice(
        'acc123',
        checkIn,
        checkOut
      );

      expect(result.unitPrice).toBe(500000);
      expect(result.quantity).toBe(2);
      expect(result.subtotal).toBe(1000000);
    });

    it('should throw error for invalid accommodation', async () => {
      (AccommodationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        BookingService.calculatePrice(
          'invalid-id',
          new Date(),
          new Date()
        )
      ).rejects.toThrow('Accommodation not found');
    });
  });

  describe('create', () => {
    it('should create booking successfully', async () => {
      const mockAccommodation = {
        _id: 'acc123',
        establishmentId: 'est123',
        pricing: {
          basePrice: 50000,
          mode: 'nightly',
        },
      };

      const mockBooking = {
        _id: 'booking123',
        bookingCode: 'BK-2025-001',
        establishmentId: 'est123',
        accommodationId: 'acc123',
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+25769000000',
        },
        checkIn: new Date('2025-01-15'),
        checkOut: new Date('2025-01-20'),
        numberOfGuests: 2,
        status: 'pending',
        toJSON: jest.fn().mockReturnValue({
          id: 'booking123',
          bookingCode: 'BK-2025-001',
        }),
      };

      (AccommodationModel.findById as jest.Mock).mockResolvedValue(mockAccommodation);
      (BookingModel.findOne as jest.Mock).mockResolvedValue(null); // Available
      (BookingModel.create as jest.Mock).mockResolvedValue(mockBooking);

      const bookingData = {
        establishmentId: 'est123',
        accommodationId: 'acc123',
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+25769000000',
        },
        checkIn: new Date('2025-01-15'),
        checkOut: new Date('2025-01-20'),
        numberOfGuests: 2,
      };

      const result = await BookingService.create(bookingData);

      expect(result).toHaveProperty('id', 'booking123');
      expect(result).toHaveProperty('bookingCode', 'BK-2025-001');
    });

    it('should throw error when accommodation is not available', async () => {
      const mockAccommodation = {
        _id: 'acc123',
        establishmentId: 'est123',
        pricing: {
          basePrice: 50000,
          mode: 'nightly',
        },
      };

      const existingBooking = {
        _id: 'existing123',
        status: 'confirmed',
      };

      (AccommodationModel.findById as jest.Mock).mockResolvedValue(mockAccommodation);
      (BookingModel.findOne as jest.Mock).mockResolvedValue(existingBooking);

      const bookingData = {
        establishmentId: 'est123',
        accommodationId: 'acc123',
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+25769000000',
        },
        checkIn: new Date('2025-01-15'),
        checkOut: new Date('2025-01-20'),
        numberOfGuests: 2,
      };

      await expect(
        BookingService.create(bookingData)
      ).rejects.toThrow('Accommodation is not available for the selected dates');
    });
  });

  describe('updateStatus', () => {
    it('should update booking status successfully', async () => {
      const mockBooking = {
        _id: 'booking123',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 'booking123',
          status: 'confirmed',
        }),
      };

      (BookingModel.findById as jest.Mock).mockResolvedValue(mockBooking);

      const result = await BookingService.updateStatus('booking123', 'confirmed');

      expect(mockBooking.status).toBe('confirmed');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(result.status).toBe('confirmed');
    });

    it('should throw error for invalid booking', async () => {
      (BookingModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        BookingService.updateStatus('invalid-id', 'confirmed')
      ).rejects.toThrow('Booking not found');
    });
  });
});
