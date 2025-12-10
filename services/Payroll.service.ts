import { PayrollModel } from '@/models/Payroll.model';
import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  CrossEstablishmentRelationshipError,
} from '@/lib/errors/establishment-errors';
import type {
  CreatePayrollInput,
  PayrollResponse,
  PayrollFilterOptions,
  PayrollSummary,
} from '@/types/payroll.types';

export class PayrollService {
  static async create(
    data: CreatePayrollInput,
    context: EstablishmentServiceContext
  ): Promise<PayrollResponse> {
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
          childResource: { type: 'payroll', id: 'new', establishmentId: userEstablishmentId! },
        });
      }
    }

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

  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findById(id).populate(
      'employeeId',
      'personalInfo employmentInfo'
    );

    if (!payroll) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(payroll.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    return payroll.toJSON() as unknown as PayrollResponse;
  }

  static async getAll(
    filters: PayrollFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<PayrollResponse>> {
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
            'payroll'
          );
          if (!hasAccess) {
            throw new EstablishmentAccessDeniedError({
              userId: context.getUserId(),
              resourceType: 'payroll',
              resourceId: 'list',
              userEstablishmentId: context.getEstablishmentId(),
              resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
            });
          }
        }
      }
      query.employeeId = toObjectId(filters.employeeId);
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

  static async update(
    id: string,
    data: Partial<CreatePayrollInput>,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findById(id);

    if (!payroll) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(payroll.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    // If employeeId is being changed, validate the new employee
    if (data.employeeId && data.employeeId !== payroll.employeeId.toString()) {
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
            childResource: { type: 'payroll', id: id, establishmentId: userEstablishmentId! },
          });
        }
      }
    }

    const updatedPayroll = await PayrollModel.findByIdAndUpdate(id, data, { new: true });

    if (!updatedPayroll) {
      return null;
    }

    return updatedPayroll.toJSON() as unknown as PayrollResponse;
  }

  static async delete(id: string, context?: EstablishmentServiceContext): Promise<boolean> {
    await connectDB();

    const payroll = await PayrollModel.findById(id);

    if (!payroll) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(payroll.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    await PayrollModel.findByIdAndDelete(id);

    return true;
  }

  static async getByEmployee(
    employeeId: string,
    year?: number,
    month?: number,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse[]> {
    await connectDB();

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: 'list',
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const payrolls = await PayrollModel.findByEmployee(employeeId, year, month);

    return payrolls.map((payroll) => payroll.toJSON() as unknown as PayrollResponse);
  }

  static async getByPeriod(
    year: number,
    month: number,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse[]> {
    await connectDB();

    let payrolls = await PayrollModel.findByPeriod(year, month);

    // Apply establishment filter if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      payrolls = payrolls.filter((payroll: any) => {
        const employee = payroll.employeeId;
        return employee && employee.employmentInfo.establishmentId.toString() === userEstablishmentId;
      });
    }

    return payrolls.map((payroll) => payroll.toJSON() as unknown as PayrollResponse);
  }

  static async getSummary(
    year: number,
    month: number,
    context?: EstablishmentServiceContext
  ): Promise<PayrollSummary> {
    await connectDB();

    let payrolls = await PayrollModel.findByPeriod(year, month);

    // Apply establishment filter if context is provided
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      payrolls = payrolls.filter((payroll: any) => {
        const employee = payroll.employeeId;
        return employee && employee.employmentInfo.establishmentId.toString() === userEstablishmentId;
      });
    }

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

  static async approve(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findById(id);

    if (!payroll) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(payroll.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!updatedPayroll) {
      return null;
    }

    return updatedPayroll.toJSON() as unknown as PayrollResponse;
  }

  static async markAsPaid(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse | null> {
    await connectDB();

    const payroll = await PayrollModel.findById(id);

    if (!payroll) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const employee = await EmployeeModel.findById(payroll.employeeId);
      if (employee) {
        const hasAccess = await context.validateAccess(
          { establishmentId: employee.employmentInfo.establishmentId.toString() },
          'payroll'
        );
        if (!hasAccess) {
          throw new EstablishmentAccessDeniedError({
            userId: context.getUserId(),
            resourceType: 'payroll',
            resourceId: id,
            userEstablishmentId: context.getEstablishmentId(),
            resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
          });
        }
      }
    }

    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );

    if (!updatedPayroll) {
      return null;
    }

    return updatedPayroll.toJSON() as unknown as PayrollResponse;
  }

  static async generateForAllEmployees(
    year: number,
    month: number,
    establishmentId?: string,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse[]> {
    await connectDB();

    const query: any = { 'employmentInfo.status': 'active' };
    
    // Apply establishment filter from context or parameter
    let targetEstablishmentId = establishmentId;
    if (context && !context.canAccessAll()) {
      targetEstablishmentId = context.getEstablishmentId();
    }

    if (targetEstablishmentId) {
      query['employmentInfo.establishmentId'] = toObjectId(targetEstablishmentId);
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
