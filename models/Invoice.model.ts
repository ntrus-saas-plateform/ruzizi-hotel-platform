import mongoose, { Schema, Document, Model } from 'mongoose';
import { generateInvoiceNumber } from '@/lib/utils/invoice-number';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoiceDiscount {
  amount: number;
  reason?: string;
}

export interface IInvoiceTax {
  rate: number;
  amount: number;
}

export interface IInvoicePayment {
  date: Date;
  amount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  reference?: string;
  receivedBy: mongoose.Types.ObjectId;
}

export interface IInvoiceClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  bookingId: mongoose.Types.ObjectId;
  establishmentId: mongoose.Types.ObjectId;
  clientInfo: IInvoiceClientInfo;
  items: IInvoiceItem[];
  subtotal: number;
  discount?: IInvoiceDiscount;
  tax?: IInvoiceTax;
  total: number;
  payments: IInvoicePayment[];
  balance: number;
  status: 'unpaid' | 'partial' | 'paid';
  dueDate?: Date;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceModel extends Model<IInvoice> {
  findByInvoiceNumber(invoiceNumber: string): Promise<IInvoice | null>;
  findByBooking(bookingId: string): Promise<IInvoice | null>;
  findByEstablishment(establishmentId: string): Promise<IInvoice[]>;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceDiscountSchema = new Schema<IInvoiceDiscount>(
  {
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String },
  },
  { _id: false }
);

const InvoiceTaxSchema = new Schema<IInvoiceTax>(
  {
    rate: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoicePaymentSchema = new Schema<IInvoicePayment>(
  {
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      required: true,
      enum: ['cash', 'mobile_money', 'card', 'bank_transfer'],
    },
    reference: { type: String },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const InvoiceClientInfoSchema = new Schema<IInvoiceClientInfo>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice, IInvoiceModel>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: true,
      index: true,
    },
    clientInfo: {
      type: InvoiceClientInfoSchema,
      required: true,
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: {
        validator: (items: IInvoiceItem[]) => items.length > 0,
        message: 'At least one item is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: InvoiceDiscountSchema,
    },
    tax: {
      type: InvoiceTaxSchema,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    payments: {
      type: [InvoicePaymentSchema],
      default: [],
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
InvoiceSchema.index({ bookingId: 1 });
InvoiceSchema.index({ establishmentId: 1, status: 1 });
InvoiceSchema.index({ 'clientInfo.email': 1 });
InvoiceSchema.index({ issuedAt: -1 });

// Pre-save hook to generate invoice number
InvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    let isUnique = false;
    let invoiceNumber = '';

    while (!isUnique) {
      invoiceNumber = generateInvoiceNumber();
      const existing = await mongoose.models.Invoice.findOne({ invoiceNumber });
      if (!existing) {
        isUnique = true;
      }
    }

    this.invoiceNumber = invoiceNumber;
  }

  // Calculate balance
  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.balance = Math.max(0, this.total - totalPaid);

  // Update status based on balance
  if (this.balance === 0) {
    this.status = 'paid';
  } else if (totalPaid > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }

  next();
});

// Static methods
InvoiceSchema.statics.findByInvoiceNumber = function (invoiceNumber: string) {
  return this.findOne({ invoiceNumber: invoiceNumber.toUpperCase() });
};

InvoiceSchema.statics.findByBooking = function (bookingId: string) {
  return this.findOne({ bookingId: new mongoose.Types.ObjectId(bookingId) });
};

InvoiceSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId: new mongoose.Types.ObjectId(establishmentId) }).sort({
    issuedAt: -1,
  });
};

export const InvoiceModel =
  (mongoose.models.Invoice as IInvoiceModel) ||
  mongoose.model<IInvoice, IInvoiceModel>('Invoice', InvoiceSchema);
