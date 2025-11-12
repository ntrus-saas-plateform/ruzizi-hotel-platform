import { ExpenseModel } from '@/models/Expense.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
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
  static async create(data: CreateExpenseInput): Promise<ExpenseResponse> {
    await connectDB();

    const expense = await ExpenseModel.create({
      ...data,
      establishmentId: toObjectId(data.establishmentId),
      createdBy: toObjectId(data.createdBy),
      status: 'pending',
    });

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Get expense by ID
   */
  static async getById(id: string): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id)
      .populate('establishment', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return null;
    }

    return expense.toJSON() as unknown as ExpenseResponse;
  }

  /**
   * Get all expenses with filters and pagination
   */
  static async getAll(
    filters: ExpenseFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<ExpenseResponse>> {
    await connectDB();

    // Build query
    const query: any = {};

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
  static async update(id: string, data: UpdateExpenseInput): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
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
  static async approve(id: string, data: ApproveExpenseInput): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
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
  static async reject(id: string, data: ApproveExpenseInput): Promise<ExpenseResponse | null> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return null;
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
  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const expense = await ExpenseModel.findById(id);

    if (!expense) {
      return false;
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
  static async getByEstablishment(establishmentId: string): Promise<ExpenseResponse[]> {
    await connectDB();

    const expenses = await ExpenseModel.findByEstablishment(establishmentId);

    return expenses.map((expense) => expense.toJSON() as unknown as ExpenseResponse);
  }

  /**
   * Get expenses by category
   */
  static async getByCategory(category: ExpenseCategory): Promise<ExpenseResponse[]> {
    await connectDB();

    const expenses = await ExpenseModel.findByCategory(category);

    return expenses.map((expense) => expense.toJSON() as unknown as ExpenseResponse);
  }

  /**
   * Get expense statistics
   */
  static async getStatistics(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpenseStatistics> {
    await connectDB();

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
    ]);

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
    revenue: number
  ): Promise<{
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
  }> {
    await connectDB();

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
    ]);

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
