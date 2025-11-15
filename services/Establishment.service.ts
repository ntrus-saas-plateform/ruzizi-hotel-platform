import { EstablishmentModel } from '@/models/Establishment.model';
import UserModel from '@/models/User.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult } from '@/lib/db/utils';
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
   * Get establishments by city
   */
  static async getByCity(city: string): Promise<EstablishmentResponse[]> {
    await connectDB();

    const establishments = await EstablishmentModel.findByCity(city);

    return establishments.map((est) => est.toJSON() as unknown as EstablishmentResponse);
  }

  /**
   * Get establishments by manager
   */
  static async getByManager(managerId: string): Promise<EstablishmentResponse[]> {
    await connectDB();

    const establishments = await EstablishmentModel.findByManager(managerId);

    return establishments.map((est) => est.toJSON() as unknown as EstablishmentResponse);
  }

  /**
   * Get active establishments
   */
  static async getActive(): Promise<EstablishmentResponse[]> {
    await connectDB();

    const establishments = await EstablishmentModel.findActive();

    return establishments.map((est) => est.toJSON() as unknown as EstablishmentResponse);
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
