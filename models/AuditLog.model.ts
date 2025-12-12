import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLog } from '@/types/audit.types';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'logout',
        'approve',
        'reject',
        'payment',
        'refund',
        'status_change',
      ],
      required: true,
      index: true,
    },
    entity: {
      type: String,
      enum: [
        'user',
        'establishment',
        'accommodation',
        'booking',
        'client',
        'invoice',
        'expense',
        'employee',
        'attendance',
        'payroll',
        'leave',
        'maintenance',
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String, // Changed from ObjectId to String to support UUIDs
      required: true,
      index: true,
    },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index composé pour recherches fréquentes
AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
