import { AttendanceModel } from '@/models/Attendance.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  CrossEstablishmentRelationshipError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateAttendanceInput,
  AttendanceResponse,
  AttendanceFilterOptions,
  AttendanceSummary,
} from '@/types/attendance.types';

export class AttendanceService {
  static async create(
    data: CreateAttendanceInput,
    context: EstablishmentServiceContext
  ): Promise<AttendanceResponse> {
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
          childResource: { type: 'attendance', id: 'new', establishmentId: userEstablishmentId! },
        });
      }
    }

    const existingAttendance = await AttendanceModel.findOne({
      employeeId: toObjectId(data.employeeId),
      date: data.date,
    });

    if (existingAttendance) {
      throw new Error('Attendance record already exists for this date');
    }

    const attendance = await AttendanceModel.create({
      ...data,
      employeeId: toObjectId(data.employeeId),
    });

    return attendance.toJSON() as unknown as AttendanceResponse;
  }

  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse | null> {
    await connectDB();

    const attendance = await AttendanceModel.findById(id).populate(
      'employeeId',
      'personalInfo employmentInfo'
    );

    if (!attendance) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(attendance.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'attendance'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'attendance',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    return attendance.toJSON() as unknown as AttendanceResponse;
  }

  static async getAll(
    filters: AttendanceFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<AttendanceResponse>> {
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
            'attendance'
          );
          if (!hasAccess) {
            throw new EstablishmentAccessDeniedError({
              userId: context.getUserId(),
              resourceType: 'attendance',
              resourceId: 'list',
              userEstablishmentId: context.getEstablishmentId(),
              resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
            });
          }
        }
      }
      query.employeeId = toObjectId(filters.employeeId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.date.$lte = filters.dateTo;
      }
    }

    const result = await paginate(
      AttendanceModel.find(query).populate('employeeId', 'personalInfo employmentInfo'),
      {
        page,
        limit,
        sort: { date: -1 },
      }
    );

    return {
      data: result.data.map((attendance) => attendance.toJSON() as unknown as AttendanceResponse),
      pagination: result.pagination,
    };
  }

  static async update(
    id: string,
    data: Partial<CreateAttendanceInput>,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse | null> {
    await connectDB();

    const attendance = await AttendanceModel.findById(id);

    if (!attendance) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(attendance.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'attendance'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'attendance',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    // If employeeId is being changed, validate the new employee
    if (data.employeeId && data.employeeId !== attendance.employeeId.toString()) {
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
            childResource: { type: 'attendance', id: id, establishmentId: userEstablishmentId! },
          });
        }
      }
    }

    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(id, data, { new: true });

    if (!updatedAttendance) {
      return null;
    }

    return updatedAttendance.toJSON() as unknown as AttendanceResponse;
  }

  static async delete(id: string, context?: EstablishmentServiceContext): Promise<boolean> {
    await connectDB();

    const attendance = await AttendanceModel.findById(id);

    if (!attendance) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(attendance.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'attendance'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'attendance',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    await AttendanceModel.findByIdAndDelete(id);

    return true;
  }

  static async getByEmployee(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse[]> {
    await connectDB();

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'attendance'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'attendance',
            resourceId: 'list',
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const attendances = await AttendanceModel.findByEmployee(employeeId, startDate, endDate);

    return attendances.map((attendance) => attendance.toJSON() as unknown as AttendanceResponse);
  }

  static async getByDate(
    date: Date,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse[]> {
    await connectDB();

    let attendances = await AttendanceModel.findByDate(date);

    // Apply establishment filter if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      attendances = attendances.filter((attendance: any) => {
        const employee = attendance.employeeId;
        return employee && employee.employmentInfo.establishmentId.toString() === userEstablishmentId;
      });
    }

    return attendances.map((attendance) => attendance.toJSON() as unknown as AttendanceResponse);
  }

  static async getSummary(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceSummary> {
    await connectDB();

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'attendance'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'attendance',
            resourceId: 'summary',
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const attendances = await AttendanceModel.findByEmployee(employeeId, startDate, endDate);

    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'present').length;
    const absentDays = attendances.filter((a) => a.status === 'absent').length;
    const lateDays = attendances.filter((a) => a.status === 'late').length;
    const totalHours = attendances.reduce((sum, a) => sum + a.totalHours, 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      totalHours,
      averageHours: Math.round(averageHours * 100) / 100,
    };
  }

  static async checkIn(
    employeeId: string,
    checkInTime?: Date,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse> {
    await connectDB();

    // Validate employee exists and access
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Validate access if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      const employeeEstablishmentId = employee.employmentInfo.establishmentId.toString();
      if (employeeEstablishmentId !== userEstablishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'attendance',
          resourceId: 'checkIn',
          userEstablishmentId: userEstablishmentId,
          resourceEstablishmentId: employeeEstablishmentId,
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDateTime = checkInTime || new Date();

    let attendance = await AttendanceModel.findOne({
      employeeId: toObjectId(employeeId),
      date: today,
    });

    if (attendance) {
      attendance.checkIn = checkInDateTime;
      attendance.status = 'present';
      await attendance.save();
    } else {
      attendance = await AttendanceModel.create({
        employeeId: toObjectId(employeeId),
        date: today,
        checkIn: checkInDateTime,
        status: 'present',
      });
    }

    return attendance.toJSON() as unknown as AttendanceResponse;
  }

  static async checkOut(
    employeeId: string,
    checkOutTime?: Date,
    context?: EstablishmentServiceContext
  ): Promise<AttendanceResponse | null> {
    await connectDB();

    // Validate employee exists and access
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Validate access if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      const employeeEstablishmentId = employee.employmentInfo.establishmentId.toString();
      if (employeeEstablishmentId !== userEstablishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'attendance',
          resourceId: 'checkOut',
          userEstablishmentId: userEstablishmentId,
          resourceEstablishmentId: employeeEstablishmentId,
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkOutDateTime = checkOutTime || new Date();

    const attendance = await AttendanceModel.findOne({
      employeeId: toObjectId(employeeId),
      date: today,
    });

    if (!attendance) {
      throw new Error('No check-in record found for today');
    }

    attendance.checkOut = checkOutDateTime;
    await attendance.save();

    return attendance.toJSON() as unknown as AttendanceResponse;
  }
}

export default AttendanceService;
