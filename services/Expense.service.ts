import { PipelineStage } from 'mongoose';
import { ExpenseModel } from '@/models/Expense.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import { EstablishmentServiceContext } from '@/lib/services/establishment-context';
import {
  EstablishmentAccessDeniedError,
  EstablishmentNotFoundError,
} from '@/lib/errors/establishment-errors';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseResponse,
  ExpenseFilterOptions,
  ApproveExpenseInput,
  ExpenseStatistics,
  ExpenseCategory,
} from '@/types/expense.types';

/**
 * Expense Service
 * Handles all expense-related operations
 */
export class ExpenseService {
  /**
   * Create a new expense
   */
  static async create(
    data: CreateExpenseInput,
    context: EstablishmentServiceContext
  ): Promise<ExpenseResponse> {
    await connectDB();

    // For non-admin users, enforce their establishment
    const establishmentId = context.canAccessAll()
      ? data.establishmentId
      : context.getEstablishmentId()!;

    // Validate establishment exists
    const establishment = await EstablishmentModel.findById(establishmentId);
    if (!establishment) {
      throw new EstablishmentNotFoundError(establishmentId);
    }

    const expense = await ExpenseModel.create({
      ...data,
      establishmentId: toObjectId(establishmentId),
      createdBy: toObjectId(data.createdBy),
      status: 'pending',
    });

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Get expense by ID
   */
  static async getById(
    id: string,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id)
      .populate('establishment', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(expense, 'expense');
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: expense.establishmentId.toString(),
        });
      }
    }

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Get all expenses with filters and pagination
   */
  static async getAll(
    filters: ExpenseFilterOptions = {},
    page: number = 1,
    limit: number = 10,
    context?: EstablishmentServiceContext
  ): Promise<PaginationResult<ExpenseResponse>> {
    await connectDB();

    // Build query
    let query: any = {};

    if (filters.establishmentId) {
      query.establishmentId = toObjectId(filters.establishmentId);
    }

    if (filters.category) {
      query.category = filters.category;
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

    if (filters.search) {
      query.$or = [
        { description: new RegExp(filters.search, 'i') },
        { notes: new RegExp(filters.search, 'i') },
      ];
    }

    // Apply establishment filter if context is provided
    if (context) {
      query = context.applyFilter(query);
    }

    // Execute query with pagination
    const result = await paginate(ExpenseModel.find(query), {
      page,
      limit,
      sort: { date: -1 },
    });

    return {
      data: result.data.map((expense) => expense.toJSON() as unknown as ExpenseResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Update expense
   */
  static async update(
    id: string,
    data: UpdateExpenseInput,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(expense, 'expense');
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: expense.establishmentId.toString(),
        });
      }
    }

    // Only allow updates if expense is pending
    if (expense.status !== 'pending') {
      throw new Error('Cannot update approved or rejected expense');
    }

    // Update fields
    Object.assign(expense, data);

    await expense.save();

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Approve expense
   */
  static async approve(
    id: string,
    data: ApproveExpenseInput,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(expense, 'expense');
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: expense.establishmentId.toString(),
        });
      }
    }

    if (expense.status !== 'pending') {
      throw new Error('Expense is already approved or rejected');
    }

    expense.status = 'approved';
    expense.approvedBy = toObjectId(data.approvedBy);
    expense.approvedAt = new Date();

    await expense.save();

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Reject expense
   */
  static async reject(
    id: string,
    data: ApproveExpenseInput,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(expense, 'expense');
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: expense.establishmentId.toString(),
        });
      }
    }

    if (expense.status !== 'pending') {
      throw new Error('Expense is already approved or rejected');
    }

    expense.status = 'rejected';
    expense.approvedBy = toObjectId(data.approvedBy);
    expense.approvedAt = new Date();

    await expense.save();

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Delete expense
   */
  static async delete(id: string, context?: EstablishmentServiceContext): Promise<boolean> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return false;
    }

    // Validate access if context is provided
    if (context) {
      const hasAccess = await context.validateAccess(expense, 'expense');
      if (!hasAccess) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: id,
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: expense.establishmentId.toString(),
        });
      }
    }

    // Only allow deletion if expense is pending
    if (expense.status !== 'pending') {
      throw new Error('Cannot delete approved or rejected expense');
    }

    await ExpenseModel.findByIdAndDelete(id);

    return true;
  }

  /**
   * Get expenses by establishment
   */
  static async getByEstablishment(
    establishmentId: string,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse[]> {
    await connectDB();

    // If context is provided and user is not admin, validate they can access this establishment
    if (context && !context.canAccessAll()) {
      if (context.getEstablishmentId() !== establishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: 'list',
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: establishmentId,
        });
      }
    }

    const expenses = await ExpenseModel.findByEstablishment(establishmentId);

    return expenses.map((expense) => expense.toJSON() as unknown as ExpenseResponse);
  }

  /**
   * Get expenses by category
   */
  static async getByCategory(
    category: ExpenseCategory,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseResponse[]> {
    await connectDB();

    let expenses = await ExpenseModel.findByCategory(category);

    // Apply establishment filtering if context is provided
    if (context && !context.canAccessAll()) {
      const userEstId = context.getEstablishmentId();
      expenses = expenses.filter(
        (expense) => expense.establishmentId.toString() === userEstId
      );
    }

    return expenses.map((expense) => expense.toJSON() as unknown as ExpenseResponse);
  }

  /**
   * Get expense statistics
   */
  static async getStatistics(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
    context?: EstablishmentServiceContext
  ): Promise<ExpenseStatistics> {
    await connectDB();

    // If context is provided and user is not admin, validate they can access this establishment
    if (context && !context.canAccessAll()) {
      if (context.getEstablishmentId() !== establishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: 'statistics',
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: establishmentId,
        });
      }
    }

    const result = await ExpenseModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          date: { $gte: startDate, $lte: endDate },
          status: 'approved',
        },
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalExpenses: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
            {
              $project: {
                category: '$_id',
                count: 1,
                amount: 1,
                _id: 0,
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ] as PipelineStage[]);

    const data = result[0];

    const totalData = data.total[0] || { totalExpenses: 0, totalAmount: 0 };
    const byCategory = data.byCategory || [];
    const byStatusArray = data.byStatus || [];

    const byStatus = {
      pending: byStatusArray.find((s: any) => s._id === 'pending')?.count || 0,
      approved: byStatusArray.find((s: any) => s._id === 'approved')?.count || 0,
      rejected: byStatusArray.find((s: any) => s._id === 'rejected')?.count || 0,
    };

    return {
      totalExpenses: totalData.totalExpenses,
      totalAmount: totalData.totalAmount,
      byCategory,
      byStatus,
    };
  }

  /**
   * Calculate net profit (revenue - expenses)
   */
  static async calculateNetProfit(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
    revenue: number,
    context?: EstablishmentServiceContext
  ): Promise<{
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
  }> {
    await connectDB();

    // If context is provided and user is not admin, validate they can access this establishment
    if (context && !context.canAccessAll()) {
      if (context.getEstablishmentId() !== establishmentId) {
        throw new EstablishmentAccessDeniedError({
          userId: context.getUserId(),
          resourceType: 'expense',
          resourceId: 'net-profit',
          userEstablishmentId: context.getEstablishmentId(),
          resourceEstablishmentId: establishmentId,
        });
      }
    }

    const result = await ExpenseModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          date: { $gte: startDate, $lte: endDate },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ] as PipelineStage[]);

    const expenses = result.length > 0 ? result[0].totalExpenses : 0;
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      expenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  }
}

export default ExpenseService;
