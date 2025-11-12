import { BookingModel } from '@/models/Booking.model';
import { InvoiceModel } from '@/models/Invoice.model';
import { ExpenseModel } from '@/models/Expense.model';
import { AccommodationModel } from '@/models/Accommodation.model';
import { connectDB } from '@/lib/db';
import { toObjectId } from '@/lib/db/utils';

export class AnalyticsService {
  static async getFinancialSummary(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    await connectDB();

    const [revenue, expenses, bookings, occupancy] = await Promise.all([
      this.getTotalRevenue(establishmentId, startDate, endDate),
      this.getTotalExpenses(establishmentId, startDate, endDate),
      this.getBookingStats(establishmentId, startDate, endDate),
      this.getOccupancyRate(establishmentId, startDate, endDate),
    ]);

    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      expenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      bookings,
      occupancy,
    };
  }

  static async getTotalRevenue(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    await connectDB();

    const result = await InvoiceModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          issuedAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['paid', 'partial'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$total', '$balance'] } },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  static async getTotalExpenses(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    await connectDB();

    const result = await ExpenseModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          date: { $gte: startDate, $lte: endDate },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  static async getBookingStats(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    await connectDB();

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
        },
      },
    ]);

    const stats = {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
    };

    result.forEach((item) => {
      stats.total += item.count;
      if (item._id === 'confirmed') stats.confirmed = item.count;
      if (item._id === 'pending') stats.pending = item.count;
      if (item._id === 'cancelled') stats.cancelled = item.count;
      if (item._id === 'completed') stats.completed = item.count;
    });

    return stats;
  }

  static async getOccupancyRate(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    await connectDB();

    const totalAccommodations = await AccommodationModel.countDocuments({
      establishmentId: toObjectId(establishmentId),
    });

    const bookings = await BookingModel.find({
      establishmentId: toObjectId(establishmentId),
      status: { $in: ['confirmed', 'completed'] },
      $or: [
        { checkIn: { $gte: startDate, $lte: endDate } },
        { checkOut: { $gte: startDate, $lte: endDate } },
        { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } },
      ],
    });

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPossibleNights = totalAccommodations * totalDays;

    let totalOccupiedNights = 0;
    for (const booking of bookings) {
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      const overlapStart = bookingStart > startDate ? bookingStart : startDate;
      const overlapEnd = bookingEnd < endDate ? bookingEnd : endDate;
      const nights = Math.ceil(
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalOccupiedNights += Math.max(0, nights);
    }

    return totalPossibleNights > 0
      ? Math.round((totalOccupiedNights / totalPossibleNights) * 10000) / 100
      : 0;
  }

  static async getRevenueByPeriod(
    establishmentId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    await connectDB();

    const dateFormat =
      groupBy === 'day'
        ? '%Y-%m-%d'
        : groupBy === 'week'
          ? '%Y-W%U'
          : '%Y-%m';

    const result = await InvoiceModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          issuedAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['paid', 'partial'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$issuedAt' } },
          revenue: { $sum: { $subtract: ['$total', '$balance'] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item) => ({
      period: item._id,
      revenue: item.revenue,
      count: item.count,
    }));
  }

  static async getExpensesByCategory(
    establishmentId: string,
    startDate: Date,
    endDate: Date
  ) {
    await connectDB();

    const result = await ExpenseModel.aggregate([
      {
        $match: {
          establishmentId: toObjectId(establishmentId),
          date: { $gte: startDate, $lte: endDate },
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return result.map((item) => ({
      category: item._id,
      amount: item.total,
      count: item.count,
    }));
  }
}

export default AnalyticsService;
