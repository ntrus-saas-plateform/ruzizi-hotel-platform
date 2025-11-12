import { InvoiceService } from '@/services/Invoice.service';
import { InvoiceModel } from '@/models/Invoice.model';
import { BookingModel } from '@/models/Booking.model';

// Mock dependencies
jest.mock('@/models/Invoice.model');
jest.mock('@/models/Booking.model');
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  dbConnect: jest.fn().mockResolvedValue({}),
}));

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFromBooking', () => {
    it('should generate invoice from booking successfully', async () => {
      const mockBooking = {
        _id: 'booking123',
        bookingCode: 'BK-2025-001',
        establishmentId: 'est123',
        clientInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+25769000000',
        },
        pricingDetails: {
          mode: 'nightly',
          unitPrice: 50000,
          quantity: 5,
          subtotal: 250000,
          total: 250000,
        },
      };

      const mockInvoice = {
        _id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        bookingId: 'booking123',
        totalAmount: 250000,
        balance: 250000,
        status: 'unpaid',
        toJSON: jest.fn().mockReturnValue({
          id: 'invoice123',
          invoiceNumber: 'INV-2025-001',
        }),
      };

      (BookingModel.findById as jest.Mock).mockResolvedValue(mockBooking);
      (InvoiceModel.create as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await InvoiceService.generateFromBooking('booking123');

      expect(result).toHaveProperty('id', 'invoice123');
      expect(result).toHaveProperty('invoiceNumber', 'INV-2025-001');
      expect(InvoiceModel.create).toHaveBeenCalled();
    });

    it('should throw error for invalid booking', async () => {
      (BookingModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        InvoiceService.generateFromBooking('invalid-id')
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update balance', async () => {
      const mockInvoice = {
        _id: 'invoice123',
        totalAmount: 250000,
        paidAmount: 0,
        balance: 250000,
        status: 'unpaid',
        payments: [],
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 'invoice123',
          balance: 150000,
          status: 'partial',
        }),
      };

      (InvoiceModel.findById as jest.Mock).mockResolvedValue(mockInvoice);

      const paymentData = {
        amount: 100000,
        method: 'cash',
        reference: 'CASH-001',
      };

      const result = await InvoiceService.recordPayment('invoice123', paymentData);

      expect(mockInvoice.paidAmount).toBe(100000);
      expect(mockInvoice.balance).toBe(150000);
      expect(mockInvoice.status).toBe('partial');
      expect(mockInvoice.payments).toHaveLength(1);
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should mark invoice as paid when fully paid', async () => {
      const mockInvoice = {
        _id: 'invoice123',
        totalAmount: 250000,
        paidAmount: 0,
        balance: 250000,
        status: 'unpaid',
        payments: [],
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: 'invoice123',
          balance: 0,
          status: 'paid',
        }),
      };

      (InvoiceModel.findById as jest.Mock).mockResolvedValue(mockInvoice);

      const paymentData = {
        amount: 250000,
        method: 'bank_transfer',
        reference: 'BANK-001',
      };

      const result = await InvoiceService.recordPayment('invoice123', paymentData);

      expect(mockInvoice.paidAmount).toBe(250000);
      expect(mockInvoice.balance).toBe(0);
      expect(mockInvoice.status).toBe('paid');
    });

    it('should throw error for overpayment', async () => {
      const mockInvoice = {
        _id: 'invoice123',
        totalAmount: 250000,
        paidAmount: 0,
        balance: 250000,
        status: 'unpaid',
      };

      (InvoiceModel.findById as jest.Mock).mockResolvedValue(mockInvoice);

      const paymentData = {
        amount: 300000, // More than balance
        method: 'cash',
        reference: 'CASH-001',
      };

      await expect(
        InvoiceService.recordPayment('invoice123', paymentData)
      ).rejects.toThrow('Payment amount exceeds balance');
    });
  });

  describe('calculateBalance', () => {
    it('should calculate balance correctly', () => {
      const totalAmount = 250000;
      const paidAmount = 100000;

      const balance = InvoiceService.calculateBalance(totalAmount, paidAmount);

      expect(balance).toBe(150000);
    });

    it('should return 0 when fully paid', () => {
      const totalAmount = 250000;
      const paidAmount = 250000;

      const balance = InvoiceService.calculateBalance(totalAmount, paidAmount);

      expect(balance).toBe(0);
    });
  });
});
