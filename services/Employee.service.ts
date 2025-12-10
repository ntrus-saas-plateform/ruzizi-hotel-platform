import { EmployeeModel } from '@/models/Employee.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  EstablishmentNotFoundError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeResponse,
  EmployeeFilterOptions,
} from '@/types/employee.types';

export class EmployeeService {
  static async create(
    data: CreateEmployeeInput,
    context: EstablishmentServiceContext
  ): Promise<EmployeeResponse> {
    await connectDB();

    // For non-admin users, enforce their establishment
    const establishmentId = context.canAccessAll()
      ? data.employmentInfo.establishmentId
      : context.getEstablishmentId()!;

    // Validate establishment exists
    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      throw new EstablishmentNotFoundError(establishmentId);
    }

    const employee = await EmployeeModel.create({
      personalInfo: data.personalInfo,
      employmentInfo: {
        ...data.employmentInfo,
        establishmentId: toObjectId(establishmentId),
      },
      documents: data.documents || [],
      userId: data.userId ? toObjectId(data.userId) : undefined,
    });

    return employee.toJSON() as unknown as EmployeeResponse;
  }

  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findById(id)
      .populate('employmentInfo.establishmentId', 'name')
      .populate('userId', 'name email');

    if (!employee) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: employee.employmentInfo.establishmentId.toString() },
        'employee'
      );
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'employee',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
        });
      }
    }

    return employee.toJSON() as unknown as EmployeeResponse;
  }

  static async getAll(
    filters: EmployeeFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<EmployeeResponse>> {
    await connectDB();

    let query: any = {};

    if (filters.establishmentId) {
      query['employmentInfo.establishmentId'] = toObjectId(filters.establishmentId);
    }

    if (filters.status) {
      query['employmentInfo.status'] = filters.status;
    }

    if (filters.department) {
      query['employmentInfo.department'] = filters.department;
    }

    if (filters.search) {
      query.$or = [
        { 'personalInfo.firstName': new RegExp(filters.search, 'i') },
        { 'personalInfo.lastName': new RegExp(filters.search, 'i') },
        { 'personalInfo.email': new RegExp(filters.search, 'i') },
        { 'employmentInfo.employeeNumber': new RegExp(filters.search, 'i') },
      ];
    }

    // Apply establishment filter if context is provided
    if (context) {
      // For employees, the establishmentId is nested in employmentInfo
      const baseFilter = context.applyFilter({});
      if (baseFilter.establishmentId) {
        query['employmentInfo.establishmentId'] = baseFilter.establishmentId;
      }
    }

    const result = await paginate(EmployeeModel.find(query), {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: result.data.map((employee) => employee.toJSON() as unknown as EmployeeResponse),
      pagination: result.pagination,
    };
  }

  static async update(
    id: string,
    data: UpdateEmployeeInput,
    context?: EstablishmentServiceContext
  ): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: employee.employmentInfo.establishmentId.toString() },
        'employee'
      );
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'employee',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
        });
      }
    }

    if (data.personalInfo) {
      Object.assign(employee.personalInfo, data.personalInfo);
    }

    if (data.employmentInfo) {
      Object.assign(employee.employmentInfo, data.employmentInfo);
    }

    if (data.documents) {
      employee.documents = data.documents;
    }

    await employee.save();

    return employee.toJSON() as unknown as EmployeeResponse;
  }

  static async delete(id: string, context?: EstablishmentServiceContext): Promise<boolean> {
    await connectDB();

    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: employee.employmentInfo.establishmentId.toString() },
        'employee'
      );
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'employee',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
        });
      }
    }

    await EmployeeModel.findByIdAndDelete(id);

    return true;
  }

  static async getByEstablishment(
    establishmentId: string,
    context?: EstablishmentServiceContext
  ): Promise<EmployeeResponse[]> {
    await connectDB();

    // If context is provided and user is not admin, validate they can access this establishment
    if (context && !context.canAccessAll()) {
      if (context.getEstablishmentId() !== establishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'employee',
          resourceId: 'list',
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: establishmentId,
        });
      }
    }

    const employees = await EmployeeModel.findByEstablishment(establishmentId);

    return employees.map((employee) => employee.toJSON() as unknown as EmployeeResponse);
  }

  static async getByEmployeeNumber(
    employeeNumber: string,
    context?: EstablishmentServiceContext
  ): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findByEmployeeNumber(employeeNumber);

    if (!employee) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(
        { establishmentId: employee.employmentInfo.establishmentId.toString() },
        'employee'
      );
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'employee',
          resourceId: (employee as any)._id.toString(),
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: employee.employmentInfo.establishmentId.toString(),
        });
      }
    }

    return employee.toJSON() as unknown as EmployeeResponse;
  }
}

export default EmployeeService;
