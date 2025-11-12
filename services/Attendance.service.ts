import { AttendanceModel } from '@/models/Attendance.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateAttendanceInput,
  AttendanceResponse,
  AttendanceFilterOptions,
  AttendanceSummary,
} from '@/types/attendance.types';

export class AttendanceService {
  static async create(data: CreateAttendanceInput): Promise<AttendanceResponse> {
    await connectDB();

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

  static async getById(id: string): Promise<AttendanceResponse | null> {
    await connectDB();

    const attendance = await AttendanceModel.findById(id).populate(
      'employeeId',
      'personalInfo employmentInfo'
    );

    if (!attendance) {
      return null;
    }

    return attendance.toJSON() as unknown as AttendanceResponse;
  }

  static async getAll(
    filters: AttendanceFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<AttendanceResponse>> {
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

  static async update(id: string, data: Partial<CreateAttendanceInput>): Promise<AttendanceResponse | null> {
    await connectDB();

    const attendance = await AttendanceModel.findByIdAndUpdate(id, data, { new: true });

    if (!attendance) {
      return null;
    }

    return attendance.toJSON() as unknown as AttendanceResponse;
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const result = await AttendanceModel.findByIdAndDelete(id);

    return !!result;
  }

  static async getByEmployee(
    employeeId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttendanceResponse[]> {
    await connectDB();

    const attendances = await AttendanceModel.findByEmployee(employeeId, startDate, endDate);

    return attendances.map((attendance) => attendance.toJSON() as unknown as AttendanceResponse);
  }

  static async getByDate(date: Date): Promise<AttendanceResponse[]> {
    await connectDB();

    const attendances = await AttendanceModel.findByDate(date);

    return attendances.map((attendance) => attendance.toJSON() as unknown as AttendanceResponse);
  }

  static async getSummary(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceSummary> {
    await connectDB();

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

  static async checkIn(employeeId: string, checkInTime?: Date): Promise<AttendanceResponse> {
    await connectDB();

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

  static async checkOut(employeeId: string, checkOutTime?: Date): Promise<AttendanceResponse | null> {
    await connectDB();

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
