import { AnalyticsService } from './Analytics.service';
import { BookingModel } from '@/models/Booking.model';
import { InvoiceModel } from '@/models/Invoice.model';
import { ExpenseModel } from '@/models/Expense.model';
import { EmployeeModel } from '@/models/Employee.model';
import { PayrollModel } from '@/models/Payroll.model';
import { EstablishmentModel } from '@/models/Establishment.model';
import { connectDB } from '@/lib/db';
import { toObjectId } from '@/lib/db/utils';

export interface ReportData {
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  establishment?: {
    id: string;
    name: string;
  };
  summary: {
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
    bookings: number;
    occupancyRate: number;
  };
  details: {
    revenueByPeriod: any[];
    expensesByCategory: any[];
    topAccommodations: any[];
    bookingsByStatus: any;
  };
  generatedAt: Date;
}

export class ReportService {
  static async generateFinancialReport(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(establishmentId);
    
    const [summary, revenueByPeriod, expensesByCategory, topAccommodations, bookingsByStatus] =
      await Promise.all([
        AnalyticsService.getFinancialSummary(establishmentId, startDate, endDate),
        AnalyticsService.getRevenueByPeriod(establishmentId, startDate, endDate, 'day'),
        AnalyticsService.getExpensesByCategory(establishmentId, startDate, endDate),
        this.getTopAccommodations(establishmentId, startDate, endDate),
        this.getBookingsByStatus(establishmentId, startDate, endDate),
      ]);

    return {
      title: `Rapport Financier - ${establishment?.name || 'Établissement'}`,
      period: {
        start: startDate,
        end: endDate,
      },
      establishment: establishment
        ? {
            id: (establishment as any)._id.toString(),
            name: establishment.name,
          }
        : undefined,
      summary: {
        revenue: summary.revenue,
        expenses: summary.expenses,
        netProfit: summary.netProfit,
        profitMargin: summary.profitMargin,
        bookings: summary.bookings.total,
        occupancyRate: summary.occupancy,
      },
      details: {
        revenueByPeriod,
        expensesByCategory,
        topAccommodations,
        bookingsByStatus,
      },
      generatedAt: new Date(),
    };
  }

  static async generateHRReport(
    establishmentId: string,
    year: number,
    month: number
  ): Promise<any> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(establishmentId);
    
    const [employees, payrolls, totalSalary] = await Promise.all([
      EmployeeModel.countDocuments({
        'employmentInfo.establishmentId': toObjectId(establishmentId),
        'employmentInfo.status': 'active',
      }),
      PayrollModel.find({
        'period.year': year,
        'period.month': month,
      }).populate('employeeId', 'personalInfo employmentInfo'),
      this.getTotalSalaryExpense(establishmentId, year, month),
    ]);

    const payrollsByStatus = {
      draft: payrolls.filter((p) => p.status === 'draft').length,
      pending: payrolls.filter((p) => p.status === 'pending').length,
      approved: payrolls.filter((p) => p.status === 'approved').length,
      paid: payrolls.filter((p) => p.status === 'paid').length,
    };

