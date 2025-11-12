import { EmployeeModel } from '@/models/Employee.model';
import { InvoiceModel } from '@/models/Invoice.model';
import { LeaveModel } from '@/models/Leave.model';
import { AttendanceModel } from '@/models/Attendance.model';
import { NotificationService } from './Notification.service';
import { connectDB } from '@/lib/db';

export class AlertService {
  /**
   * Vérifier les contrats qui expirent bientôt (30 jours)
   */
  static async checkContractExpirations() {
    await connectDB();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await EmployeeModel.find({
      'employmentInfo.contractEndDate': {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      },
      'employmentInfo.status': 'active',
    });

    for (const employee of expiringContracts) {
      const daysUntilExpiration = Math.ceil(
        (new Date((employee.employmentInfo as any).contractEndDate!).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      // Notifier le manager de l'établissement
      if (employee.employmentInfo.establishmentId) {
        await NotificationService.create({
          userId: employee.employmentInfo.establishmentId.toString(),
          type: 'contract_expiring',
          title: 'Contrat expirant bientôt',
          message: `Le contrat de ${employee.personalInfo.firstName} ${employee.personalInfo.lastName} expire dans ${daysUntilExpiration} jours.`,
          data: {
            employeeId: String(employee._id),
            employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
            expirationDate: (employee.employmentInfo as any).contractEndDate,
            daysUntilExpiration,
          },
        });
      }
    }

    return expiringContracts.length;
  }

  /**
   * Vérifier les factures en retard
   */
  static async checkOverdueInvoices() {
    await connectDB();

    const today = new Date();

    const overdueInvoices = await InvoiceModel.find({
      dueDate: { $lt: today },
      status: { $in: ['pending', 'partial'] },
    }).populate('clientId', 'name email');

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.ceil(
        (today.getTime() - new Date((invoice as any).dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Notifier le client
      if ((invoice as any).clientId) {
        await NotificationService.notifyInvoiceOverdue(
          (invoice as any).clientId._id.toString(),
          invoice.invoiceNumber,
          daysOverdue
        );
      }
    }

    return overdueInvoices.length;
  }

  /**
   * Détecter les patterns d'absence
   */
  static async detectAbsencePatterns() {
    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const employees = await EmployeeModel.find({
      'employmentInfo.status': 'active',
    });

    const alerts = [];

    for (const employee of employees) {
      const absences = await AttendanceModel.countDocuments({
        employeeId: employee._id,
        date: { $gte: thirtyDaysAgo },
        status: 'absent',
      });

      // Si plus de 5 absences en 30 jours
      if (absences > 5) {
        alerts.push({
          employeeId: String(employee._id),
          employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          absenceCount: absences,
        });

        // Notifier le manager
        if (employee.employmentInfo.establishmentId) {
          await NotificationService.create({
            userId: employee.employmentInfo.establishmentId.toString(),
            type: 'absence_pattern',
            title: 'Pattern d\'absence détecté',
            message: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName} a ${absences} absences dans les 30 derniers jours.`,
            data: {
              employeeId: String(employee._id),
              employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
              absenceCount: absences,
            },
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Vérifier les heures supplémentaires excessives
   */
  static async checkOvertimeLimit() {
    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const employees = await EmployeeModel.find({
      'employmentInfo.status': 'active',
    });

    const alerts = [];

    for (const employee of employees) {
      const attendances = await AttendanceModel.find({
        employeeId: employee._id,
        date: { $gte: thirtyDaysAgo },
        status: { $in: ['present', 'overtime'] },
      });

      const totalHours = attendances.reduce((sum, a) => sum + a.totalHours, 0);
      const expectedHours = 8 * 22; // 8h par jour, 22 jours ouvrables
      const overtimeHours = totalHours - expectedHours;

      // Si plus de 20 heures supplémentaires
      if (overtimeHours > 20) {
        alerts.push({
          employeeId: String(employee._id),
          employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          overtimeHours: Math.round(overtimeHours * 10) / 10,
        });

        // Notifier le manager
        if (employee.employmentInfo.establishmentId) {
          await NotificationService.create({
            userId: employee.employmentInfo.establishmentId.toString(),
            type: 'overtime_limit',
            title: 'Heures supplémentaires excessives',
            message: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName} a ${Math.round(overtimeHours)} heures supplémentaires ce mois.`,
            data: {
              employeeId: String(employee._id),
              employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
              overtimeHours: Math.round(overtimeHours * 10) / 10,
            },
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Vérifier les congés en attente depuis longtemps
   */
  static async checkPendingLeaves() {
    await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingLeaves = await LeaveModel.find({
      status: 'pending',
      createdAt: { $lte: sevenDaysAgo },
    }).populate('employeeId', 'personalInfo employmentInfo');

    for (const leave of pendingLeaves) {
      const employee = (leave as any).employeeId;
      if (employee && employee.employmentInfo.establishmentId) {
        await NotificationService.create({
          userId: employee.employmentInfo.establishmentId.toString(),
          type: 'pending_leave',
          title: 'Demande de congé en attente',
          message: `La demande de congé de ${employee.personalInfo.firstName} ${employee.personalInfo.lastName} est en attente depuis plus de 7 jours.`,
          data: {
            leaveId: String(leave._id),
            employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          },
        });
      }
    }

    return pendingLeaves.length;
  }

  /**
   * Exécuter toutes les vérifications d'alertes
   */
  static async runAllChecks() {
    const results = {
      contractExpirations: 0,
      overdueInvoices: 0,
      absencePatterns: 0,
      overtimeAlerts: 0,
      pendingLeaves: 0,
    };

    try {
      results.contractExpirations = await this.checkContractExpirations();
      results.overdueInvoices = await this.checkOverdueInvoices();
      const absenceAlerts = await this.detectAbsencePatterns();
      results.absencePatterns = absenceAlerts.length;
      const overtimeAlerts = await this.checkOvertimeLimit();
      results.overtimeAlerts = overtimeAlerts.length;
      results.pendingLeaves = await this.checkPendingLeaves();
    } catch (error) {
      console.error('Error running alert checks:', error);
    }

    return results;
  }
}

export default AlertService;
