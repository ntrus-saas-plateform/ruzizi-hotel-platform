import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_checkin'
  | 'booking_checkout'
  | 'payment_received'
  | 'invoice_generated'
  | 'invoice_overdue'
  | 'expense_approved'
  | 'expense_rejected'
  | 'expense_request'
  | 'maintenance_assigned'
  | 'maintenance_required'
  | 'contract_expiring'
  | 'absence_pattern'
  | 'overtime_limit'
  | 'pending_leave'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_request'
  | 'payroll_generated'
  | 'payroll_paid'
  | 'low_occupancy'
  | 'new_booking'
  | 'system_alert';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface INotificationModel extends Model<INotification> {
  findByUser(userId: string): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<INotification | null>;
  markAllAsRead(userId: string): Promise<number>;
}

const NotificationSchema = new Schema<INotification, INotificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'payment_received',
        'invoice_generated',
        'expense_approved',
        'expense_rejected',
        'system_alert',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
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

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

NotificationSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(50);
};

NotificationSchema.statics.markAsRead = function (notificationId: string) {
  return this.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};

NotificationSchema.statics.markAllAsRead = async function (userId: string) {
  const result = await this.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), read: false },
    { read: true }
  );
  return result.modifiedCount;
};

export const NotificationModel =
  (mongoose.models.Notification as INotificationModel) ||
  mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);
