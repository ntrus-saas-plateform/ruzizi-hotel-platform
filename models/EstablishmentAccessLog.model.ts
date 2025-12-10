import mongoose, { Schema, Model } from 'mongoose';
import { UserRole } from '@/types/user.types';

/**
 * Access action types for establishment isolation
 */
export type AccessAction = 'read' | 'create' | 'update' | 'delete';

/**
 * Resource types that can be accessed
 */
export type ResourceType =
  | 'booking'
  | 'accommodation'
  | 'client'
  | 'invoice'
  | 'expense'
  | 'employee'
  | 'attendance'
  | 'payroll'
  | 'leave'
  | 'maintenance'
  | 'establishment'
  | 'user';

/**
 * Establishment access log interface
 */
export interface IEstablishmentAccessLog {
  _id: mongoose.Types.ObjectId;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  userRole: UserRole;
  userEstablishmentId?: mongoose.Types.ObjectId;
  action: AccessAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceEstablishmentId: mongoose.Types.ObjectId;
  allowed: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Establishment access log schema
 */
const EstablishmentAccessLogSchema = new Schema<IEstablishmentAccessLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['root', 'super_admin', 'manager', 'staff'],
      required: true,
    },
    userEstablishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
    },
    action: {
      type: String,
      enum: ['read', 'create', 'update', 'delete'],
      required: true,
    },
    resourceType: {
      type: String,
      enum: [
        'booking',
        'accommodation',
        'client',
        'invoice',
        'expense',
        'employee',
        'attendance',
        'payroll',
        'leave',
        'maintenance',
        'establishment',
        'user',
      ],
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
    },
    resourceEstablishmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Establishment',
      required: true,
    },
    allowed: {
      type: Boolean,
      required: true,
      index: true,
    },
    reason: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Compound indexes for common queries
EstablishmentAccessLogSchema.index({ timestamp: -1 });
EstablishmentAccessLogSchema.index({ userId: 1, timestamp: -1 });
EstablishmentAccessLogSchema.index({ allowed: 1, timestamp: -1 });
EstablishmentAccessLogSchema.index({ resourceType: 1, resourceId: 1 });

const EstablishmentAccessLog: Model<IEstablishmentAccessLog> =
  mongoose.models.EstablishmentAccessLog ||
  mongoose.model<IEstablishmentAccessLog>('EstablishmentAccessLog', EstablishmentAccessLogSchema);

export default EstablishmentAccessLog;
