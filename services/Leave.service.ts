import { LeaveModel } from '@/models/Leave.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateLeaveInput,
  LeaveResponse,
  LeaveFilterOptions,
  LeaveBalance,
  LeaveSummary,
} from '@/types/leave.types';

export class LeaveService {
  static async create(data: CreateLeaveInput): Promise<LeaveResponse> {
    await connectDB();

    const employee = await EmployeeModel.findById(data.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const days = LeaveModel.calculateDays(data.startDate, data.endDate);

    if (data.type === 'annual') {
      const balance = await this.getBalance(data.employeeId, new Date().getFullYear());
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

  static async getById(id: string): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findById(id)
      .populate('employeeId', 'personalInfo employmentInfo')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return null;
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async getAll(
    filters: LeaveFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<LeaveResponse>> {
    await connectDB();

    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = toObjectId(filters.employeeId);
    }

    if (filters.establishmentId) {
      const employees = await EmployeeModel.find({
        'employmentInfo.establishmentId': toObjectId(filters.establishmentId),
      });
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
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

  static async update(id: string, data: Partial<CreateLeaveInput>): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findByIdAndUpdate(id, data, { new: true });

    if (!leave) {
      return null;
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const result = await LeaveModel.findByIdAndDelete(id);

    return !!result;
  }

  static async approve(id: string, approvedBy: string): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: toObjectId(approvedBy),
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!leave) {
      return null;
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async reject(
    id: string,
    approvedBy: string,
    reason: string
  ): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy: toObjectId(approvedBy),
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!leave) {
      return null;
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async cancel(id: string): Promise<LeaveResponse | null> {
    await connectDB();

    const leave = await LeaveModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!leave) {
      return null;
    }

    return leave.toJSON() as unknown as LeaveResponse;
  }

  static async getByEmployee(employeeId: string, year?: number): Promise<LeaveResponse[]> {
    await connectDB();

    const leaves = await LeaveModel.findByEmployee(employeeId, year);

    return leaves.map((leave) => leave.toJSON() as unknown as LeaveResponse);
  }

  static async getPending(): Promise<LeaveResponse[]> {
    await connectDB();

    const leaves = await LeaveModel.findPending();

    return leaves.map((leave) => leave.toJSON() as unknown as LeaveResponse);
  }

  static async getBalance(employeeId: string, year: number): Promise<LeaveBalance> {
    await connectDB();

    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
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

  static async getSummary(filters: LeaveFilterOptions = {}): Promise<LeaveSummary> {
    await connectDB();

    const query: any = {};

    if (filters.employeeId) {
      query.employeeId = toObjectId(filters.employeeId);
    }

    if (filters.establishmentId) {
      const employees = await EmployeeModel.find({
        'employmentInfo.establishmentId': toObjectId(filters.establishmentId),
      });
      const employeeIds = employees.map((emp) => emp._id);
      query.employeeId = { $in: employeeIds };
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
