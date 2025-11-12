export type ExpenseCategory =
  | 'utilities'
  | 'maintenance'
  | 'supplies'
  | 'salaries'
  | 'marketing'
  | 'taxes'
  | 'insurance'
  | 'other';

export interface Expense {
  id: string;
  establishmentId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  attachments: string[];
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseInput {
  establishmentId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  attachments?: string[];
  notes?: string;
  createdBy: string;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  date?: Date;
  attachments?: string[];
  notes?: string;
}

export interface ApproveExpenseInput {
  approvedBy: string;
}

export interface ExpenseResponse extends Expense {}

export interface ExpenseFilterOptions {
  establishmentId?: string;
  category?: ExpenseCategory;
  status?: 'pending' | 'approved' | 'rejected';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseStatistics {
  totalExpenses: number;
  totalAmount: number;
  byCategory: Array<{
    category: ExpenseCategory;
    count: number;
    amount: number;
  }>;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
}
