import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaintenance extends Document {
  accommodationId: mongoose.Types.ObjectId;
  type: 'cleaning' | 'repair' | 'inspection' | 'upgrade' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  cost?: number;
  notes?: string;
  checklist?: {
    item: string;
    completed: boolean;
  }[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMaintenanceModel extends Model<IMaintenance> {
  findByAccommodation(accommodationId: string): Promise<IMaintenance[]>;
  findUpcoming(days?: number): Promise<IMaintenance[]>;
  findByAssignee(assigneeId: string): Promise<IMaintenance[]>;
}

const MaintenanceSchema = new Schema<IMaintenance, IMaintenanceModel>(
  {
    accommodationId: {
      type: Schema.Types.ObjectId,
      ref: 'Accommodation',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['cleaning', 'repair', 'inspection', 'upgrade', 'other'],
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedDate: {
      type: Date,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    cost: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
    },
    checklist: [
      {
        item: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
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

MaintenanceSchema.index({ accommodationId: 1, scheduledDate: 1 });
MaintenanceSchema.index({ status: 1, priority: 1 });
MaintenanceSchema.index({ assignedTo: 1, status: 1 });

MaintenanceSchema.statics.findByAccommodation = function (accommodationId: string) {
  return this.find({ accommodationId: new mongoose.Types.ObjectId(accommodationId) })
    .sort({ scheduledDate: -1 })
    .populate('assignedTo', 'personalInfo');
};

MaintenanceSchema.statics.findUpcoming = function (days: number = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return this.find({
    scheduledDate: { $gte: today, $lte: futureDate },
    status: { $in: ['scheduled', 'in_progress'] },
  })
    .sort({ scheduledDate: 1 })
    .populate('accommodationId', 'name type')
    .populate('assignedTo', 'personalInfo');
};

MaintenanceSchema.statics.findByAssignee = function (assigneeId: string) {
  return this.find({
    assignedTo: new mongoose.Types.ObjectId(assigneeId),
    status: { $in: ['scheduled', 'in_progress'] },
  })
    .sort({ scheduledDate: 1 })
    .populate('accommodationId', 'name type');
};

export const MaintenanceModel =
  (mongoose.models.Maintenance as IMaintenanceModel) ||
  mongoose.model<IMaintenance, IMaintenanceModel>('Maintenance', MaintenanceSchema);
