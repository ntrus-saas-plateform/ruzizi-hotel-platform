import { LeaveModel } from '@/models/Leave.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  CrossEstablishmentRelationshipError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateLeaveInput,
  LeaveResponse,
  LeaveFilterOptions,
  LeaveBalance,
  LeaveSummary,
} from '@/types/leave.types';

export class LeaveService {
  static async create(
    data: CreateLeaveInput,
    context: EstablishmentServiceContext
  ): Promise<LeaveResponse> {
    await connectDB();

    // Validate employee exists and get their establishment
    const employee = await EmployeeModel.findById(data.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const employeeEstablishmentId = employee.employmentInfo.establishmentId.toString();

    // Validate relationship: employee must belong to the same establishment
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      if (employeeEstablishmentId !== userEstablishmentId) {
        throw new CrossEstablishmentRelationshipError({
          parentResource: { type: 'employee', id: data.employeeId, establishmentId: employeeEstablishmentId },
          childResource: { type: 'leave', id: 'new', establishmentId: userEstablishmentId! },
        });
      }
    }

    const days = LeaveModel.calculateDays(data.startDate, data.endDate);

    if (data.type === 'annual') {
      const balance = await this.getBalance(data.employeeId, new Date().getFullYear(), context);
      if (balance.annual.remaining < days) {
        throw new Error('Insufficient annual leave balance');
      }
    }

    const overlapping = await LeaveModel.findOne({
      employeeId: toObjectId(data.employeeId),
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: data.endDate },
          endDate: { $gte: data.startDate },
        },
      ],
    });

    if (overlapping) {
      throw new Error('Leave request overlaps with existing leave');
    }

    const leave = await LeaveModel.create({
      ...data,
      employeeId: toObjectId(data.employeeId),
      days,
    });

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id)
      .populate('employeeId', 'personalInfo employmentInfo')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async getAll(
    filters: LeaveFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<LeaveResponse>> {
    await connectDB();

    const query: any = {};

    // Apply establishment filter if context is provided
    let establishmentIdToFilter: string | undefined;
    if (context) {
      const baseFilter = context.applyFilter({});
      if (baseFilter.establishmentId) {
        establishmentIdToFilter = baseFilter.establishmentId.toString();
      }
    }

    // If establishment filter is provided (either from context or filters), use it
    if (establishmentIdToFilter || filters.establishmentId) {
      const targetEstablishmentId = establishmentIdToFilter || filters.establishmentId;
      const employees = await EmployeeModel.find({
        'employmentInfo.establishmentId': toObjectId(targetEstablishmentId!),
      });
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    if (filters.employeeId) {
      // If specific employee is requested, validate access
      if (context && !context.canAccessAll()) {
        const employee = await EmployeeModel.findById(filters.employeeId);
        if (employee) {
          const hasAccess = await context.validateAccess(
            { establishmentId: employee.employmentInfo.establishmentId.toString() },
            'leave'
          );
          if (!hasAccess) {
            throw new EstablishmentAccessDeniedError({
              userId: context.getUserId(),
              resourceType: 'leave',
              resourceId: 'list',
              userEstablishmentId: context.getEstablishmentId(),
              resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
            });
          }
        }
      }
      query.employeeId = toObjectId(filters.employeeId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) {
        query.startDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startDate.$lte = filters.endDate;
      }
    }

    const result = await paginate(
      LeaveModel.find(query).populate('employeeId', 'personalInfo employmentInfo'),
      {
        page,
        limit,
        sort: { startDate: -1 },
      }
    );

    return {
      data: result.data.map((leave) => leave.toJSON() as unknown as LeaveResponse),
      pagination: result.pagination,
    };
  }

  static async update(
    id: string,
    data: Partial<CreateLeaveInput>,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id);

    if (!leave) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    // If employeeId is being changed, validate the new employee
    if (data.employeeId && data.employeeId !== leave.employeeId.toString()) {
      const newEmployee = await EmployeeModel.findById(data.employeeId);
      if (!newEmployee) {
        throw new Error('New employee not found');
      }

      // Validate relationship with new employee
      if (context && !context.canAccessAll()) {
        const userEstablishmentId = context.getEstablishmentId();
        const newEmployeeEstablishmentId = newEmployee.employmentInfo.establishmentId.toString();
        if (newEmployeeEstablishmentId !== userEstablishmentId) {
          throw new CrossEstablishmentRelationshipError({
            parentResource: { type: 'employee', id: data.employeeId, establishmentId: newEmployeeEstablishmentId },
            childResource: { type: 'leave', id: id, establishmentId: userEstablishmentId! },
          });
        }
      }
    }

    const updatedLeave = await LeaveModel.findByIdAndUpdate(id, data, { new: true });

    if (!updatedLeave) {
      return null;
    }

    return updatedLeave.toJSON() as unknown as LeaveResponse;
  }

  static async delete(id: string, context?: EstablishmentServiceContext): Promise<boolean> {
    await connectDB();

    const leave = await LeaveModel.findById(id);

    if (!leave) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    await LeaveModel.findByIdAndDelete(id);

    return true;
  }

  static async approve(
    id: string,
    approvedBy: string,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id);

    if (!leave) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const updatedLeave = await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: toObjectId(approvedBy),
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedLeave) {
      return null;
    }

    return updatedLeave.toJSON() as unknown as LeaveResponse;
  }

  static async reject(
    id: string,
    approvedBy: string,
    reason: string,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id);

    if (!leave) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const updatedLeave = await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy: toObjectId(approvedBy),
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!updatedLeave) {
      return null;
    }

    return updatedLeave.toJSON() as unknown as LeaveResponse;
  }

  static async cancel(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id);

    if (!leave) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(leave.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const updatedLeave = await LeaveModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!updatedLeave) {
      return null;
    }

    return updatedLeave.toJSON() as unknown as LeaveResponse;
  }

  static async getByEmployee(
    employeeId: string,
    year?: number,
    context?: EstablishmentServiceContext
  ): Promise<LeaveResponse[]> {
    await connectDB();

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'leave'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'leave',
            resourceId: 'list',
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const leaves = await LeaveModel.findByEmployee(employeeId, year);

    return leaves.map((leave) => leave.toJSON() as unknown as LeaveResponse);
  }

  static async getPending(context?: EstablishmentServiceContext): Promise<LeaveResponse[]> {
    await connectDB();

    let leaves = await LeaveModel.findPending();

    // Apply establishment filter if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      leaves = leaves.filter((leave: any) => {
        const employee = leave.employeeId;
        return employee && employee.employmentInfo.establishmentId.toString() === userEstablishmentId;
      });
    }

    return leaves.map((leave) => leave.toJSON() as unknown as LeaveResponse);
  }

  static async getBalance(
    employeeId: string,
    year: number,
    context?: EstablishmentServiceContext
  ): Promise<LeaveBalance> {
    await connectDB();

    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Validate access if context is provided
    if (context && !context.canAccessAll()) {
      const hasAccess = await context.validateAccess(
        { establishmentId: employee.employmentInfo.establishmentId.toString() },
        'leave'
      );
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'leave',
          resourceId: 'balance',
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
        });
      }
    }

    const leaves = await LeaveModel.findByEmployee(employeeId, year);

    const annualTotal = 22;
    const annualUsed = leaves
      .filter((l) => l.type === 'annual' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);

    const sickUsed = leaves
      .filter((l) => l.type === 'sick' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);

    const unpaidUsed = leaves
      .filter((l) => l.type === 'unpaid' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);

    return {
      employeeId,
      year,
      annual: {
        total: annualTotal,
        used: annualUsed,
        remaining: annualTotal - annualUsed,
      },
      sick: {
        used: sickUsed,
      },
      unpaid: {
        used: unpaidUsed,
      },
    };
  }

  static async getSummary(
    filters: LeaveFilterOptions = {},
    context?: EstablishmentServiceContext
  ): Promise<LeaveSummary> {
    await connectDB();

    const query: any = {};

    // Apply establishment filter if context is provided
    let establishmentIdToFilter: string | undefined;
    if (context) {
      const baseFilter = context.applyFilter({});
      if (baseFilter.establishmentId) {
        establishmentIdToFilter = baseFilter.establishmentId.toString();
      }
    }

    // If establishment filter is provided (either from context or filters), use it
    if (establishmentIdToFilter || filters.establishmentId) {
      const targetEstablishmentId = establishmentIdToFilter || filters.establishmentId;
      const employees = await EmployeeModel.find({
        'employmentInfo.establishmentId': toObjectId(targetEstablishmentId!),
      });
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
    }

    if (filters.employeeId) {
      // If specific employee is requested, validate access
      if (context && !context.canAccessAll()) {
        const employee = await EmployeeModel.findById(filters.employeeId);
        if (employee) {
          const hasAccess = await context.validateAccess(
            { establishmentId: employee.employmentInfo.establishmentId.toString() },
            'leave'
          );
          if (!hasAccess) {
            throw new EstablishmentAccessDeniedError({
              userId: context.getUserId(),
              resourceType: 'leave',
              resourceId: 'summary',
              userEstablishmentId: context.getEstablishmentId(),
              resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
            });
          }
        }
      }
      query.employeeId = toObjectId(filters.employeeId);
    }

    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) {
        query.startDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startDate.$lte = filters.endDate;
      }
    }

    const leaves = await LeaveModel.find(query);

    const totalRequests = leaves.length;
    const pending = leaves.filter((l) => l.status === 'pending').length;
    const approved = leaves.filter((l) => l.status === 'approved').length;
    const rejected = leaves.filter((l) => l.status === 'rejected').length;
    const totalDays = leaves
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0);

    return {
      totalRequests,
      pending,
      approved,
      rejected,
      totalDays,
    };
  }
}

export default LeaveService;
