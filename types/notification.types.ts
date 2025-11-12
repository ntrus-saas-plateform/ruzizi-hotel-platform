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

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationResponse extends Notification {}
