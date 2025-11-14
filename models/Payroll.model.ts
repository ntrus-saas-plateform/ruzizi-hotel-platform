import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  period: {
    month: number;
    year: number;
  };
  baseSalary: number;
  allowances: {
    type: string;
    amount: number;
  }[];
  deductions: {
    type: string;
    amount: number;
  }[];
  bonuses: {
    type: string;
    amount: number;
  }[];
  overtimeHours: number;
  overtimeRate: number;
  totalGross: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayrollModel extends Model<IPayroll> {
  findByEmployee(employeeId: string, year?: number, month?: number): Promise<IPayroll[]>;
  findByPeriod(year: number, month: number): Promise<IPayroll[]>;
}

const PayrollSchema = new Schema<IPayroll, IPayrollModel>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    period: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
        min: 2000,
      },
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: [
      {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    deductions: [
      {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    bonuses: [
      {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGross: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'pending', 'approved', 'paid'],
      default: 'draft',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
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

PayrollSchema.index({ employeeId: 1, 'period.year': 1, 'period.month': 1 }, { unique: true });
PayrollSchema.index({ 'period.year': 1, 'period.month': 1, status: 1 });

PayrollSchema.pre('save', function (next) {
  let gross = this.baseSalary;

  this.allowances.forEach((allowance) => {
    gross += allowance.amount;
  });

  this.bonuses.forEach((bonus) => {
    gross += bonus.amount;
  });

  gross += this.overtimeHours * this.overtimeRate;

  this.totalGross = gross;

  let deductions = 0;
  this.deductions.forEach((deduction) => {
    deductions += deduction.amount;
  });

  this.totalDeductions = deductions;
  this.netSalary = Math.max(0, this.totalGross - this.totalDeductions);

  next();
});

PayrollSchema.statics.findByEmployee = function (
  employeeId: string,
  year?: number,
  month?: number
) {
  const query: any = { employeeId: new mongoose.Types.ObjectId(employeeId) };

  if (year) {
    query['period.year'] = year;
  }

  if (month) {
    query['period.month'] = month;
  }

  return this.find(query).sort({ 'period.year': -1, 'period.month': -1 });
};

PayrollSchema.statics.findByPeriod = function (year: number, month: number) {
  return this.find({
    'period.year': year,
    'period.month': month,
  }).populate('employeeId', 'personalInfo employmentInfo');
};

export const PayrollModel =
  (mongoose.models.Payroll as IPayrollModel) ||
  mongoose.model<IPayroll, IPayrollModel>('Payroll', PayrollSchema);
