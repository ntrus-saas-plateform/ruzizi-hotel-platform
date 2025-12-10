import { MaintenanceModel } from '@/models/Maintenance.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { NotificationService } from './Notification.service';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  CrossEstablishmentRelationshipError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateMaintenanceInput,
  MaintenanceResponse,
  MaintenanceFilterOptions,
  MaintenanceSummary,
} from '@/types/maintenance.types';

export class MaintenanceService {
  static async create(
    data: CreateMaintenanceInput,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse> {
    await connectDB();

    const accommodation = await AccommodationModel.findById(data.accommodationId);
    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    // Validate accommodation-maintenance relationship (same establishment)
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new CrossEstablishmentRelationshipError({
          parentResource: {
            type: 'accommodation',
            id: data.accommodationId,
            establishmentId: accommodation.establishmentId.toString(),
          },
          childResource: {
            type: 'maintenance',
            id: 'new',
            establishmentId: context.getEstablishmentId() || 'unknown',
          },
        });
      }
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

  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id)
      .populate('accommodationId', 'name type establishmentId')
      .populate('assignedTo', 'personalInfo');

    if (!maintenance) {
      return null;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async getAll(
    filters: MaintenanceFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<MaintenanceResponse>> {
    await connectDB();

    const query: any = {};

    // Apply establishment filter from context
    let effectiveEstablishmentId = filters.establishmentId;
    if (context) {
      const filteredConditions = context.applyFilter(filters);
      if (filteredConditions.establishmentId) {
        effectiveEstablishmentId = filteredConditions.establishmentId;
      }
    }

    if (filters.accommodationId) {
      query.accommodationId = toObjectId(filters.accommodationId);
    }

    if (effectiveEstablishmentId) {
      const accommodations = await AccommodationModel.find({
        establishmentId: toObjectId(effectiveEstablishmentId),
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
    data: Partial<CreateMaintenanceInput>,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id).populate('accommodationId', 'establishmentId');

    if (!maintenance) {
      return null;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    // If updating accommodationId, validate the new accommodation
    if (data.accommodationId && context) {
      const newAccommodation = await AccommodationModel.findById(data.accommodationId);
      if (!newAccommodation) {
        throw new Error('Accommodation not found');
      }

      const hasAccess = await context.validateAccess(
        { establishmentId: newAccommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new CrossEstablishmentRelationshipError({
          parentResource: {
            type: 'accommodation',
            id: data.accommodationId,
            establishmentId: newAccommodation.establishmentId.toString(),
          },
          childResource: {
            type: 'maintenance',
            id: id,
            establishmentId: context.getEstablishmentId() || 'unknown',
          },
        });
      }
    }

    Object.assign(maintenance, data);
    await maintenance.save();

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async delete(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<boolean> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id).populate('accommodationId', 'establishmentId');

    if (!maintenance) {
      return false;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    await maintenance.deleteOne();

    return true;
  }

  static async complete(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id).populate('accommodationId', 'establishmentId');

    if (!maintenance) {
      return null;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    maintenance.status = 'completed';
    maintenance.completedDate = new Date();
    await maintenance.save();

    // Remettre l'hébergement disponible
    await AccommodationModel.findByIdAndUpdate(maintenance.accommodationId, {
      status: 'available',
    });

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async start(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id).populate('accommodationId', 'establishmentId');

    if (!maintenance) {
      return null;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    maintenance.status = 'in_progress';
    await maintenance.save();

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async assign(
    id: string,
    assignedTo: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse | null> {
    await connectDB();

    const maintenance = await MaintenanceModel.findById(id).populate('accommodationId', 'name type establishmentId');

    if (!maintenance) {
      return null;
    }

    // Validate access through accommodation's establishment
    if (context && maintenance.accommodationId) {
      const accommodation = maintenance.accommodationId as any;
      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'maintenance'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'maintenance',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    maintenance.assignedTo = toObjectId(assignedTo) as any;
    await maintenance.save();

    await maintenance.populate('assignedTo', 'personalInfo');

    return maintenance.toJSON() as unknown as MaintenanceResponse;
  }

  static async getByAccommodation(
    accommodationId: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse[]> {
    await connectDB();

    // Validate access to the accommodation
    if (context) {
      const accommodation = await AccommodationModel.findById(accommodationId);
      if (!accommodation) {
        throw new Error('Accommodation not found');
      }

      const hasAccess = await context.validateAccess(
        { establishmentId: accommodation.establishmentId },
        'accommodation'
      );

      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'accommodation',
          resourceId: accommodationId,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: accommodation.establishmentId.toString(),
        });
      }
    }

    const maintenances = await MaintenanceModel.findByAccommodation(accommodationId);

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getUpcoming(
    days: number = 7,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse[]> {
    await connectDB();

    let maintenances = await MaintenanceModel.findUpcoming(days);

    // Filter by establishment if context is provided
    if (context && !context.canAccessAll()) {
      const establishmentId = context.getEstablishmentId();
      if (establishmentId) {
        const accommodations = await AccommodationModel.find({
          establishmentId: toObjectId(establishmentId),
        });
        const accommodationIds = accommodations.map((acc) => acc._id.toString());
        
        maintenances = maintenances.filter((m) => 
          accommodationIds.includes(m.accommodationId.toString())
        );
      }
    }

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getByAssignee(
    assigneeId: string,
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceResponse[]> {
    await connectDB();

    let maintenances = await MaintenanceModel.findByAssignee(assigneeId);

    // Filter by establishment if context is provided
    if (context && !context.canAccessAll()) {
      const establishmentId = context.getEstablishmentId();
      if (establishmentId) {
        const accommodations = await AccommodationModel.find({
          establishmentId: toObjectId(establishmentId),
        });
        const accommodationIds = accommodations.map((acc) => acc._id.toString());
        
        maintenances = maintenances.filter((m) => 
          accommodationIds.includes(m.accommodationId.toString())
        );
      }
    }

    return maintenances.map((m) => m.toJSON() as unknown as MaintenanceResponse);
  }

  static async getSummary(
    filters: MaintenanceFilterOptions = {},
    context?: EstablishmentServiceContext
  ): Promise<MaintenanceSummary> {
    await connectDB();

    const query: any = {};

    // Apply establishment filter from context
    let effectiveEstablishmentId = filters.establishmentId;
    if (context) {
      const filteredConditions = context.applyFilter(filters);
      if (filteredConditions.establishmentId) {
        effectiveEstablishmentId = filteredConditions.establishmentId;
      }
    }

    if (effectiveEstablishmentId) {
      const accommodations = await AccommodationModel.find({
        establishmentId: toObjectId(effectiveEstablishmentId),
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
