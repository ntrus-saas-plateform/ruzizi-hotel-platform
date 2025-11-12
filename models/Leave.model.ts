import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId;
  type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveModel extends Model<ILeave> {
  findByEmployee(employeeId: string, year?: number): Promise<ILeave[]>;
  findPending(): Promise<ILeave[]>;
  calculateDays(startDate: Date, endDate: Date): number;
}

const LeaveSchema = new Schema<ILeave, ILeaveModel>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other'],
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    attachments: [
      {
        type: String,
      },
    ],
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

LeaveSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
LeaveSchema.index({ status: 1, startDate: 1 });

LeaveSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    this.days = LeaveModel.calculateDays(this.startDate, this.endDate);
  }
  next();
});

LeaveSchema.statics.calculateDays = function (startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  let workingDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

LeaveSchema.statics.findByEmployee = function (employeeId: string, year?: number) {
  const query: any = { employeeId: new mongoose.Types.ObjectId(employeeId) };
  
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    query.startDate = { $gte: startOfYear, $lte: endOfYear };
  }
  
  return this.find(query).sort({ startDate: -1 });
};

LeaveSchema.statics.findPending = function () {
  return this.find({ status: 'pending' })
    .populate('employeeId', 'personalInfo employmentInfo')
    .sort({ createdAt: 1 });
};

export const LeaveModel =
  (mongoose.models.Leave as ILeaveModel) ||
  mongoose.model<ILeave, ILeaveModel>('Leave', LeaveSchema);
