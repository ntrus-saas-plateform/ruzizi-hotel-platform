import { PipelineStage } from 'mongoose';
import { AccommodationModel } from '@/models/Accommodation.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { cache } from '@/lib/performance/cache';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateAccommodationInput,
  UpdateAccommodationInput,
  AccommodationResponse,
  AccommodationFilterOptions,
  AddMaintenanceInput,
} from '@/types/accommodation.types';

/**
 * Accommodation Service
 * Handles all accommodation-related operations
 */
export class AccommodationService {
  /**
   * Create a new accommodation
   */
  static async create(
    data: CreateAccommodationInput,
    context?: EstablishmentServiceContext
  ): Promise<AccommodationResponse> {
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

    // Create accommodation with enforced establishmentId
    const accommodation = await AccommodationModel.create({
      ...data,
      establishmentId: toObjectId(effectiveEstablishmentId),
    });

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Get accommodation by ID
   */
  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id).populate(
      'establishmentId',
      'name location contacts'
    );

    if (!accommodation) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'accommodation',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Get all accommodations with filters and optimized pagination
   */
  static async getAll(
    filters: AccommodationFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    includeFullDetails: boolean = false,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<AccommodationResponse>> {
    await connectDB();

    // Use cursor-based pagination for large datasets
    const useCursorPagination = limit > 50;

    // Build query with index hints
    const query: any = {};

    // Apply establishment filter from context
    if (context) {
      const filteredConditions = context.applyFilter(filters);
      if (filteredConditions.establishmentId) {
        query.establishmentId = toObjectId(filteredConditions.establishmentId);
      }
    } else if (filters.establishmentId) {
      query.establishmentId = toObjectId(filters.establishmentId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.pricingMode) {
      query.pricingMode = filters.pricingMode;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['pricing.basePrice'] = {};
      if (filters.minPrice !== undefined) {
        query['pricing.basePrice'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query['pricing.basePrice'].$lte = filters.maxPrice;
      }
    }

    if (filters.minGuests) {
      query['capacity.maxGuests'] = { $gte: filters.minGuests };
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Build base query with selective field loading
    let baseQuery = AccommodationModel.find(query);

    if (!includeFullDetails) {
      baseQuery = baseQuery.select(
        'name type pricing status capacity images amenities createdAt updatedAt establishmentId'
      );
    }

    // Add index hint based on query
    if (filters.establishmentId) {
      baseQuery = baseQuery.hint({ establishmentId: 1, status: 1 });
    } else if (filters.search) {
      // Use text index
    } else {
      // No hint for general queries, let MongoDB optimizer choose
    }

    // Execute query with pagination
    const result = await paginate(baseQuery, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((acc) => acc.toJSON() as unknown as AccommodationResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Update accommodation
   */
  static async update(
    id: string,
    data: UpdateAccommodationInput,
    context?: EstablishmentServiceContext
  ): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'accommodation',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    // Update fields
    Object.assign(accommodation, data);

    await accommodation.save();

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Delete accommodation
   */
  static async delete(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<boolean> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'accommodation',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    await accommodation.deleteOne();

    return true;
  }

  /**
   * Get accommodations by establishment with pagination
   */
  static async getByEstablishment(
    establishmentId: string,
    page: number = 1,
    limit: number = 20,
    includeFullDetails: boolean = false
  ): Promise<PaginationResult<AccommodationResponse>> {
    await connectDB();

    // Use cursor-based pagination for large datasets
    const useCursorPagination = limit > 50;

    // Build query with index hint
    let query = AccommodationModel.find({ establishmentId: toObjectId(establishmentId) })
      .hint({ establishmentId: 1 });

    // Selective field loading
    if (!includeFullDetails) {
      query = query.select(
        'name type pricing status capacity images amenities createdAt'
      );
    }

    // Apply pagination
    const result = await paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((acc) => acc.toJSON() as unknown as AccommodationResponse),
      pagination: result.pagination,
    };
  }

  /**
    * Get available accommodations
    */
   static async getAvailable(establishmentId?: string): Promise<AccommodationResponse[]> {
     await connectDB();

     const cacheKey = `available_accommodations${establishmentId ? `:${establishmentId}` : ''}`;

     return cache.getOrSet(
       cacheKey,
       async () => {
         const accommodations = await AccommodationModel.findAvailable(establishmentId);
         return accommodations.map((acc) => acc.toJSON() as unknown as AccommodationResponse);
       },
       300 // Cache for 5 minutes - availability changes frequently but not constantly
     );
   }

  /**
   * Update accommodation status
   */
  static async updateStatus(
    id: string,
    status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  ): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return null;
    }

    accommodation.status = status;
    await accommodation.save();

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Add maintenance entry
   */
  static async addMaintenance(
    id: string,
    maintenanceData: AddMaintenanceInput
  ): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return null;
    }

    accommodation.maintenanceHistory.push(maintenanceData);

    // If adding maintenance, update status to maintenance
    if (accommodation.status === 'available') {
      accommodation.status = 'maintenance';
    }

    await accommodation.save();

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Get accommodation statistics for an establishment
   */
  static async getEstablishmentStats(establishmentId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
    occupancyRate: number;
  }> {
    await connectDB();

    const accommodations = await AccommodationModel.findByEstablishment(establishmentId);

    const total = accommodations.length;
    const available = accommodations.filter((acc) => acc.status === 'available').length;
    const occupied = accommodations.filter((acc) => acc.status === 'occupied').length;
    const maintenance = accommodations.filter((acc) => acc.status === 'maintenance').length;
    const reserved = accommodations.filter((acc) => acc.status === 'reserved').length;

    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    return {
      total,
      available,
      occupied,
      maintenance,
      reserved,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }

  /**
   * Search accommodations with pagination
   */
  static async search(
    searchTerm: string,
    establishmentId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<AccommodationResponse>> {
    await connectDB();

    const query: any = {
      $text: { $search: searchTerm },
    };

    if (establishmentId) {
      query.establishmentId = toObjectId(establishmentId);
    }

    // Execute query with pagination
    const result = await paginate(
      AccommodationModel.find(query).select(
        'name type pricing status capacity images score createdAt'
      ),
      {
        page,
        limit,
        sort: { score: { $meta: 'textScore' } } as any, // Sort by text search relevance
      }
    );

    return {
      data: result.data.map((acc) => acc.toJSON() as unknown as AccommodationResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Get accommodations for virtual scrolling (progressive loading)
   */
  static async getAccommodationsForVirtualScroll(
    filters: AccommodationFilterOptions = {},
    startIndex: number = 0,
    chunkSize: number = 50
  ): Promise<{
    data: AccommodationResponse[];
    total: number;
    hasMore: boolean;
  }> {
    await connectDB();

    // Build query
    const query: any = {};

    if (filters.establishmentId) {
      query.establishmentId = toObjectId(filters.establishmentId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.pricingMode) {
      query.pricingMode = filters.pricingMode;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['pricing.basePrice'] = {};
      if (filters.minPrice !== undefined) {
        query['pricing.basePrice'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query['pricing.basePrice'].$lte = filters.maxPrice;
      }
    }

    if (filters.minGuests) {
      query['capacity.maxGuests'] = { $gte: filters.minGuests };
    }

    // Use aggregation for efficient chunked loading
    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          pricing: 1,
          status: 1,
          'capacity.maxGuests': 1,
          images: { $slice: ['$images', 1] }, // Only first image
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: chunkSize },
    ];

    const [data, total] = await Promise.all([
      AccommodationModel.aggregate(pipeline),
      AccommodationModel.countDocuments(query),
    ]);

    return {
      data: data.map((acc: any) => ({
        ...acc,
        id: acc._id.toString(),
        establishmentId: acc.establishmentId?.toString(),
      })) as AccommodationResponse[],
      total,
      hasMore: startIndex + chunkSize < total,
    };
  }
}

export default AccommodationService;
