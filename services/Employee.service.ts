import { EmployeeModel } from '@/models/Employee.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeResponse,
  EmployeeFilterOptions,
} from '@/types/employee.types';

export class EmployeeService {
  static async create(data: CreateEmployeeInput): Promise<EmployeeResponse> {
    await connectDB();

    const employee = await EmployeeModel.create({
      personalInfo: data.personalInfo,
      employmentInfo: {
        ...data.employmentInfo,
        establishmentId: toObjectId(data.employmentInfo.establishmentId),
      },
      documents: data.documents || [],
      userId: data.userId ? toObjectId(data.userId) : undefined,
    });

    return employee.toJSON() as unknown as EmployeeResponse;
  }

  static async getById(id: string): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findById(id)
      .populate('employmentInfo.establishmentId', 'name')
      .populate('userId', 'name email');

    if (!employee) {
      return null;
    }

    return employee.toJSON() as unknown as EmployeeResponse;
  }

  static async getAll(
    filters: EmployeeFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<EmployeeResponse>> {
    await connectDB();

    const query: any = {};

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

  static async update(id: string, data: UpdateEmployeeInput): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return null;
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

  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const result = await EmployeeModel.findByIdAndDelete(id);

    return !!result;
  }

  static async getByEstablishment(establishmentId: string): Promise<EmployeeResponse[]> {
    await connectDB();

    const employees = await EmployeeModel.findByEstablishment(establishmentId);

    return employees.map((employee) => employee.toJSON() as unknown as EmployeeResponse);
  }

  static async getByEmployeeNumber(employeeNumber: string): Promise<EmployeeResponse | null> {
    await connectDB();

    const employee = await EmployeeModel.findByEmployeeNumber(employeeNumber);

    if (!employee) {
      return null;
    }

    return employee.toJSON() as unknown as EmployeeResponse;
  }
}

export default EmployeeService;
