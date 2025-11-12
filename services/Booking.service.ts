import { BookingModel } from '@/models/Booking.model';
import { ClientModel } from '@/models/Client.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateBookingInput,
  UpdateBookingInput,
  BookingResponse,
  BookingFilterOptions,
  PricingDetails,
} from '@/types/booking.types';

/**
 * Booking Service
 * Handles all booking-related operations including availability checking
 */
export class BookingService {
  /**
   * Check if accommodation is available for given dates
   * For walk-in bookings, allows multiple bookings on the same day
   */
  static async checkAvailability(
    accommodationId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
    isWalkIn: boolean = false
  ): Promise<boolean> {
    await connectDB();

    // For walk-in bookings, check time-based availability on the same day
    if (isWalkIn) {
      return this.checkWalkInAvailability(accommodationId, checkIn, checkOut, excludeBookingId);
    }

    const query: any = {
      accommodationId: toObjectId(accommodationId),
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        // New booking starts during existing booking
        { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
        // New booking ends during existing booking
        { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
        // New booking completely contains existing booking
        { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } },
      ],
    };

    // Exclude specific booking (for updates)
    if (excludeBookingId) {
      query._id = { $ne: toObjectId(excludeBookingId) };
    }

    const conflictingBookings = await BookingModel.find(query);

    return conflictingBookings.length === 0;
  }

  /**
   * Check availability for walk-in bookings (hourly, same-day)
   * Allows multiple bookings on the same day if time slots don't overlap
   */
  static async checkWalkInAvailability(
    accommodationId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    await connectDB();

    // Get all walk-in bookings for this accommodation on the same day
    const startOfDay = new Date(checkIn);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(checkIn);
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      accommodationId: toObjectId(accommodationId),
      bookingType: 'walkin',
      status: { $in: ['confirmed', 'pending'] },
      checkIn: { $gte: startOfDay, $lte: endOfDay },
    };

    if (excludeBookingId) {
      query._id = { $ne: toObjectId(excludeBookingId) };
    }

    const existingBookings = await BookingModel.find(query);

    // Check for time conflicts
    for (const booking of existingBookings) {
      const existingCheckIn = new Date(booking.checkIn).getTime();
      const existingCheckOut = new Date(booking.checkOut).getTime();
      const newCheckIn = checkIn.getTime();
      const newCheckOut = checkOut.getTime();

      // Check if time slots overlap
      if (
        (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
        (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
        (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
      ) {
        return false; // Time conflict found
      }
    }

    return true; // No conflicts
  }

  /**
   * Calculate pricing for a booking
   * For walk-in bookings, charges full daily rate regardless of hours
   */
  static async calculatePricing(
    accommodationId: string,
    checkIn: Date,
    checkOut: Date,
    isWalkIn: boolean = false
  ): Promise<PricingDetails> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(accommodationId);

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    const { pricingMode, pricing } = accommodation;
    const unitPrice = pricing.seasonalPrice || pricing.basePrice;

    let quantity: number;
    let mode: 'nightly' | 'monthly' | 'hourly';

    // For walk-in bookings, always charge full daily rate
    if (isWalkIn) {
      quantity = 1; // Always 1 day for walk-in
      mode = 'nightly';
      
      return {
        mode,
        unitPrice,
        quantity,
        subtotal: unitPrice,
        total: unitPrice,
      };
    }

    // Calculate quantity based on pricing mode
    if (pricingMode === 'hourly') {
      // Calculate hours
      const diffMs = checkOut.getTime() - checkIn.getTime();
      quantity = Math.ceil(diffMs / (1000 * 60 * 60)); // Hours
      mode = 'hourly';
    } else if (pricingMode === 'monthly') {
      // Calculate months
      const diffMs = checkOut.getTime() - checkIn.getTime();
      quantity = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)); // Approximate months
      mode = 'monthly';
    } else {
      // Calculate nights (default)
      const diffMs = checkOut.getTime() - checkIn.getTime();
      quantity = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Days/Nights
      mode = 'nightly';
    }

    const subtotal = unitPrice * quantity;
    const total = subtotal;

