import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'overtime';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceModel extends Model<IAttendance> {
  findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<IAttendance[]>;
  findByDate(date: Date): Promise<IAttendance[]>;
}

const AttendanceSchema = new Schema<IAttendance, IAttendanceModel>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    breakStart: {
      type: Date,
    },
    breakEnd: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'late', 'half_day', 'overtime'],
      index: true,
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

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });

AttendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    let totalMs = this.checkOut.getTime() - this.checkIn.getTime();
    
    if (this.breakStart && this.breakEnd) {
      const breakMs = this.breakEnd.getTime() - this.breakStart.getTime();
      totalMs -= breakMs;
    }
    
    this.totalHours = Math.max(0, totalMs / (1000 * 60 * 60));
  }
  
  next();
});

AttendanceSchema.statics.findByEmployee = function (
  employeeId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { employeeId: new mongoose.Types.ObjectId(employeeId) };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  return this.find(query).sort({ date: -1 });
};

AttendanceSchema.statics.findByDate = function (date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  }).populate('employeeId', 'personalInfo employmentInfo');
};

export const AttendanceModel =
  (mongoose.models.Attendance as IAttendanceModel) ||
  mongoose.model<IAttendance, IAttendanceModel>('Attendance', AttendanceSchema);
