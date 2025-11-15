import { AccommodationModel } from '@/models/Accommodation.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
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
  static async create(data: CreateAccommodationInput): Promise<AccommodationResponse> {
    await connectDB();

    // Verify establishment exists
    const establishment = await EstablishmentModel.findById(data.establishmentId);
    if (!establishment) {
      throw new Error('Establishment not found');
    }

    // Create accommodation
    const accommodation = await AccommodationModel.create({
      ...data,
      establishmentId: toObjectId(data.establishmentId),
    });

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Get accommodation by ID
   */
  static async getById(id: string): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id).populate(
      'establishmentId',
      'name location contacts'
    );

    if (!accommodation) {
      return null;
    }

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Get all accommodations with filters and pagination
   */
  static async getAll(
    filters: AccommodationFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<AccommodationResponse>> {
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

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Execute query with pagination and populate establishment
    const result = await paginate(
      AccommodationModel.find(query).populate('establishmentId', 'name location contacts'),
      {
        page,
        limit,
        sort: { createdAt: -1 },
      }
    );

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
    data: UpdateAccommodationInput
  ): Promise<AccommodationResponse | null> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return null;
    }

    // Update fields
    Object.assign(accommodation, data);

    await accommodation.save();

    return accommodation.toJSON() as unknown as AccommodationResponse;
  }

  /**
   * Delete accommodation
   */
  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(id);

    if (!accommodation) {
      return false;
    }

    await accommodation.deleteOne();

    return true;
  }

  /**
   * Get accommodations by establishment
   */
  static async getByEstablishment(establishmentId: string): Promise<AccommodationResponse[]> {
    await connectDB();

    const accommodations = await AccommodationModel.findByEstablishment(establishmentId);

    return accommodations.map((acc) => acc.toJSON() as unknown as AccommodationResponse);
  }

  /**
   * Get available accommodations
   */
  static async getAvailable(establishmentId?: string): Promise<AccommodationResponse[]> {
    await connectDB();

    const accommodations = await AccommodationModel.findAvailable(establishmentId);

    return accommodations.map((acc) => acc.toJSON() as unknown as AccommodationResponse);
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
   * Search accommodations
   */
  static async search(
    searchTerm: string,
    establishmentId?: string
  ): Promise<AccommodationResponse[]> {
    await connectDB();

    const query: any = {
      $text: { $search: searchTerm },
    };

    if (establishmentId) {
      query.establishmentId = toObjectId(establishmentId);
    }

    const accommodations = await AccommodationModel.find(query);

    return accommodations.map((acc) => acc.toJSON() as unknown as AccommodationResponse);
  }
}

export default AccommodationService;
