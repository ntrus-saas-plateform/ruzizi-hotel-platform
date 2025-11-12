import { NotificationModel } from '@/models/Notification.model';
import { connectDB } from '@/lib/db';
import { toObjectId } from '@/lib/db/utils';
import type { CreateNotificationInput, NotificationResponse } from '@/types/notification.types';

export class NotificationService {
  static async create(data: CreateNotificationInput): Promise<NotificationResponse> {
    await connectDB();

    const notification = await NotificationModel.create({
      ...data,
      userId: toObjectId(data.userId),
      read: false,
    });

    return notification.toJSON() as unknown as NotificationResponse;
  }

  static async getByUser(userId: string): Promise<NotificationResponse[]> {
    await connectDB();

    const notifications = await NotificationModel.findByUser(userId);

    return notifications.map((n) => n.toJSON() as unknown as NotificationResponse);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    await connectDB();

    return NotificationModel.countDocuments({
      userId: toObjectId(userId),
      read: false,
    });
  }

  static async markAsRead(notificationId: string): Promise<NotificationResponse | null> {
    await connectDB();

    const notification = await NotificationModel.markAsRead(notificationId);

    if (!notification) {
      return null;
    }

    return notification.toJSON() as unknown as NotificationResponse;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    await connectDB();

    return NotificationModel.markAllAsRead(userId);
  }

  static async notifyBookingConfirmed(userId: string, bookingCode: string) {
    return this.create({
      userId,
      type: 'booking_confirmed',
      title: 'Réservation confirmée',
      message: `Votre réservation ${bookingCode} a été confirmée avec succès.`,
      data: { bookingCode },
    });
  }

  static async notifyPaymentReceived(userId: string, invoiceNumber: string, amount: number) {
    return this.create({
      userId,
      type: 'payment_received',
      title: 'Paiement reçu',
      message: `Paiement de ${amount.toLocaleString()} BIF reçu pour la facture ${invoiceNumber}.`,
      data: { invoiceNumber, amount },
    });
  }

  static async notifyExpenseApproved(userId: string, expenseId: string) {
    return this.create({
      userId,
      type: 'expense_approved',
      title: 'Dépense approuvée',
      message: 'Votre demande de dépense a été approuvée.',
      data: { expenseId },
    });
  }

  static async notifyExpenseRejected(userId: string, expenseId: string, reason: string) {
    return this.create({
      userId,
      type: 'expense_rejected',
      title: 'Dépense rejetée',
      message: `Votre demande de dépense a été rejetée. Raison: ${reason}`,
      data: { expenseId, reason },
    });
  }

  static async notifyLeaveApproved(userId: string, leaveId: string, startDate: Date, endDate: Date) {
    return this.create({
      userId,
      type: 'leave_approved',
      title: 'Congé approuvé',
      message: `Votre demande de congé du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')} a été approuvée.`,
      data: { leaveId, startDate, endDate },
    });
  }

  static async notifyLeaveRejected(userId: string, leaveId: string, reason: string) {
    return this.create({
      userId,
      type: 'leave_rejected',
      title: 'Congé rejeté',
      message: `Votre demande de congé a été rejetée. Raison: ${reason}`,
      data: { leaveId, reason },
    });
  }

  static async notifyPayrollGenerated(userId: string, payrollId: string, month: number, year: number) {
    return this.create({
      userId,
      type: 'payroll_generated',
      title: 'Fiche de paie disponible',
      message: `Votre fiche de paie pour ${new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })} est disponible.`,
      data: { payrollId, month, year },
    });
  }

  static async notifyPayrollPaid(userId: string, payrollId: string, amount: number) {
    return this.create({
      userId,
      type: 'payroll_paid',
      title: 'Salaire versé',
      message: `Votre salaire de ${amount.toLocaleString()} BIF a été versé.`,
      data: { payrollId, amount },
    });
  }

  static async notifyBookingCancelled(userId: string, bookingCode: string) {
    return this.create({
      userId,
      type: 'booking_cancelled',
      title: 'Réservation annulée',
      message: `La réservation ${bookingCode} a été annulée.`,
      data: { bookingCode },
    });
  }

  static async notifyBookingCheckIn(userId: string, bookingCode: string) {
    return this.create({
      userId,
      type: 'booking_checkin',
      title: 'Check-in effectué',
      message: `Check-in effectué pour la réservation ${bookingCode}.`,
      data: { bookingCode },
    });
  }

  static async notifyBookingCheckOut(userId: string, bookingCode: string) {
    return this.create({
      userId,
      type: 'booking_checkout',
      title: 'Check-out effectué',
      message: `Check-out effectué pour la réservation ${bookingCode}. Merci de votre visite!`,
      data: { bookingCode },
    });
  }

  static async notifyInvoiceGenerated(userId: string, invoiceNumber: string, amount: number) {
    return this.create({
      userId,
      type: 'invoice_generated',
      title: 'Nouvelle facture',
      message: `Facture ${invoiceNumber} générée pour un montant de ${amount.toLocaleString()} BIF.`,
      data: { invoiceNumber, amount },
    });
  }

  static async notifyInvoiceOverdue(userId: string, invoiceNumber: string, daysOverdue: number) {
    return this.create({
      userId,
      type: 'invoice_overdue',
      title: 'Facture en retard',
      message: `La facture ${invoiceNumber} est en retard de ${daysOverdue} jours.`,
      data: { invoiceNumber, daysOverdue },
    });
  }

  static async notifyLowOccupancy(userId: string, establishmentName: string, occupancyRate: number) {
    return this.create({
      userId,
      type: 'low_occupancy',
      title: 'Taux d\'occupation faible',
      message: `Le taux d'occupation de ${establishmentName} est de ${occupancyRate}%.`,
      data: { establishmentName, occupancyRate },
    });
  }

  static async notifyMaintenanceRequired(userId: string, accommodationName: string) {
    return this.create({
      userId,
      type: 'maintenance_required',
      title: 'Maintenance requise',
      message: `L'hébergement ${accommodationName} nécessite une maintenance.`,
      data: { accommodationName },
    });
  }

  static async notifyNewBooking(userId: string, bookingCode: string, accommodationName: string) {
    return this.create({
      userId,
      type: 'new_booking',
      title: 'Nouvelle réservation',
      message: `Nouvelle réservation ${bookingCode} pour ${accommodationName}.`,
      data: { bookingCode, accommodationName },
    });
  }

  static async notifyLeaveRequest(userId: string, employeeName: string, leaveType: string) {
    return this.create({
      userId,
      type: 'leave_request',
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a soumis une demande de congé (${leaveType}).`,
      data: { employeeName, leaveType },
    });
  }

  static async notifyExpenseRequest(userId: string, employeeName: string, amount: number) {
    return this.create({
      userId,
      type: 'expense_request',
      title: 'Nouvelle demande de dépense',
      message: `${employeeName} a soumis une demande de dépense de ${amount.toLocaleString()} BIF.`,
      data: { employeeName, amount },
    });
  }
}

export default NotificationService;
