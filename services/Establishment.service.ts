import { EstablishmentModel } from '@/models/Establishment.model';
import UserModel from '@/models/User.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult } from '@/lib/db/utils';
import { getEstablishmentsWithStats } from '@/lib/db/optimized-queries';
import { cache } from '@/lib/performance/cache';
import type {
  CreateEstablishmentInput,
  UpdateEstablishmentInput,
  EstablishmentResponse,
  EstablishmentFilterOptions,
} from '@/types/establishment.types';
import { toObjectId } from '@/lib/db/utils';

/**
 * Establishment Service
 * Handles all establishment-related operations
 */
export class EstablishmentService {
  /**
   * Create a new establishment
   */
  static async create(data: CreateEstablishmentInput): Promise<EstablishmentResponse> {
    await connectDB();

    // Verify manager exists and has correct role
    if(data.managerId){
      const manager = await UserModel.findById(data.managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
  
      if (manager.role !== 'manager' && manager.role !== 'super_admin') {
        throw new Error('User must have manager or super_admin role');
      }
    }

    // Verify staff members exist
    if (data.staffIds && data.staffIds.length > 0) {
      const staff = await UserModel.find({ _id: { $in: data.staffIds } });
      if (staff.length !== data.staffIds.length) {
        throw new Error('One or more staff members not found');
      }
    }
    let hotelManager;

    if(data.managerId){
      hotelManager = toObjectId(data.managerId)
    }

    // Create establishment
    const establishment = await EstablishmentModel.create({
      ...data,
      managerId: hotelManager,
      staffIds: data.staffIds?.map((id) => toObjectId(id)) || [],
    });

    // Update manager's establishmentId
    // manager.establishmentId = establishment._id as any;
    // await manager.save();

    // Update staff members' establishmentId
    if (data.staffIds && data.staffIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: data.staffIds } },
        { establishmentId: establishment._id }
      );
    }

    return establishment.toJSON() as unknown as EstablishmentResponse;
  }

  /**
   * Get establishment by ID
   */
  static async getById(id: string): Promise<EstablishmentResponse | null> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(id)
      .populate('manager', 'email profile role')
      .populate('staff', 'email profile role');

    if (!establishment) {
      return null;
    }

    return establishment.toJSON() as unknown as EstablishmentResponse;
  }

  /**
   * Get all establishments with filters and pagination
   */
  static async getAll(
    filters: EstablishmentFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<EstablishmentResponse>> {
    await connectDB();

    // Build query
    const query: any = {};

    if (filters.city) {
      query['location.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.pricingMode) {
      query.pricingMode = filters.pricingMode;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.managerId) {
      query.managerId = toObjectId(filters.managerId);
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Execute query with pagination
    const result = await paginate(EstablishmentModel.find(query), {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((est) => est.toJSON() as unknown as EstablishmentResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Get all establishments with optimized aggregation and statistics
   * Uses Redis caching for better performance
   */
  static async getAllOptimized(
    filters: EstablishmentFilterOptions = {},
    useCache: boolean = true
  ): Promise<EstablishmentResponse[]> {
    await connectDB();

    // For now, use the optimized query without filters
    // TODO: Add filter support to optimized query
    const establishments = await getEstablishmentsWithStats({ useCache });

    // Apply basic filters client-side for now
    let filtered = establishments;

    if (filters.city) {
      filtered = filtered.filter(est =>
        est.location?.city?.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters.pricingMode) {
      filtered = filtered.filter(est => est.pricingMode === filters.pricingMode);
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(est => est.isActive === filters.isActive);
    }

    if (filters.managerId) {
      filtered = filtered.filter(est => est.managerId === filters.managerId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(est =>
        est.name?.toLowerCase().includes(searchLower) ||
        est.description?.toLowerCase().includes(searchLower) ||
        est.location?.city?.toLowerCase().includes(searchLower)
      );
    }

    return filtered as EstablishmentResponse[];
  }

  /**
   * Update establishment
   */
  static async update(
    id: string,
    data: UpdateEstablishmentInput
  ): Promise<EstablishmentResponse | null> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(id);

    if (!establishment) {
      return null;
    }

    // If manager is being changed, verify new manager
    if (data.managerId && data.managerId !== establishment.managerId.toString()) {
      const newManager = await UserModel.findById(data.managerId);
      if (!newManager) {
        throw new Error('New manager not found');
      }

      if (newManager.role !== 'manager' && newManager.role !== 'super_admin') {
        throw new Error('User must have manager or super_admin role');
      }

      // Update old manager's establishmentId
      await UserModel.findByIdAndUpdate(establishment.managerId, {
        $unset: { establishmentId: 1 },
      });

      // Update new manager's establishmentId
      newManager.establishmentId = establishment._id as any;
      await newManager.save();

      establishment.managerId = toObjectId(data.managerId);
    }

    // If staff is being updated, verify staff members
    if (data.staffIds) {
      const staff = await UserModel.find({ _id: { $in: data.staffIds } });
      if (staff.length !== data.staffIds.length) {
        throw new Error('One or more staff members not found');
      }

      // Remove establishment from old staff
      await UserModel.updateMany(
        { _id: { $in: establishment.staffIds } },
        { $unset: { establishmentId: 1 } }
      );

      // Add establishment to new staff
      await UserModel.updateMany(
        { _id: { $in: data.staffIds } },
        { establishmentId: establishment._id }
      );

      establishment.staffIds = data.staffIds.map((id) => toObjectId(id));
    }

    // Update other fields
    Object.assign(establishment, data);

    await establishment.save();

    return establishment.toJSON() as unknown as EstablishmentResponse;
  }

  /**
   * Delete establishment
   */
  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(id);

    if (!establishment) {
      return false;
    }

    // Remove establishment from manager and staff
    await UserModel.updateMany(
      {
        $or: [{ _id: establishment.managerId }, { _id: { $in: establishment.staffIds } }],
      },
      { $unset: { establishmentId: 1 } }
    );

    await establishment.deleteOne();

    return true;
  }

  /**
   * Get establishments by city with pagination
   */
  static async getByCity(
    city: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<EstablishmentResponse>> {
    await connectDB();

    // Execute query with pagination
    const result = await paginate(
      EstablishmentModel.find({ 'location.city': new RegExp(city, 'i') })
        .hint({ 'location.city': 1 })
        .select('name location contacts pricingMode isActive createdAt'),
      {
        page,
        limit,
        sort: { createdAt: -1 },
      }
    );

    return {
      data: result.data.map((est) => est.toJSON() as unknown as EstablishmentResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Get establishments by manager with pagination
   */
  static async getByManager(
    managerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<EstablishmentResponse>> {
    await connectDB();

    // Execute query with pagination
    const result = await paginate(
      EstablishmentModel.find({ managerId: toObjectId(managerId) })
        .hint({ managerId: 1 })
        .select('name location contacts pricingMode isActive createdAt'),
      {
        page,
        limit,
        sort: { createdAt: -1 },
      }
    );

    return {
      data: result.data.map((est) => est.toJSON() as unknown as EstablishmentResponse),
      pagination: result.pagination,
    };
  }

  /**
    * Get active establishments
    */
   static async getActive(): Promise<EstablishmentResponse[]> {
     await connectDB();

     return cache.getOrSet(
       'active_establishments',
       async () => {
         const establishments = await EstablishmentModel.findActive();
         return establishments.map((est) => est.toJSON() as unknown as EstablishmentResponse);
       },
       600 // Cache for 10 minutes - establishments don't change frequently
     );
   }

  /**
   * Add staff member to establishment
   */
  static async addStaff(establishmentId: string, staffId: string): Promise<void> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      throw new Error('Establishment not found');
    }

    const staff = await UserModel.findById(staffId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    if (staff.role !== 'staff') {
      throw new Error('User must have staff role');
    }

    // Add staff to establishment
    if (!establishment.staffIds.includes(toObjectId(staffId))) {
      establishment.staffIds.push(toObjectId(staffId));
      await establishment.save();
    }

    // Update staff's establishmentId
    staff.establishmentId = establishment._id as any;
    await staff.save();
  }

  /**
   * Remove staff member from establishment
   */
  static async removeStaff(establishmentId: string, staffId: string): Promise<void> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      throw new Error('Establishment not found');
    }

    // Remove staff from establishment
    establishment.staffIds = establishment.staffIds.filter(
      (id) => id.toString() !== staffId
    );
    await establishment.save();

    // Remove establishmentId from staff
    await UserModel.findByIdAndUpdate(staffId, { $unset: { establishmentId: 1 } });
  }

  /**
   * Toggle establishment active status
   */
  static async toggleActive(id: string): Promise<EstablishmentResponse | null> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(id);

    if (!establishment) {
      return null;
    }

    establishment.isActive = !establishment.isActive;
    await establishment.save();

    return establishment.toJSON() as unknown as EstablishmentResponse;
  }
}

export default EstablishmentService;