    return {
      title: `Rapport RH - ${establishment?.name || 'Établissement'}`,
      period: {
        year,
        month,
      },
      establishment: establishment
        ? {
            id: (establishment as any)._id.toString(),
            name: establishment.name,
          }
        : undefined,
      summary: {
        totalEmployees: employees,
        totalPayrolls: payrolls.length,
        totalSalary,
        averageSalary: employees > 0 ? totalSalary / employees : 0,
      },
      details: {
        payrollsByStatus,
        payrolls: payrolls.map((p) => ({
          employee: (p as any).employeeId?.personalInfo,
          netSalary: p.netSalary,
          status: p.status,
        })),
      },
      generatedAt: new Date(),
    };
  }

  static async generateOccupancyReport(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    await connectDB();

    const establishment = await EstablishmentModel.findById(establishmentId);
    
    const [occupancyRate, bookings, accommodationStats] = await Promise.all([
      AnalyticsService.getOccupancyRate(establishmentId, startDate, endDate),
      BookingModel.find({
        establishmentId: toObjectId(establishmentId),
        checkIn: { $gte: startDate, $lte: endDate },
      }).populate('accommodationId', 'name type'),
      this.getAccommodationOccupancy(establishmentId, startDate, endDate),
    ]);

    return {
      title: `Rapport d'Occupation - ${establishment?.name || 'Établissement'}`,
      period: {
        start: startDate,
        end: endDate,
      },
      establishment: establishment
        ? {
            id: (establishment as any)._id.toString(),
            name: establishment.name,
          }
        : undefined,
      summary: {
        overallOccupancy: occupancyRate,
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
        completedBookings: bookings.filter((b) => b.status === 'completed').length,
      },
      details: {
        accommodationStats,
        bookingsByType: this.groupBookingsByType(bookings),
      },
      generatedAt: new Date(),
    };
  }

  private static async getTopAccommodations(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await BookingModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          checkIn: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$accommodationId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'accommodations',
          localField: '_id',
          foreignField: '_id',
          as: 'accommodation',
        },
      },
      {
        $unwind: '$accommodation',
      },
    ]);

    return result.map((item) => ({
      accommodationId: item._id.toString(),
      name: item.accommodation.name,
      type: item.accommodation.type,
      bookings: item.bookings,
      revenue: item.revenue,
    }));
  }

  private static async getBookingsByStatus(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await BookingModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          checkIn: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const stats: any = {};
    result.forEach((item) => {
      stats[item._id] = {
        count: item.count,
        revenue: item.revenue,
      };
    });

    return stats;
  }

  private static async getTotalSalaryExpense(
    establishmentId: string,
    year: number,
    month: number
  ): Promise<number> {
    const employees = await EmployeeModel.find({
      'employmentInfo.establishmentId': toObjectId(establishmentId),
    });

    const employeeIds = employees.map((e) => e._id);

    const result = await PayrollModel.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
          'period.year': year,
          'period.month': month,
          status: { $in: ['approved', 'paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$netSalary' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  private static async getAccommodationOccupancy(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await BookingModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          status: { $in: ['confirmed', 'completed'] },
          $or: [
            { checkIn: { $gte: startDate, $lte: endDate } },
            { checkOut: { $gte: startDate, $lte: endDate } },
            { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } },
          ],
        },
      },
      {
        $group: {
          _id: '$accommodationId',
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'accommodations',
          localField: '_id',
          foreignField: '_id',
          as: 'accommodation',
        },
      },
      {
        $unwind: '$accommodation',
      },
    ]);

    return result.map((item) => ({
      accommodationId: item._id.toString(),
      name: item.accommodation.name,
      type: item.accommodation.type,
      bookings: item.bookings,
    }));
  }

  private static groupBookingsByType(bookings: any[]) {
    const grouped: any = {};
    
    bookings.forEach((booking) => {
      const type = (booking as any).accommodationId?.type || 'unknown';
      if (!grouped[type]) {
        grouped[type] = {
          count: 0,
          revenue: 0,
        };
      }
      grouped[type].count++;
      grouped[type].revenue += booking.totalPrice;
    });

    return grouped;
  }

  static async generateComparisonReport(
    establishmentIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    await connectDB();

    const comparisons = await Promise.all(
      establishmentIds.map(async (id) => {
        const establishment = await EstablishmentModel.findById(id);
        const summary = await AnalyticsService.getFinancialSummary(id, startDate, endDate);

        return {
          establishmentId: id,
          name: establishment?.name || 'Unknown',
          revenue: summary.revenue,
          expenses: summary.expenses,
          netProfit: summary.netProfit,
          profitMargin: summary.profitMargin,
          occupancyRate: summary.occupancy,
          bookings: summary.bookings.total,
        };
      })
    );

    return {
      title: 'Rapport de Comparaison des Établissements',
      period: {
        start: startDate,
        end: endDate,
      },
      establishments: comparisons,
      totals: {
        revenue: comparisons.reduce((sum, e) => sum + e.revenue, 0),
        expenses: comparisons.reduce((sum, e) => sum + e.expenses, 0),
        netProfit: comparisons.reduce((sum, e) => sum + e.netProfit, 0),
        bookings: comparisons.reduce((sum, e) => sum + e.bookings, 0),
      },
      generatedAt: new Date(),
    };
  }
}

export default ReportService;