    return {
      mode,
      unitPrice,
      quantity,
      subtotal,
      total,
    };
  }

  /**
   * Create a new booking
   */
  static async create(data: CreateBookingInput): Promise<BookingResponse> {
    await connectDB();

    // Verify establishment exists
    const establishment = await EstablishmentModel.findById(data.establishmentId);
    if (!establishment) {
      throw new Error('Establishment not found');
    }

    // Verify accommodation exists and belongs to establishment
    const accommodation = await AccommodationModel.findById(data.accommodationId);
    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    if (accommodation.establishmentId.toString() !== data.establishmentId) {
      throw new Error('Accommodation does not belong to this establishment');
    }

    // Check if accommodation is available
    if (accommodation.status !== 'available') {
      throw new Error('Accommodation is not available');
    }

    // Check availability for dates
    const isWalkIn = data.bookingType === 'walkin';
    const isAvailable = await this.checkAvailability(
      data.accommodationId,
      data.checkIn,
      data.checkOut,
      undefined,
      isWalkIn
    );

    if (!isAvailable) {
      throw new Error('Accommodation is not available for the selected dates');
    }

    // Check capacity
    if (data.numberOfGuests > accommodation.capacity.maxGuests) {
      throw new Error(
        `Number of guests exceeds maximum capacity of ${accommodation.capacity.maxGuests}`
      );
    }

    // Calculate pricing
    const pricingDetails = await this.calculatePricing(
      data.accommodationId,
      data.checkIn,
      data.checkOut,
      isWalkIn
    );

    // Find or create client
    let client = await ClientModel.findByEmail(data.clientInfo.email);

    if (!client) {
      client = await ClientModel.create({
        personalInfo: data.clientInfo,
        classification: data.bookingType === 'walkin' ? 'walkin' : 'regular',
      });
    }

    // Create booking
    const booking = await BookingModel.create({
      ...data,
      establishmentId: toObjectId(data.establishmentId),
      accommodationId: toObjectId(data.accommodationId),
      pricingDetails,
      createdBy: data.createdBy ? toObjectId(data.createdBy) : undefined,
    });

    // Update accommodation status to reserved
    accommodation.status = 'reserved';
    await accommodation.save();

    // Add booking to client history
    client.bookingHistory.push(booking._id as any);
    await client.save();

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Get booking by ID
   */
  static async getById(id: string): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findById(id)
      .populate('establishment', 'name location')
      .populate('accommodation', 'name type images');

    if (!booking) {
      return null;
    }

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Get booking by code
   */
  static async getByCode(bookingCode: string): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findByCode(bookingCode);
    
    if (!booking) {
      return null;
    }

    await booking.populate('establishment', 'name location contacts');
    await booking.populate('accommodation', 'name type images');

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Get all bookings with filters and pagination
   */
  static async getAll(
    filters: BookingFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<BookingResponse>> {
    await connectDB();

    // Build query
    const query: any = {};

    if (filters.establishmentId) {
      query.establishmentId = toObjectId(filters.establishmentId);
    }

    if (filters.accommodationId) {
      query.accommodationId = toObjectId(filters.accommodationId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.bookingType) {
      query.bookingType = filters.bookingType;
    }

    if (filters.clientEmail) {
      query['clientInfo.email'] = filters.clientEmail.toLowerCase();
    }

    if (filters.bookingCode) {
      query.bookingCode = filters.bookingCode.toUpperCase();
    }

    if (filters.checkInFrom || filters.checkInTo) {
      query.checkIn = {};
      if (filters.checkInFrom) {
        query.checkIn.$gte = filters.checkInFrom;
      }
      if (filters.checkInTo) {
        query.checkIn.$lte = filters.checkInTo;
      }
    }

    if (filters.search) {
      query.$or = [
        { bookingCode: new RegExp(filters.search, 'i') },
        { 'clientInfo.firstName': new RegExp(filters.search, 'i') },
        { 'clientInfo.lastName': new RegExp(filters.search, 'i') },
        { 'clientInfo.email': new RegExp(filters.search, 'i') },
      ];
    }

    // Execute query with pagination
    const result = await paginate(BookingModel.find(query), {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((booking) => booking.toJSON() as unknown as BookingResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Update booking
   */
  static async update(
    id: string,
    data: UpdateBookingInput
  ): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return null;
    }

    // If dates are being changed, check availability
    if (data.checkIn || data.checkOut) {
      const newCheckIn = data.checkIn || booking.checkIn;
      const newCheckOut = data.checkOut || booking.checkOut;

      const isAvailable = await this.checkAvailability(
        booking.accommodationId.toString(),
        newCheckIn,
        newCheckOut,
        id
      );

      if (!isAvailable) {
        throw new Error('Accommodation is not available for the selected dates');
      }

      // Recalculate pricing if dates changed
      const pricingDetails = await this.calculatePricing(
        booking.accommodationId.toString(),
        newCheckIn,
        newCheckOut
      );

      booking.pricingDetails = pricingDetails;
    }

    // Update fields
    Object.assign(booking, data);

    await booking.save();

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Cancel booking
   */
  static async cancel(id: string): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return null;
    }

    booking.status = 'cancelled';
    await booking.save();

    // Update accommodation status back to available
    const accommodation = await AccommodationModel.findById(booking.accommodationId);
    if (accommodation && accommodation.status === 'reserved') {
      accommodation.status = 'available';
      await accommodation.save();
    }

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Confirm booking
   */
  static async confirm(id: string): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return null;
    }

    booking.status = 'confirmed';
    await booking.save();

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Complete booking (check-out)
   */
  static async complete(id: string): Promise<BookingResponse | null> {
    await connectDB();

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return null;
    }

    booking.status = 'completed';
    await booking.save();

    // For walk-in bookings, use auto-release logic
    if (booking.bookingType === 'walkin') {
      await this.autoReleaseAfterCheckout(id);
    } else {
      // For regular bookings, release accommodation immediately
      const accommodation = await AccommodationModel.findById(booking.accommodationId);
      if (accommodation) {
        accommodation.status = 'available';
        await accommodation.save();
      }
    }

    // Update client statistics
    const client = await ClientModel.findByEmail(booking.clientInfo.email);
    if (client) {
      client.totalStays += 1;
      client.totalSpent += booking.pricingDetails.total;
      await client.save();
    }

    return booking.toJSON() as unknown as BookingResponse;
  }

  /**
   * Get bookings by establishment
   */
  static async getByEstablishment(establishmentId: string): Promise<BookingResponse[]> {
    await connectDB();

    const bookings = await BookingModel.findByEstablishment(establishmentId);

    return bookings.map((booking) => booking.toJSON() as unknown as BookingResponse);
  }

  /**
   * Get bookings by client email
   */
  static async getByClientEmail(email: string): Promise<BookingResponse[]> {
    await connectDB();

    const bookings = await BookingModel.findByClientEmail(email);

    return bookings.map((booking) => booking.toJSON() as unknown as BookingResponse);
  }

  /**
   * Get all walk-in bookings for a specific accommodation on a given date
   */
  static async getWalkInBookingsByDate(
    accommodationId: string,
    date: Date
  ): Promise<BookingResponse[]> {
    await connectDB();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await BookingModel.find({
      accommodationId: toObjectId(accommodationId),
      bookingType: 'walkin',
      checkIn: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending', 'completed'] },
    }).sort({ checkIn: 1 });

    return bookings.map((booking) => booking.toJSON() as unknown as BookingResponse);
  }

  /**
   * Calculate total daily revenue from walk-in bookings for a specific accommodation
   */
  static async calculateDailyWalkInRevenue(
    accommodationId: string,
    date: Date
  ): Promise<number> {
    await connectDB();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await BookingModel.aggregate([
      {
        $match: {
          accommodationId: toObjectId(accommodationId),
          bookingType: 'walkin',
          checkIn: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricingDetails.total' },
          bookingCount: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  /**
   * Auto-release accommodation after walk-in checkout
   * This should be called when a walk-in booking is completed
   */
  static async autoReleaseAfterCheckout(bookingId: string): Promise<void> {
    await connectDB();

    const booking = await BookingModel.findById(bookingId);

    if (!booking || booking.bookingType !== 'walkin') {
      return;
    }

    // Check if there are any other active bookings for this accommodation
    const now = new Date();
    const activeBookings = await BookingModel.find({
      accommodationId: booking.accommodationId,
      status: { $in: ['confirmed', 'pending'] },
      checkIn: { $lte: now },
      checkOut: { $gte: now },
      _id: { $ne: booking._id },
    });

    // Only release if no other active bookings
    if (activeBookings.length === 0) {
      const accommodation = await AccommodationModel.findById(booking.accommodationId);
      if (accommodation) {
        accommodation.status = 'available';
        await accommodation.save();
      }
    }
  }

  /**
   * Get walk-in booking statistics for an establishment
   */
  static async getWalkInStatistics(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRevenuePerBooking: number;
    accommodationBreakdown: Array<{
      accommodationId: string;
      accommodationName: string;
      bookingCount: number;
      revenue: number;
    }>;
  }> {
    await connectDB();

    const result = await BookingModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          bookingType: 'walkin',
          checkIn: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$accommodationId',
          bookingCount: { $sum: 1 },
          revenue: { $sum: '$pricingDetails.total' },
        },
      },
      {
        $lookup: {
          from: 'accommodations',
          localField: '_id',
          foreignField: '_id',
          as: 'accommodation',
        },
      },
      {
        $unwind: '$accommodation',
      },
      {
        $project: {
          accommodationId: '$_id',
          accommodationName: '$accommodation.name',
          bookingCount: 1,
          revenue: 1,
        },
      },
    ]);

    const totalBookings = result.reduce((sum, item) => sum + item.bookingCount, 0);
    const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0);

    return {
      totalBookings,
      totalRevenue,
      averageRevenuePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      accommodationBreakdown: result.map((item) => ({
        accommodationId: item.accommodationId.toString(),
        accommodationName: item.accommodationName,
        bookingCount: item.bookingCount,
        revenue: item.revenue,
      })),
    };
  }

  /**
   * Create a walk-in booking with automatic same-day handling
   */
  static async createWalkInBooking(
    data: Omit<CreateBookingInput, 'bookingType'>
  ): Promise<BookingResponse> {
    // Ensure booking type is walk-in
    const walkInData: CreateBookingInput = {
      ...data,
      bookingType: 'walkin',
    };

    // Validate that check-in and check-out are on the same day
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    if (
      checkInDate.getDate() !== checkOutDate.getDate() ||
      checkInDate.getMonth() !== checkOutDate.getMonth() ||
      checkInDate.getFullYear() !== checkOutDate.getFullYear()
    ) {
      throw new Error('Walk-in bookings must have check-in and check-out on the same day');
    }

    // Validate that check-out is after check-in
    if (checkOutDate <= checkInDate) {
      throw new Error('Check-out time must be after check-in time');
    }

    return this.create(walkInData);
  }
}

export default BookingService;
