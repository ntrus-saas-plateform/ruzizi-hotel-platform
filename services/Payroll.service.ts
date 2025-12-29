import { PayrollModel } from '@/models/Payroll.model';
import { EmployeeModel } from '@/models/Employee.model';
import { AttendanceModel } from '@/models/Attendance.model';
import { NotificationService } from '@/services/Notification.service';
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

    // Get employee to check benefits for automatic deductions
    const employeeForBenefits = await EmployeeModel.findById(data.employeeId);
    if (!employeeForBenefits) {
      throw new Error('Employee not found');
    }

    // Calculate overtime if not provided
    let overtimeHours = data.overtimeHours || 0;
    let overtimeRate = data.overtimeRate || 0;

    if (overtimeHours === 0) {
      // Calculate overtime hours from attendance for the period
      const startDate = new Date(data.period.year, data.period.month - 1, 1);
      const endDate = new Date(data.period.year, data.period.month, 0);

      const attendances = await AttendanceModel.findByEmployee(
        data.employeeId,
        startDate,
        endDate
      );

      const standardHoursPerDay = 8;
      attendances.forEach((attendance) => {
        if (attendance.totalHours > standardHoursPerDay) {
          overtimeHours += attendance.totalHours - standardHoursPerDay;
        }
      });

      // Calculate overtime rate if not provided
      if (overtimeRate === 0) {
        const monthlyWorkingDays = 22;
        const hourlyRate = data.baseSalary / (monthlyWorkingDays * standardHoursPerDay);
        overtimeRate = hourlyRate * 1.5;
      }
    }

    // Calculate totals
    const baseSalary = data.baseSalary;
    const allowances = data.allowances || [];
    const bonuses = data.bonuses || [];

    // Start with provided deductions
    const deductions = [...(data.deductions || [])];

    // Add automatic deductions based on employee benefits
    if (employeeForBenefits.employmentInfo.benefits.healthInsurance) {
      deductions.push({
        type: 'Assurance santé',
        amount: Math.round(baseSalary * 0.05 * 100) / 100, // 5% of base salary
      });
    }
    if (employeeForBenefits.employmentInfo.benefits.retirementPlan) {
      deductions.push({
        type: 'Plan de retraite',
        amount: Math.round(baseSalary * 0.10 * 100) / 100, // 10% of base salary
      });
    }
    // Social security deduction (assume 8%)
    deductions.push({
      type: 'Sécurité sociale',
      amount: Math.round(baseSalary * 0.08 * 100) / 100,
    });

    let totalGross = baseSalary;
    allowances.forEach((allowance) => {
      totalGross += allowance.amount;
    });
    bonuses.forEach((bonus) => {
      totalGross += bonus.amount;
    });
    totalGross += overtimeHours * overtimeRate;

    // Tax calculation based on gross salary
    let taxAmount = 0;
    if (totalGross > 5000) {
      taxAmount = Math.round((totalGross - 5000) * 0.25 * 100) / 100; // 25% on amount above 5000
    } else if (totalGross > 2000) {
      taxAmount = Math.round((totalGross - 2000) * 0.15 * 100) / 100; // 15% on amount above 2000
    } else if (totalGross > 1000) {
      taxAmount = Math.round((totalGross - 1000) * 0.10 * 100) / 100; // 10% on amount above 1000
    }

    if (taxAmount > 0) {
      deductions.push({
        type: 'Impôt sur le revenu',
        amount: taxAmount,
      });
    }

    let totalDeductions = 0;
    deductions.forEach((deduction) => {
      totalDeductions += deduction.amount;
    });

    const netSalary = Math.max(0, totalGross - totalDeductions);

    const payroll = await PayrollModel.create({
      ...data,
      employeeId: toObjectId(data.employeeId),
      allowances,
      deductions,
      bonuses,
      overtimeHours,
      overtimeRate,
      totalGross,
      totalDeductions,
      netSalary,
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

  static async approvePeriod(
    year: number,
    month: number,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse[]> {
    await connectDB();

    const baseQuery: any = {
      'period.year': year,
      'period.month': month,
      status: 'pending',
    };

    // Filtre par établissement si nécessaire
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      if (userEstablishmentId) {
        const employees = await EmployeeModel.find({
          'employmentInfo.establishmentId': toObjectId(userEstablishmentId),
        }).select('_id');

        const employeeIds = employees.map((e) => e._id);
        baseQuery.employeeId = { $in: employeeIds };
      }
    }

    const updated = await PayrollModel.updateMany(baseQuery, {
      $set: { status: 'approved' },
    });

    if (updated.modifiedCount === 0) {
      return [];
    }

    const payrolls = await PayrollModel.find({
      'period.year': year,
      'period.month': month,
      status: 'approved',
    }).populate('employeeId', 'personalInfo employmentInfo');

    return payrolls.map((p) => p.toJSON() as unknown as PayrollResponse);
  }

  static async markPeriodAsPaid(
    year: number,
    month: number,
    context?: EstablishmentServiceContext
  ): Promise<PayrollResponse[]> {
    await connectDB();

    const baseQuery: any = {
      'period.year': year,
      'period.month': month,
      status: 'approved',
    };

    // Filtre par établissement si nécessaire
    if (context && !context.canAccessAll()) {
      const userEstablishmentId = context.getEstablishmentId();
      if (userEstablishmentId) {
        const employees = await EmployeeModel.find({
          'employmentInfo.establishmentId': toObjectId(userEstablishmentId),
        }).select('_id');

        const employeeIds = employees.map((e) => e._id);
        baseQuery.employeeId = { $in: employeeIds };
      }
    }

    const updated = await PayrollModel.updateMany(baseQuery, {
      $set: { status: 'paid', paidAt: new Date() },
    });

    if (updated.modifiedCount === 0) {
      return [];
    }

    const payrolls = await PayrollModel.find({
      'period.year': year,
      'period.month': month,
      status: 'paid',
    }).populate('employeeId', 'personalInfo employmentInfo userId');

    // Send notifications to employees
    for (const payroll of payrolls) {
      const employee = payroll.employeeId as any;
      if (employee?.userId) {
        try {
          await NotificationService.notifyPayrollPaid(
            employee.userId.toString(),
            payroll._id.toString() ,
            payroll.netSalary
          );
        } catch (error) {
          console.error('Failed to send payroll paid notification:', error);
        }
      }
    }

    return payrolls.map((p) => p.toJSON() as unknown as PayrollResponse);
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

    // Send notification to employee
    const employee = await EmployeeModel.findById(updatedPayroll.employeeId);
    if (employee?.userId) {
      try {
        await NotificationService.notifyPayrollPaid(
          employee.userId.toString(),
          id,
          updatedPayroll.netSalary
        );
      } catch (error) {
        console.error('Failed to send payroll paid notification:', error);
      }
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

    // Check if payroll already exists for this period
    const existingPayrollsCount = await PayrollModel.countDocuments({
      'period.year': year,
      'period.month': month,
    });

    if (existingPayrollsCount > 0) {
      throw new Error(`Payroll already generated for period ${month}/${year}. Use update or delete existing records first.`);
    }

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

    if (employees.length === 0) {
      throw new Error('No active employees found for payroll generation.');
    }

    const payrolls: PayrollResponse[] = [];

    for (const employee of employees) {
        // Calculate overtime hours from attendance
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        const attendances = await AttendanceModel.findByEmployee(
          (employee._id as any).toString(),
          startDate,
          endDate
        );

        let overtimeHours = 0;
        const standardHoursPerDay = 8;

        attendances.forEach((attendance) => {
          if (attendance.totalHours > standardHoursPerDay) {
            overtimeHours += attendance.totalHours - standardHoursPerDay;
          }
        });

        // Calculate overtime rate (1.5x base hourly rate)
        const monthlyWorkingDays = 22; // Assume 22 working days per month
        const hourlyRate = employee.employmentInfo.salary / (monthlyWorkingDays * standardHoursPerDay);
        const overtimeRate = hourlyRate * 1.5;

        // Calculate totals
        const baseSalary = employee.employmentInfo.salary;
        const allowances: { type: string; amount: number }[] = [];
        const bonuses: { type: string; amount: number }[] = [];

        // Add position-based allowances
        const position = employee.employmentInfo.position.toLowerCase();
        if (position.includes('manager') || position.includes('directeur')) {
          allowances.push({
            type: 'Prime de responsabilité',
            amount: Math.round(baseSalary * 0.15 * 100) / 100, // 15% of base salary
          });
        } else if (position.includes('chef') || position.includes('supervisor')) {
          allowances.push({
            type: 'Prime de supervision',
            amount: Math.round(baseSalary * 0.10 * 100) / 100, // 10% of base salary
          });
        } else if (position.includes('technicien') || position.includes('specialist')) {
          allowances.push({
            type: 'Prime technique',
            amount: Math.round(baseSalary * 0.05 * 100) / 100, // 5% of base salary
          });
        }

        // Automatic deductions based on benefits
        const deductions: { type: string; amount: number }[] = [];
        if (employee.employmentInfo.benefits.healthInsurance) {
          deductions.push({
            type: 'Assurance santé',
            amount: Math.round(baseSalary * 0.05 * 100) / 100, // 5% of base salary
          });
        }
        if (employee.employmentInfo.benefits.retirementPlan) {
          deductions.push({
            type: 'Plan de retraite',
            amount: Math.round(baseSalary * 0.10 * 100) / 100, // 10% of base salary
          });
        }
        // Social security deduction (assume 8%)
        deductions.push({
          type: 'Sécurité sociale',
          amount: Math.round(baseSalary * 0.08 * 100) / 100,
        });

        let totalGross = baseSalary;
        allowances.forEach((allowance) => {
          totalGross += allowance.amount;
        });
        bonuses.forEach((bonus) => {
          totalGross += bonus.amount;
        });
        totalGross += overtimeHours * overtimeRate;

        let totalDeductions = 0;
        deductions.forEach((deduction) => {
          totalDeductions += deduction.amount;
        });

        const netSalary = Math.max(0, totalGross - totalDeductions);

        const payroll = await PayrollModel.create({
          employeeId: employee._id,
          period: { year, month },
          baseSalary,
          allowances,
          deductions,
          bonuses,
          overtimeHours,
          overtimeRate,
          totalGross,
          totalDeductions,
          netSalary,
          status: 'pending', // paie générée en attente de confirmation RH
        });

        payrolls.push(payroll.toJSON() as unknown as PayrollResponse);

        // Send notification to employee
        if (employee.userId) {
          try {
            await NotificationService.notifyPayrollGenerated(
              employee.userId.toString(),
              payroll._id.toString(),
              month,
              year
            );
          } catch (error) {
            console.error('Failed to send payroll notification:', error);
          }
        }
    }

    return payrolls;
  }
}

export default PayrollService;
