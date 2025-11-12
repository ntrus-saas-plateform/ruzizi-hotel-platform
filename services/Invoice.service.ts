import { InvoiceModel } from '@/models/Invoice.model';
import { BookingModel } from '@/models/Booking.model';
import { connectDB } from '@/lib/db';
import { paginate, type PaginationResult, toObjectId } from '@/lib/db/utils';
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceResponse,
  InvoiceFilterOptions,
  AddPaymentInput,
} from '@/types/invoice.types';

/**
 * Invoice Service
 * Handles all invoice-related operations
 */
export class InvoiceService {
  /**
   * Create a new invoice
   */
  static async create(data: CreateInvoiceInput): Promise<InvoiceResponse> {
    await connectDB();

    // Verify booking exists
    const booking = await BookingModel.findById(data.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if invoice already exists for this booking
    const existingInvoice = await InvoiceModel.findByBooking(data.bookingId);
    if (existingInvoice) {
      throw new Error('Invoice already exists for this booking');
    }

    // Calculate subtotal
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate total
    let total = subtotal;
    if (data.discount) {
      total -= data.discount.amount;
    }
    if (data.tax) {
      total += data.tax.amount;
    }

    // Create invoice
    const invoice = await InvoiceModel.create({
      ...data,
      bookingId: toObjectId(data.bookingId),
      establishmentId: toObjectId(data.establishmentId),
      subtotal,
      total,
      balance: total,
      status: 'unpaid',
      issuedAt: new Date(),
    });

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Create invoice automatically from booking
   */
  static async createFromBooking(bookingId: string): Promise<InvoiceResponse> {
    await connectDB();

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if invoice already exists
    const existingInvoice = await InvoiceModel.findByBooking(bookingId);
    if (existingInvoice) {
      return existingInvoice.toJSON() as unknown as InvoiceResponse;
    }

    // Create invoice items from booking
    const items = [
      {
        description: `Hébergement - ${booking.pricingDetails.quantity} ${
          booking.pricingDetails.mode === 'nightly'
            ? 'nuit(s)'
            : booking.pricingDetails.mode === 'monthly'
              ? 'mois'
              : 'heure(s)'
        }`,
        quantity: booking.pricingDetails.quantity,
        unitPrice: booking.pricingDetails.unitPrice,
        total: booking.pricingDetails.subtotal,
      },
    ];

    const invoiceData: CreateInvoiceInput = {
      bookingId,
      establishmentId: booking.establishmentId.toString(),
      clientInfo: {
        name: `${booking.clientInfo.firstName} ${booking.clientInfo.lastName}`,
        email: booking.clientInfo.email,
        phone: booking.clientInfo.phone,
      },
      items,
      discount: booking.pricingDetails.discount
        ? { amount: booking.pricingDetails.discount }
        : undefined,
      tax: booking.pricingDetails.tax ? { rate: 0, amount: booking.pricingDetails.tax } : undefined,
    };

    return this.create(invoiceData);
  }

  /**
   * Get invoice by ID
   */
  static async getById(id: string): Promise<InvoiceResponse | null> {
    await connectDB();

    const invoice = await InvoiceModel.findById(id)
      .populate('establishment', 'name location contacts')
      .populate('booking', 'bookingCode checkIn checkOut');

    if (!invoice) {
      return null;
    }

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Get invoice by invoice number
   */
  static async getByInvoiceNumber(invoiceNumber: string): Promise<InvoiceResponse | null> {
    await connectDB();

    const invoice = await InvoiceModel.findByInvoiceNumber(invoiceNumber);

    if (!invoice) {
      return null;
    }

    await invoice.populate('establishment', 'name location contacts');
    await invoice.populate('booking', 'bookingCode checkIn checkOut');

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Get invoice by booking ID
   */
  static async getByBookingId(bookingId: string): Promise<InvoiceResponse | null> {
    await connectDB();

    const invoice = await InvoiceModel.findByBooking(bookingId);

    if (!invoice) {
      return null;
    }

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Get all invoices with filters and pagination
   */
  static async getAll(
    filters: InvoiceFilterOptions = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<InvoiceResponse>> {
    await connectDB();

    // Build query
    const query: any = {};

    if (filters.establishmentId) {
      query.establishmentId = toObjectId(filters.establishmentId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.issuedFrom || filters.issuedTo) {
      query.issuedAt = {};
      if (filters.issuedFrom) {
        query.issuedAt.$gte = filters.issuedFrom;
      }
      if (filters.issuedTo) {
        query.issuedAt.$lte = filters.issuedTo;
      }
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: new RegExp(filters.search, 'i') },
        { 'clientInfo.name': new RegExp(filters.search, 'i') },
        { 'clientInfo.email': new RegExp(filters.search, 'i') },
      ];
    }

    // Execute query with pagination
    const result = await paginate(InvoiceModel.find(query), {
      page,
      limit,
      sort: { issuedAt: -1 },
    });

    return {
      data: result.data.map((invoice) => invoice.toJSON() as unknown as InvoiceResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Update invoice
   */
  static async update(id: string, data: UpdateInvoiceInput): Promise<InvoiceResponse | null> {
    await connectDB();

    const invoice = await InvoiceModel.findById(id);

    if (!invoice) {
      return null;
    }

    // Update fields
    if (data.items) {
      invoice.items = data.items;
      invoice.subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    }

    if (data.discount !== undefined) {
      invoice.discount = data.discount;
    }

    if (data.tax !== undefined) {
      invoice.tax = data.tax;
    }

    if (data.dueDate !== undefined) {
      invoice.dueDate = data.dueDate;
    }

    // Recalculate total
    let total = invoice.subtotal;
    if (invoice.discount) {
      total -= invoice.discount.amount;
    }
    if (invoice.tax) {
      total += invoice.tax.amount;
    }
    invoice.total = total;

    await invoice.save();

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Add payment to invoice
   */
  static async addPayment(
    id: string,
    paymentData: AddPaymentInput
  ): Promise<InvoiceResponse | null> {
    await connectDB();

    const invoice = await InvoiceModel.findById(id);

    if (!invoice) {
      return null;
    }

    // Validate payment amount
    if (paymentData.amount > invoice.balance) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    // Add payment
    invoice.payments.push({
      date: new Date(),
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      receivedBy: toObjectId(paymentData.receivedBy),
    });

    await invoice.save();

    return invoice.toJSON() as unknown as InvoiceResponse;
  }

  /**
   * Get invoices by establishment
   */
  static async getByEstablishment(establishmentId: string): Promise<InvoiceResponse[]> {
    await connectDB();

    const invoices = await InvoiceModel.findByEstablishment(establishmentId);

    return invoices.map((invoice) => invoice.toJSON() as unknown as InvoiceResponse);
  }

  /**
   * Get invoice statistics for an establishment
   */
  static async getStatistics(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    paidInvoices: number;
    unpaidInvoices: number;
    partialInvoices: number;
    totalPaid: number;
    totalUnpaid: number;
  }> {
    await connectDB();

    const result = await InvoiceModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          issuedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
          unpaidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] },
          },
          partialInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] },
          },
          totalPaid: {
            $sum: { $subtract: ['$total', '$balance'] },
          },
          totalUnpaid: { $sum: '$balance' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        totalInvoices: 0,
        totalRevenue: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        partialInvoices: 0,
        totalPaid: 0,
        totalUnpaid: 0,
      };
    }

    return result[0];
  }

  /**
   * Delete invoice
   */
  static async delete(id: string): Promise<boolean> {
    await connectDB();

    const invoice = await InvoiceModel.findById(id);

    if (!invoice) {
      return false;
    }

    // Only allow deletion of unpaid invoices with no payments
    if (invoice.payments.length > 0) {
      throw new Error('Cannot delete invoice with payments');
    }

    await InvoiceModel.findByIdAndDelete(id);

    return true;
  }
}

export default InvoiceService;
