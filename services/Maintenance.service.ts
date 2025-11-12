import { MaintenanceModel } from '@/models/Maintenance.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { NotificationService } from './Notification.service';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateMaintenanceInput,
  MaintenanceResponse,
  MaintenanceFilterOptions,
  MaintenanceSummary,
} from '@/types/maintenance.types';

export class MaintenanceService {
  static async create(data: CreateMaintenanceInput): Promise<MaintenanceResponse> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(data.accommodationId);
    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    const maintenance = await MaintenanceModel.create({
      ...data,
      accommodationId: toObjectId(data.accommodationId),
      assignedTo: data.assignedTo ? toObjectId(data.assignedTo) : undefined,
    });

    // Mettre l'hébergement en maintenance si priorité haute ou urgente
    if (data.priority === 'high' || data.priority === 'urgent') {
      await AccommodationModel.findByIdAndUpdate(data.accommodationId, {
        status: 'maintenance',
      });
    }

    // Notifier l'assigné si présent
    if (data.assignedTo) {
      await NotificationService.create({
        userId: data.assignedTo,
        type: 'maintenance_assigned',
        title: 'Maintenance assignée',
        message: `Une tâche de maintenance vous a été assignée pour ${accommodation.name}.`,
        data: {
          maintenanceId: String(maintenance._id),
          accommodationName: accommodation.name,
          type: data.type,
          priority: data.priority,
        },
      });
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async getById(id: string): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id)
      .populate('accommodationId', 'name type')
      .populate('assignedTo', 'personalInfo');

    if (!maintenance) {
      return null;
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async getAll(
    filters: MaintenanceFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<MaintenanceResponse>> {
    await connectDB();

    const query: any = {};

    if (filters.accommodationId) {
      query.accommodationId = toObjectId(filters.accommodationId);
    }

    if (filters.establishmentId) {
      const accommodations = await AccommodationModel.find({
        establishmentId: toObjectId(filters.establishmentId),
      });
      const accommodationIds = accommodations.map((acc) => acc._id);
      query.accommodationId = { $in: accommodationIds };
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.assignedTo) {
      query.assignedTo = toObjectId(filters.assignedTo);
    }

    if (filters.dateFrom || filters.dateTo) {
      query.scheduledDate = {};
      if (filters.dateFrom) {
        query.scheduledDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.scheduledDate.$lte = filters.dateTo;
      }
    }

    const result = await paginate(
      MaintenanceModel.find(query)
        .populate('accommodationId', 'name type')
        .populate('assignedTo', 'personalInfo'),
      {
        page,
        limit,
        sort: { scheduledDate: -1 },
      }
    );

    return {
      data: result.data.map((maintenance) => maintenance.toJSON() as unknown as MaintenanceResponse),
      pagination: result.pagination,
    };
  }

  static async update(
    id: string,
    data: Partial<CreateMaintenanceInput>
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findByIdAndUpdate(id, data, { new: true });

    if (!maintenance) {
      return null;
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const result = await MaintenanceModel.findByIdAndDelete(id);

    return !!result;
  }

  static async complete(id: string): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedDate: new Date(),
      },
      { new: true }
    ).populate('accommodationId');

    if (!maintenance) {
      return null;
    }

    // Remettre l'hébergement disponible
    await AccommodationModel.findByIdAndUpdate(maintenance.accommodationId, {
      status: 'available',
    });

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async start(id: string): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findByIdAndUpdate(
      id,
      { status: 'in_progress' },
      { new: true }
    );

    if (!maintenance) {
      return null;
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async assign(id: string, assignedTo: string): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findByIdAndUpdate(
      id,
      { assignedTo: toObjectId(assignedTo) },
      { new: true }
    ).populate('accommodationId', 'name type')
     .populate('assignedTo', 'personalInfo');

    if (!maintenance) {
      return null;
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async getByAccommodation(accommodationId: string): Promise<MaintenanceResponse[]> {
    await connectDB();

    const maintenances = await MaintenanceModel.findByAccommodation(accommodationId);

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getUpcoming(days: number = 7): Promise<MaintenanceResponse[]> {
    await connectDB();

    const maintenances = await MaintenanceModel.findUpcoming(days);

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getByAssignee(assigneeId: string): Promise<MaintenanceResponse[]> {
    await connectDB();

    const maintenances = await MaintenanceModel.findByAssignee(assigneeId);

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getSummary(filters: MaintenanceFilterOptions = {}): Promise<MaintenanceSummary> {
    await connectDB();

    const query: any = {};

    if (filters.establishmentId) {
      const accommodations = await AccommodationModel.find({
        establishmentId: toObjectId(filters.establishmentId),
      });
      const accommodationIds = accommodations.map((acc) => acc._id);
      query.accommodationId = { $in: accommodationIds };
    }

    if (filters.dateFrom || filters.dateTo) {
      query.scheduledDate = {};
      if (filters.dateFrom) {
        query.scheduledDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.scheduledDate.$lte = filters.dateTo;
      }
    }

    const maintenances = await MaintenanceModel.find(query);

    const total = maintenances.length;
    const scheduled = maintenances.filter((m) => m.status === 'scheduled').length;
    const inProgress = maintenances.filter((m) => m.status === 'in_progress').length;
    const completed = maintenances.filter((m) => m.status === 'completed').length;
    const cancelled = maintenances.filter((m) => m.status === 'cancelled').length;
    const totalCost = maintenances
      .filter((m) => m.status === 'completed' && m.cost)
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }
}

export default MaintenanceService;
