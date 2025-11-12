import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory =
  | 'utilities'
  | 'maintenance'
  | 'supplies'
  | 'salaries'
  | 'marketing'
  | 'taxes'
  | 'insurance'
  | 'other';

export interface IExpense extends Document {
  establishmentId: mongoose.Types.ObjectId;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  attachments: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseModel extends Model<IExpense> {
  findByEstablishment(establishmentId: string): Promise<IExpense[]>;
  findByCategory(category: ExpenseCategory): Promise<IExpense[]>;
}

const ExpenseSchema = new Schema<IExpense, IExpenseModel>(
  {
    establishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'utilities',
        'maintenance',
        'supplies',
        'salaries',
        'marketing',
        'taxes',
        'insurance',
        'other',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
ExpenseSchema.index({ establishmentId: 1, date: -1 });
ExpenseSchema.index({ establishmentId: 1, category: 1 });
ExpenseSchema.index({ establishmentId: 1, status: 1 });
ExpenseSchema.index({ date: -1 });

// Static methods
ExpenseSchema.statics.findByEstablishment = function (establishmentId: string) {
  return this.find({ establishmentId: new mongoose.Types.ObjectId(establishmentId) }).sort({
    date: -1,
  });
};

ExpenseSchema.statics.findByCategory = function (category: ExpenseCategory) {
  return this.find({ category }).sort({ date: -1 });
};

export const ExpenseModel =
  (mongoose.models.Expense as IExpenseModel) ||
  mongoose.model<IExpense, IExpenseModel>('Expense', ExpenseSchema);
