import { PipelineStage } from 'mongoose';
import { BookingModel } from '@/models/Booking.model';
import { ClientModel } from '@/models/Client.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { cache } from '@/lib/performance/cache';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
    EstablishmentAccessDeniedError,
    CrossEstablishmentRelationshipError,
} from '@/lib/errors/establishment-errors';
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
    // Pre-generated booking codes pool
    private static bookingCodePool: string[] = [];
    private static readonly CODE_POOL_SIZE = 1000;
    private static readonly CODE_POOL_KEY = 'booking_codes_pool';

    /**
     * Preload booking codes pool
     * Generates and caches a pool of unique booking codes for faster booking creation
     */
    static async preloadBookingCodes(): Promise<void> {
        try {
            // Check if pool is already cached
            const cachedPool = await cache.get<string[]>(this.CODE_POOL_KEY);
            if (cachedPool && cachedPool.length > 0) {
                this.bookingCodePool = cachedPool;
                return;
            }

            // Generate new pool
            const codes: string[] = [];

            while (codes.length < this.CODE_POOL_SIZE) {
                const code = await this.generateUniqueBookingCode();
                codes.push(code);
            }

            this.bookingCodePool = codes;

            // Cache the pool with TTL (refresh every hour)
            await cache.set(this.CODE_POOL_KEY, codes, 3600);
        } catch (error) {
            console.error('❌ Failed to preload booking codes:', error);
            // Fallback: generate codes on demand if preloading fails
        }
    }

    /**
     * Get next available booking code from pool
     * Falls back to on-demand generation if pool is empty
     */
    private static async getNextBookingCode(): Promise<string> {
        if (this.bookingCodePool.length > 0) {
            const code = this.bookingCodePool.shift()!;
            // Update cache with reduced pool
            await cache.set(this.CODE_POOL_KEY, this.bookingCodePool, 3600);
            return code;
        }

        // Fallback: generate on demand
        console.warn('⚠️ Booking code pool empty, generating on demand');
        return this.generateUniqueBookingCode();
    }

    /**
     * Generate a unique booking code with collision detection and retry logic
     * Uses the new shorter format: RZ-MMDD-XXX
     */
    private static async generateUniqueBookingCode(): Promise<string> {
        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const date = new Date();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            // Generate random 3-character alphanumeric code
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomCode = '';
            for (let i = 0; i < 3; i++) {
                randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const code = `RZ-${month}${day}-${randomCode}`;
            const existingBooking = await BookingModel.findByCode(code);
            if (!existingBooking) {
                return code;
            }
            attempts++;
        }

        throw new Error('Failed to generate unique booking code after maximum attempts');
    }
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

        // Create cache key for availability check
        const cacheKey = `availability:${accommodationId}:${checkIn.getTime()}:${checkOut.getTime()}:${excludeBookingId || 'none'}:${isWalkIn}`;

        return cache.getOrSet(
            cacheKey,
            async () => {
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
            },
            60 // Cache for 1 minute - availability can change quickly
        );
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

        // Cache pricing calculations for better performance
        const cacheKey = `pricing:${accommodationId}:${checkIn.getTime()}:${checkOut.getTime()}:${isWalkIn}`;

        return cache.getOrSet(
            cacheKey,
            async () => {
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
            },
            300 // Cache for 5 minutes - pricing doesn't change often
        );
    }

    /**
     * Create a new booking
     */
    static async create(
        data: CreateBookingInput,
        context?: EstablishmentServiceContext
    ): Promise<BookingResponse> {
        await connectDB();

        // For non-admin users, enforce their establishment
        let effectiveEstablishmentId = data.establishmentId;
        if (context && !context.canAccessAll()) {
            effectiveEstablishmentId = context.getEstablishmentId()!;
        }

        // Verify establishment exists
        const establishment = await EstablishmentModel.findById(effectiveEstablishmentId);
        if (!establishment) {
            throw new Error('Establishment not found');
        }

        // Verify accommodation exists and belongs to establishment
        const accommodation = await AccommodationModel.findById(data.accommodationId);
        if (!accommodation) {
            throw new Error('Accommodation not found');
        }

        // Validate accommodation-booking relationship (same establishment)
        if (accommodation.establishmentId.toString() !== effectiveEstablishmentId) {
            throw new CrossEstablishmentRelationshipError({
                parentResource: {
                    type: 'accommodation',
                    id: accommodation._id.toString(),
                    establishmentId: accommodation.establishmentId.toString(),
                },
                childResource: {
                    type: 'booking',
                    id: 'new',
                    establishmentId: effectiveEstablishmentId,
                },
            });
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

        // Get pre-generated booking code
        const bookingCode = await this.getNextBookingCode();

        // Create booking with enforced establishmentId
        const booking = await BookingModel.create({
            ...data,
            bookingCode,
            establishmentId: toObjectId(effectiveEstablishmentId),
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
    static async getById(
        id: string,
        context?: EstablishmentServiceContext
    ): Promise<BookingResponse | null> {
        await connectDB();

        const booking = await BookingModel.findById(id)
            .populate('establishment', 'name location')
            .populate('accommodation', 'name type images');

        if (!booking) {
            return null;
        }

        // Validate access if context is provided
        if (context) {
            const hasAccess = await context.validateAccess(
                { establishmentId: booking.establishmentId },
                'booking'
            );

            if (!hasAccess) {
                throw new EstablishmentAccessDeniedError({
                    userId: context.getUserId(),
                    resourceType: 'booking',
                    resourceId: id,
                    userEstablishmentId: context.getEstablishmentId(),
                    resourceEstablishmentId: booking.establishmentId.toString(),
                });
            }
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
      * Get all bookings with filters and pagination using MongoDB aggregation pipeline
      * Optimized with lazy loading and efficient queries
      */
    static async getAll(
        filters: BookingFilterOptions = {},
        page: number = 1,
        limit: number = 10,
        context?: EstablishmentServiceContext
    ): Promise<PaginationResult<BookingResponse>> {
        await connectDB();

        // For large datasets, use cursor-based pagination for better performance
        const useCursorPagination = limit > 50;

        // Build match conditions for aggregation pipeline
        const matchConditions: any = {};

        // Apply establishment filter from context
        if (context) {
            const filteredConditions = context.applyFilter(filters);
            if (filteredConditions.establishmentId) {
                matchConditions.establishmentId = toObjectId(filteredConditions.establishmentId);
            }
        } else if (filters.establishmentId) {
            matchConditions.establishmentId = toObjectId(filters.establishmentId);
        }

        if (filters.accommodationId) {
            matchConditions.accommodationId = toObjectId(filters.accommodationId);
        }

        if (filters.status) {
            matchConditions.status = filters.status;
        }

        if (filters.paymentStatus) {
            matchConditions.paymentStatus = filters.paymentStatus;
        }

        if (filters.bookingType) {
            matchConditions.bookingType = filters.bookingType;
        }

        if (filters.clientEmail) {
            matchConditions['clientInfo.email'] = filters.clientEmail.toLowerCase();
        }

        if (filters.bookingCode) {
            matchConditions.bookingCode = filters.bookingCode.toUpperCase();
        }

        if (filters.checkInFrom || filters.checkInTo) {
            matchConditions.checkIn = {};
            if (filters.checkInFrom) {
                matchConditions.checkIn.$gte = filters.checkInFrom;
            }
            if (filters.checkInTo) {
                matchConditions.checkIn.$lte = filters.checkInTo;
            }
        }

        if (filters.search) {
            matchConditions.$or = [
                { bookingCode: new RegExp(filters.search, 'i') },
                { 'clientInfo.firstName': new RegExp(filters.search, 'i') },
                { 'clientInfo.lastName': new RegExp(filters.search, 'i') },
                { 'clientInfo.email': new RegExp(filters.search, 'i') },
            ];
        }

        // Cache key for total count (changes less frequently)
        const countCacheKey = `booking_count:${JSON.stringify(matchConditions)}`;

        // Get total count with caching
        const total = await cache.getOrSet(
            countCacheKey,
            async () => {
                const countResult = await BookingModel.aggregate([
                    { $match: matchConditions },
                    { $count: 'count' },
                ]);
                return countResult[0]?.count || 0;
            },
            60 // Cache count for 1 minute
        );

        // Use optimized pipeline with selective field loading
        const pipeline: PipelineStage[] = [
            { $match: matchConditions },
            {
                $lookup: {
                    from: 'establishments',
                    localField: 'establishmentId',
                    foreignField: '_id',
                    as: 'establishment',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                location: 1,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'accommodations',
                    localField: 'accommodationId',
                    foreignField: '_id',
                    as: 'accommodation',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                type: 1,
                                images: { $slice: ['$images', 1] }, // Only load first image for performance
                            },
                        },
                    ],
                },
            },
            { $unwind: { path: '$establishment', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$accommodation', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    bookingCode: 1,
                    status: 1,
                    paymentStatus: 1,
                    bookingType: 1,
                    checkIn: 1,
                    checkOut: 1,
                    numberOfGuests: 1,
                    pricingDetails: 1,
                    clientInfo: 1,
                    notes: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    establishmentId: 1,
                    accommodationId: 1,
                    createdBy: 1,
                    'establishment.name': 1,
                    'establishment.location': 1,
                    'accommodation.name': 1,
                    'accommodation.type': 1,
                    'accommodation.images': 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ];

        // Add pagination based on strategy
        if (useCursorPagination) {
            // For large datasets, skip offset-based pagination and use cursor
            pipeline.push({ $limit: page * limit });
            pipeline.push({ $skip: (page - 1) * limit });
        } else {
            // For smaller datasets, use traditional pagination
            pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
        }

        const data = await BookingModel.aggregate(pipeline, { hint: { createdAt: -1 } });
        const totalPages = Math.ceil(total / limit);

        return {
            data: data.map((booking: any) => ({
                ...booking,
                id: booking._id.toString(),
                establishmentId: booking.establishmentId?.toString(),
                accommodationId: booking.accommodationId?.toString(),
                createdBy: booking.createdBy?.toString(),
            })) as BookingResponse[],
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Update booking
     */
    static async update(
        id: string,
        data: UpdateBookingInput,
        context?: EstablishmentServiceContext
    ): Promise<BookingResponse | null> {
        await connectDB();

        const booking = await BookingModel.findById(id);

        if (!booking) {
            return null;
        }

        // Validate access if context is provided
        if (context) {
            const hasAccess = await context.validateAccess(
                { establishmentId: booking.establishmentId },
                'booking'
            );

            if (!hasAccess) {
                throw new EstablishmentAccessDeniedError({
                    userId: context.getUserId(),
                    resourceType: 'booking',
                    resourceId: id,
                    userEstablishmentId: context.getEstablishmentId(),
                    resourceEstablishmentId: booking.establishmentId.toString(),
                });
            }
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
     * Delete booking
     */
    static async delete(
        id: string,
        context?: EstablishmentServiceContext
    ): Promise<boolean> {
        await connectDB();

        const booking = await BookingModel.findById(id);

        if (!booking) {
            return false;
        }

        // Validate access if context is provided
        if (context) {
            const hasAccess = await context.validateAccess(
                { establishmentId: booking.establishmentId },
                'booking'
            );

            if (!hasAccess) {
                throw new EstablishmentAccessDeniedError({
                    userId: context.getUserId(),
                    resourceType: 'booking',
                    resourceId: id,
                    userEstablishmentId: context.getEstablishmentId(),
                    resourceEstablishmentId: booking.establishmentId.toString(),
                });
            }
        }

        await BookingModel.findByIdAndDelete(id);

        // Update accommodation status back to available if it was reserved
        const accommodation = await AccommodationModel.findById(booking.accommodationId);
        if (accommodation && accommodation.status === 'reserved') {
            accommodation.status = 'available';
            await accommodation.save();
        }

        return true;
    }

    /**
     * Cancel booking
     */
    static async cancel(
        id: string,
        context?: EstablishmentServiceContext
    ): Promise<BookingResponse | null> {
        await connectDB();

        const booking = await BookingModel.findById(id);

        if (!booking) {
            return null;
        }

        // Validate access if context is provided
        if (context) {
            const hasAccess = await context.validateAccess(
                { establishmentId: booking.establishmentId },
                'booking'
            );

            if (!hasAccess) {
                throw new EstablishmentAccessDeniedError({
                    userId: context.getUserId(),
                    resourceType: 'booking',
                    resourceId: id,
                    userEstablishmentId: context.getEstablishmentId(),
                    resourceEstablishmentId: booking.establishmentId.toString(),
                });
            }
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
     * When a booking is confirmed, the payment status is automatically set to 'paid'
     */
    static async confirm(id: string): Promise<BookingResponse | null> {
        await connectDB();

        const booking = await BookingModel.findById(id);

        if (!booking) {
            return null;
        }

        // When confirming a booking, both status and payment status are updated
        booking.status = 'confirmed';
        booking.paymentStatus = 'paid'; // Payment is considered complete when booking is confirmed
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
      * Get bookings by establishment with pagination and lazy loading
      */
    static async getByEstablishment(
        establishmentId: string,
        page: number = 1,
        limit: number = 20,
        includeFullDetails: boolean = false
    ): Promise<PaginationResult<BookingResponse>> {
        await connectDB();

        // Use cursor-based pagination for large datasets
        const useCursorPagination = limit > 50;

        // Build query with index hint
        const query = BookingModel.find({ establishmentId: toObjectId(establishmentId) })
            .hint({ establishmentId: 1 });

        // Selective field loading for performance
        if (!includeFullDetails) {
            query.select('bookingCode status paymentStatus bookingType checkIn checkOut numberOfGuests pricingDetails clientInfo createdAt');
        }

        // Apply pagination
        const result = await paginate(query, {
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
     * Get booking history for a client with lazy loading
     */
    static async getClientBookingHistory(
        clientEmail: string,
        page: number = 1,
        limit: number = 10,
        includeAccommodation: boolean = false
    ): Promise<PaginationResult<BookingResponse>> {
        await connectDB();

        // Use cursor-based pagination for history
        const useCursorPagination = limit > 50;

        // Build aggregation pipeline (index will be used automatically based on match)
        const pipeline: PipelineStage[] = [
            { $match: { 'clientInfo.email': clientEmail.toLowerCase() } },
        ];

        if (includeAccommodation) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'accommodations',
                        localField: 'accommodationId',
                        foreignField: '_id',
                        as: 'accommodation',
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    type: 1,
                                },
                            },
                        ],
                    },
                },
                { $unwind: { path: '$accommodation', preserveNullAndEmptyArrays: true } }
            );
        }

        // Add projection for selective loading
        pipeline.push({
            $project: {
                _id: 1,
                bookingCode: 1,
                status: 1,
                paymentStatus: 1,
                bookingType: 1,
                checkIn: 1,
                checkOut: 1,
                numberOfGuests: 1,
                pricingDetails: 1,
                clientInfo: includeAccommodation ? 0 : 1, // Exclude clientInfo if accommodation included
                createdAt: 1,
                accommodation: includeAccommodation ? 1 : 0,
            },
        });

        pipeline.push({ $sort: { createdAt: -1 } });

        // Add pagination
        if (useCursorPagination) {
            pipeline.push({ $limit: page * limit });
            pipeline.push({ $skip: (page - 1) * limit });
        } else {
            pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
        }

        const data = await BookingModel.aggregate(pipeline);
        const total = await BookingModel.countDocuments({ 'clientInfo.email': clientEmail.toLowerCase() });

        const totalPages = Math.ceil(total / limit);

        return {
            data: data.map((booking: any) => ({
                ...booking,
                id: booking._id.toString(),
                establishmentId: booking.establishmentId?.toString(),
                accommodationId: booking.accommodationId?.toString(),
                createdBy: booking.createdBy?.toString(),
            })) as BookingResponse[],
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
      * Get bookings by client email with pagination
      */
    static async getByClientEmail(
        email: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginationResult<BookingResponse>> {
        await connectDB();

        // Use cursor-based pagination for large datasets
        const useCursorPagination = limit > 50;

        // Build query with selective field loading
        const query = BookingModel.find({ 'clientInfo.email': email.toLowerCase() })
            .hint({ 'clientInfo.email': 1 })
            .select('bookingCode status paymentStatus bookingType checkIn checkOut numberOfGuests pricingDetails createdAt');

        // Apply pagination
        const result = await paginate(query, {
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
        ] as PipelineStage[]);

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
        ] as PipelineStage[]);

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
     * Get bookings for virtual scrolling (progressive loading)
     * Returns data in chunks optimized for UI virtual scrolling components
     */
    static async getBookingsForVirtualScroll(
        filters: BookingFilterOptions = {},
        startIndex: number = 0,
        chunkSize: number = 50
    ): Promise<{
        data: BookingResponse[];
        total: number;
        hasMore: boolean;
    }> {
        await connectDB();

        // Build match conditions
        const matchConditions: any = {};

        if (filters.establishmentId) {
            matchConditions.establishmentId = toObjectId(filters.establishmentId);
        }

        if (filters.status) {
            matchConditions.status = filters.status;
        }

        // Use aggregation for efficient chunked loading
        const pipeline: PipelineStage[] = [
            { $match: matchConditions },
            {
                $project: {
                    _id: 1,
                    bookingCode: 1,
                    status: 1,
                    paymentStatus: 1,
                    bookingType: 1,
                    checkIn: 1,
                    checkOut: 1,
                    numberOfGuests: 1,
                    'pricingDetails.total': 1,
                    'clientInfo.firstName': 1,
                    'clientInfo.lastName': 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: startIndex },
            { $limit: chunkSize },
        ];

        const [data, totalResult] = await Promise.all([
            BookingModel.aggregate(pipeline, { hint: { createdAt: -1 } }),
            BookingModel.countDocuments(matchConditions),
        ]);

        return {
            data: data.map((booking: any) => ({
                ...booking,
                id: booking._id.toString(),
                establishmentId: booking.establishmentId?.toString(),
                accommodationId: booking.accommodationId?.toString(),
                createdBy: booking.createdBy?.toString(),
            })) as BookingResponse[],
            total: totalResult,
            hasMore: startIndex + chunkSize < totalResult,
        };
    }

    /**
     * Create a walk-in booking with automatic same-day handling
     */
    static async createWalkInBooking(
        data: Omit<CreateBookingInput, 'bookingType'>,
        context?: EstablishmentServiceContext
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

        return this.create(walkInData, context);
    }
}

export default BookingService;
