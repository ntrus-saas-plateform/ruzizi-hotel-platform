import { PipelineStage } from 'mongoose';
import { EmployeeModel } from '@/models/Employee.model';
import { AttendanceModel } from '@/models/Attendance.model';
import { PayrollModel } from '@/models/Payroll.model';
import { LeaveModel } from '@/models/Leave.model';
import Performance from '@/models/Performance.model';
import { dbConnect } from '@/lib/db';

class HRAnalyticsService {
  // KPIs RH globaux
  async getHRKPIs(establishmentId?: string) {
    try {
      await dbConnect();

      const query: any = {};
      if (establishmentId) query.establishmentId = establishmentId;

      // Effectif total et actif
      const totalEmployees = await EmployeeModel.countDocuments(query);
      const activeEmployees = await EmployeeModel.countDocuments({
        ...query,
        status: 'active',
      });

      // Taux de présence du mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const attendanceStats = await AttendanceModel.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth },
            ...(establishmentId && { establishmentId }),
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: { $cond: [{ $ne: ['$checkIn', null] }, 1, 0] },
            },
          },
        },
      ] as PipelineStage[]);

      const attendanceRate =
        attendanceStats.length > 0
          ? (attendanceStats[0].presentDays / attendanceStats[0].totalDays) * 100
          : 0;

      // Coût salarial du mois
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const payrollCost = await PayrollModel.aggregate([
        {
          $match: {
            month: currentMonth,
            ...(establishmentId && { establishmentId }),
          },
        },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$netSalary' },
          },
        },
      ] as PipelineStage[]);

      const totalPayrollCost = payrollCost.length > 0 ? payrollCost[0].totalCost : 0;

      // Congés en attente
      const pendingLeaves = await LeaveModel.countDocuments({
        status: 'pending',
        ...(establishmentId && { establishmentId }),
      });

      // Performance moyenne
      const performanceStats = await Performance.aggregate([
        {
          $match: {
            status: 'submitted',
            ...(establishmentId && { establishmentId }),
          },
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$overallScore' },
          },
        },
      ] as PipelineStage[]);

      const averagePerformance =
        performanceStats.length > 0 ? performanceStats[0].averageScore : 0;

      return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        attendanceRate: Number(attendanceRate.toFixed(2)),
        totalPayrollCost,
        pendingLeaves,
        averagePerformance: Number(averagePerformance.toFixed(2)),
      };
    } catch (error) {
      console.error('Erreur lors du calcul des KPIs RH:', error);
      throw error;
    }
  }

  // Analyse des coûts salariaux
  async getSalaryCostAnalysis(establishmentId?: string, months: number = 6) {
    try {
      await dbConnect();

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const query: any = { month: { $gte: startDate } };
      if (establishmentId) query.establishmentId = establishmentId;

      const costByMonth = await PayrollModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$month' },
              month: { $month: '$month' },
            },
            totalGross: { $sum: '$grossSalary' },
            totalNet: { $sum: '$netSalary' },
            totalDeductions: { $sum: '$totalDeductions' },
            employeeCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ] as PipelineStage[]);

      // Coût par établissement
      const costByEstablishment = await PayrollModel.aggregate([
        { $match: { month: { $gte: startDate } } },
        {
          $group: {
            _id: '$establishmentId',
            totalCost: { $sum: '$netSalary' },
            employeeCount: { $addToSet: '$employeeId' },
          },
        },
        {
          $lookup: {
            from: 'establishments',
            localField: '_id',
            foreignField: '_id',
            as: 'establishment',
          },
        },
        { $unwind: '$establishment' },
        {
          $project: {
            establishmentName: '$establishment.name',
            totalCost: 1,
            employeeCount: { $size: '$employeeCount' },
            averageCost: { $divide: ['$totalCost', { $size: '$employeeCount' }] },
          },
        },
      ] as PipelineStage[]);

      return {
        costByMonth,
        costByEstablishment,
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des coûts:', error);
      throw error;
    }
  }

  // Analyse du turnover
  async getTurnoverAnalysis(establishmentId?: string, months: number = 12) {
    try {
      await dbConnect();

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const query: any = {};
      if (establishmentId) query.establishmentId = establishmentId;

      // Employés embauchés
      const hired = await EmployeeModel.countDocuments({
        ...query,
        hireDate: { $gte: startDate },
      });

      // Employés partis
      const left = await EmployeeModel.countDocuments({
        ...query,
        status: 'terminated',
        'employment.endDate': { $gte: startDate },
      });

      // Effectif moyen
      const averageHeadcount = await EmployeeModel.countDocuments(query);

      // Taux de turnover
      const turnoverRate =
        averageHeadcount > 0 ? ((hired + left) / (2 * averageHeadcount)) * 100 : 0;

      // Turnover par mois
      const turnoverByMonth = await EmployeeModel.aggregate([
        {
          $match: {
            ...query,
            $or: [
              { hireDate: { $gte: startDate } },
              { 'employment.endDate': { $gte: startDate } },
            ],
          },
        },
        {
          $project: {
            month: {
              $cond: [
                { $gte: ['$hireDate', startDate] },
                { $month: '$hireDate' },
                { $month: '$employment.endDate' },
              ],
            },
            year: {
              $cond: [
                { $gte: ['$hireDate', startDate] },
                { $year: '$hireDate' },
                { $year: '$employment.endDate' },
              ],
            },
            type: {
              $cond: [{ $gte: ['$hireDate', startDate] }, 'hired', 'left'],
            },
          },
        },
        {
          $group: {
            _id: { year: '$year', month: '$month', type: '$type' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ] as PipelineStage[]);

      return {
        hired,
        left,
        averageHeadcount,
        turnoverRate: Number(turnoverRate.toFixed(2)),
        turnoverByMonth,
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse du turnover:', error);
      throw error;
    }
  }

  // Analyse des absences
  async getAbsenceAnalysis(establishmentId?: string, months: number = 3) {
    try {
      await dbConnect();

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const query: any = { startDate: { $gte: startDate } };
      if (establishmentId) query.establishmentId = establishmentId;

      // Absences par type
      const absencesByType = await LeaveModel.aggregate([
        { $match: { ...query, status: 'approved' } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDays: { $sum: '$workingDays' },
          },
        },
      ] as PipelineStage[]);

      // Taux d'absentéisme
      const totalWorkingDays = months * 30 * (await EmployeeModel.countDocuments());
      const totalAbsenceDays = absencesByType.reduce(
        (sum, item) => sum + item.totalDays,
        0
      );
      const absenteeismRate =
        totalWorkingDays > 0 ? (totalAbsenceDays / totalWorkingDays) * 100 : 0;

      // Top employés absents
      const topAbsentEmployees = await LeaveModel.aggregate([
        { $match: { ...query, status: 'approved' } },
        {
          $group: {
            _id: '$employeeId',
            totalDays: { $sum: '$workingDays' },
            leaveCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: '$employee' },
        {
          $project: {
            employeeName: {
              $concat: ['$EmployeeModel.firstName', ' ', '$EmployeeModel.lastName'],
            },
            totalDays: 1,
            leaveCount: 1,
          },
        },
        { $sort: { totalDays: -1 } },
        { $limit: 10 },
      ] as PipelineStage[]);

      return {
        absencesByType,
        absenteeismRate: Number(absenteeismRate.toFixed(2)),
        topAbsentEmployees,
        totalAbsenceDays,
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des absences:', error);
      throw error;
    }
  }

  // Analyse de la performance
  async getPerformanceAnalysis(establishmentId?: string) {
    try {
      await dbConnect();

      const query: any = { status: 'submitted' };
      if (establishmentId) query.establishmentId = establishmentId;

      // Distribution des scores
      const scoreDistribution = await Performance.aggregate([
        { $match: query },
        {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [1, 2, 3, 4, 5, 6],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              employees: { $push: '$employeeId' },
            },
          },
        },
      ] as PipelineStage[]);

      // Performance par catégorie
      const performanceByCategory = await Performance.aggregate([
        { $match: query },
        { $unwind: '$criteria' },
        {
          $group: {
            _id: '$criteria.category',
            averageScore: { $avg: '$criteria.score' },
            count: { $sum: 1 },
          },
        },
      ] as PipelineStage[]);

      // Tendance de performance
      const performanceTrend = await Performance.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$period.startDate' },
              quarter: { $ceil: { $divide: [{ $month: '$period.startDate' }, 3] } },
            },
            averageScore: { $avg: '$overallScore' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.quarter': 1 } },
      ] as PipelineStage[]);

      // Top performers
      const topPerformers = await Performance.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$employeeId',
            averageScore: { $avg: '$overallScore' },
            evaluationCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: '$employee' },
        {
          $project: {
            employeeName: {
              $concat: ['$EmployeeModel.firstName', ' ', '$EmployeeModel.lastName'],
            },
            position: '$EmployeeModel.position',
            averageScore: 1,
            evaluationCount: 1,
          },
        },
        { $sort: { averageScore: -1 } },
        { $limit: 10 },
      ] as PipelineStage[]);

      return {
        scoreDistribution,
        performanceByCategory,
        performanceTrend,
        topPerformers,
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de performance:', error);
      throw error;
    }
  }

  // Rapport RH complet
  async getComprehensiveHRReport(establishmentId?: string) {
    try {
      const [kpis, salaryCost, turnover, absence, performance] = await Promise.all([
        this.getHRKPIs(establishmentId),
        this.getSalaryCostAnalysis(establishmentId),
        this.getTurnoverAnalysis(establishmentId),
        this.getAbsenceAnalysis(establishmentId),
        this.getPerformanceAnalysis(establishmentId),
      ]);

      return {
        kpis,
        salaryCost,
        turnover,
        absence,
        performance,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport RH:', error);
      throw error;
    }
  }
}

export default new HRAnalyticsService();
