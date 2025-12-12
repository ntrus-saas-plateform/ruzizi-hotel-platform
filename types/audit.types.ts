import { Types } from 'mongoose';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'payment'
  | 'refund'
  | 'status_change';

export type AuditEntity =
  | 'user'
  | 'establishment'
  | 'accommodation'
  | 'booking'
  | 'client'
  | 'invoice'
  | 'expense'
  | 'employee'
  | 'attendance'
  | 'payroll'
  | 'leave'
  | 'maintenance';

export interface IAuditLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string; // Changed to string to support UUIDs
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface CreateAuditLogInput {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
