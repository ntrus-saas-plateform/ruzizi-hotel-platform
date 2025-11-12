import { PayrollModel } from '@/models/Payroll.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreatePayrollInput,
  PayrollResponse,
  PayrollFilterOptions,
  PayrollSummary,
} from '@/types/payroll.types';

export class PayrollService {
  static async create(data: CreatePayrollInput): Promise<PayrollResponse> {
    await connectDB();

    const existingPayroll = await PayrollModel.findOne({
      employeeId: toObjectId(data.employeeId),
      'period.year': data.period.year,
      'period.month': data.period.month,
    });

    if (existingPayroll) {
      throw new Error('Payroll record already exists for this period');
    }

    const payroll = await PayrollModel.create({
      ...data,
      employeeId: toObjectId(data.employeeId),
      allowances: data.allowances || [],
      deductions: data.deductions || [],
      bonuses: data.bonuses || [],
      overtimeHours: data.overtimeHours || 0,
      overtimeRate: data.overtimeRate || 0,
    });

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async getById(id: string): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findById(id).populate(
      'employeeId',
      'personalInfo employmentInfo'
    );

    if (!payroll) {
      return null;
    }

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async getAll(
    filters: PayrollFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<PayrollResponse>> {
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

    if (filters.year) {
      query['period.year'] = filters.year;
    }

    if (filters.month) {
      query['period.month'] = filters.month;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const result = await paginate(
      PayrollModel.find(query).populate('employeeId', 'personalInfo employmentInfo'),
      {
        page,
        limit,
        sort: { 'period.year': -1, 'period.month': -1 },
      }
    );

    return {
      data: result.data.map((payroll) => payroll.toJSON() as unknown as PayrollResponse),
      pagination: result.pagination,
    };
  }

  static async update(id: string, data: Partial<CreatePayrollInput>): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findByIdAndUpdate(id, data, { new: true });

    if (!payroll) {
      return null;
    }

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const result = await PayrollModel.findByIdAndDelete(id);

    return !!result;
  }

  static async getByEmployee(
    employeeId: string,
    year?: number,
    month?: number
  ): Promise<PayrollResponse[]> {
    await connectDB();

    const payrolls = await PayrollModel.findByEmployee(employeeId, year, month);

    return payrolls.map((payroll) => payroll.toJSON() as unknown as PayrollResponse);
  }

  static async getByPeriod(year: number, month: number): Promise<PayrollResponse[]> {
    await connectDB();

    const payrolls = await PayrollModel.findByPeriod(year, month);

    return payrolls.map((payroll) => payroll.toJSON() as unknown as PayrollResponse);
  }

  static async getSummary(year: number, month: number): Promise<PayrollSummary> {
    await connectDB();

    const payrolls = await PayrollModel.findByPeriod(year, month);

    const totalEmployees = payrolls.length;
    const totalGross = payrolls.reduce((sum, p) => sum + p.totalGross, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const averageSalary = totalEmployees > 0 ? totalNet / totalEmployees : 0;

    return {
      totalEmployees,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      averageSalary: Math.round(averageSalary * 100) / 100,
    };
  }

  static async approve(id: string): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!payroll) {
      return null;
    }

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async markAsPaid(id: string): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findByIdAndUpdate(
      id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );

    if (!payroll) {
      return null;
    }

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async generateForAllEmployees(
    year: number,
    month: number,
    establishmentId?: string
  ): Promise<PayrollResponse[]> {
    await connectDB();

    const query: any = { 'employmentInfo.status': 'active' };
    if (establishmentId) {
      query['employmentInfo.establishmentId'] = toObjectId(establishmentId);
    }

    const employees = await EmployeeModel.find(query);

    const payrolls: PayrollResponse[] = [];

    for (const employee of employees) {
      const existingPayroll = await PayrollModel.findOne({
        employeeId: employee._id,
        'period.year': year,
        'period.month': month,
      });

      if (!existingPayroll) {
        const payroll = await PayrollModel.create({
          employeeId: employee._id,
          period: { year, month },
          baseSalary: employee.employmentInfo.salary,
          allowances: [],
          deductions: [],
          bonuses: [],
          overtimeHours: 0,
          overtimeRate: 0,
        });

        payrolls.push(payroll.toJSON() as unknown as PayrollResponse);
      }
    }

    return payrolls;
  }
}

export default PayrollService;
