export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDiscount {
  amount: number;
  reason?: string;
}

export interface InvoiceTax {
  rate: number;
  amount: number;
}

export interface InvoicePayment {
  date: Date;
  amount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  reference?: string;
  receivedBy: string;
}

export interface InvoiceClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  establishmentId: string;
  clientInfo: InvoiceClientInfo;
  items: InvoiceItem[];
  subtotal: number;
  discount?: InvoiceDiscount;
  tax?: InvoiceTax;
  total: number;
  payments: InvoicePayment[];
  balance: number;
  status: 'unpaid' | 'partial' | 'paid';
  dueDate?: Date;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceInput {
  bookingId: string;
  establishmentId: string;
  clientInfo: InvoiceClientInfo;
  items: InvoiceItem[];
  discount?: InvoiceDiscount;
  tax?: InvoiceTax;
  dueDate?: Date;
}

export interface UpdateInvoiceInput {
  items?: InvoiceItem[];
  discount?: InvoiceDiscount;
  tax?: InvoiceTax;
  dueDate?: Date;
}

export interface AddPaymentInput {
  amount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  reference?: string;
  receivedBy: string;
}

export interface InvoiceResponse extends Invoice {}

export interface InvoiceFilterOptions {
  establishmentId?: string;
  status?: 'unpaid' | 'partial' | 'paid';
  issuedFrom?: Date;
  issuedTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}
