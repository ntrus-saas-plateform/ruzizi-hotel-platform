import { z } from 'zod';

export const ExpenseCategorySchema = z.enum([
  'utilities',
  'maintenance',
  'supplies',
  'salaries',
  'marketing',
  'taxes',
  'insurance',
  'other',
]);

export const CreateExpenseSchema = z.object({
  establishmentId: z.string().min(1, 'Establishment ID is required'),
  category: ExpenseCategorySchema,
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.coerce.date(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
});

export const UpdateExpenseSchema = z.object({
  category: ExpenseCategorySchema.optional(),
  description: z.string().min(1).optional(),
  amount: z.number().min(0.01).optional(),
  date: z.coerce.date().optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const ApproveExpenseSchema = z.object({
  approvedBy: z.string().min(1, 'Approved by is required'),
});

export const ExpenseFilterSchema = z.object({
  establishmentId: z.string().optional(),
  category: ExpenseCategorySchema.optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
