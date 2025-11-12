import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  total: z.number().min(0, 'Total must be positive'),
});

export const InvoiceDiscountSchema = z.object({
  amount: z.number().min(0, 'Discount amount must be positive'),
  reason: z.string().optional(),
});

export const InvoiceTaxSchema = z.object({
  rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  amount: z.number().min(0, 'Tax amount must be positive'),
});

export const InvoiceClientInfoSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

export const CreateInvoiceSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  establishmentId: z.string().min(1, 'Establishment ID is required'),
  clientInfo: InvoiceClientInfoSchema,
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  discount: InvoiceDiscountSchema.optional(),
  tax: InvoiceTaxSchema.optional(),
  dueDate: z.coerce.date().optional(),
});

export const UpdateInvoiceSchema = z.object({
  items: z.array(InvoiceItemSchema).optional(),
  discount: InvoiceDiscountSchema.optional(),
  tax: InvoiceTaxSchema.optional(),
  dueDate: z.coerce.date().optional(),
});

export const AddPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  method: z.enum(['cash', 'mobile_money', 'card', 'bank_transfer']),
  reference: z.string().optional(),
  receivedBy: z.string().min(1, 'Received by is required'),
});

export const InvoiceFilterSchema = z.object({
  establishmentId: z.string().optional(),
  status: z.enum(['unpaid', 'partial', 'paid']).optional(),
  issuedFrom: z.coerce.date().optional(),
  issuedTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
