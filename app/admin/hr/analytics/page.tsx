'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

interface HRKPIs {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  attendanceRate: number;
  totalPayrollCost: number;
  pendingLeaves: number;
  averagePerformance: number;
}

interface PredictiveAlerts {
  alerts: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
  }>;
  totalAlerts: number;
}

export default function HRAnalyticsPage() {
  const [kpis, setKpis] = useState<HRKPIs | null>(null);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [salaryCost, setSalaryCost] = useState<
    | {
        costByMonth: {
          _id: { year: number; month: number };
          totalGross: number;
          totalNet: number;
          totalDeductions: number;
          employeeCount: number;
        }[];
      }
    | null
  >(null);
  const [turnover, setTurnover] = useState<
    | {
        hired: number;
        left: number;
        averageHeadcount: number;
        turnoverRate: number;
        turnoverByMonth: {
          _id: { year: number; month: number; type: 'hired' | 'left' };
          count: number;
        }[];
      }
    | null
  >(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [kpisResponse, alertsResponse, salaryCostResponse, turnoverResponse] = await Promise.all([
        fetch('/api/hr/analytics/kpis'),
        fetch('/api/hr/analytics/predictive?type=alerts'),
        fetch('/api/hr/analytics/salary-cost?months=6'),
        fetch('/api/hr/analytics/turnover?months=6'),
      ]);

      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setPredictiveAlerts(alertsData);
      }

      if (salaryCostResponse.ok) {
        const salaryData = await salaryCostResponse.json();
        setSalaryCost(salaryData);
      }

      if (turnoverResponse.ok) {
        const turnoverData = await turnoverResponse.json();
        setTurnover(turnoverData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  const payrollTrendData = (salaryCost?.costByMonth || []).map((item) => {
    const label = `${monthLabels[item._id.month - 1] ?? item._id.month}/${String(item._id.year).slice(2)}`;
    return {
      month: label,
      cost: item.totalNet,
    };
  });

  const turnoverTrendData = (() => {
    if (!turnover || !turnover.turnoverByMonth) return [];

    const avgHeadcount = turnover.averageHeadcount || 0;
    const grouped: Record<string, { month: string; movements: number; rate: number }> = {};

    for (const entry of turnover.turnoverByMonth) {
      const labelKey = `${entry._id.year}-${entry._id.month}`;
      if (!grouped[labelKey]) {
        grouped[labelKey] = {
          month: `${monthLabels[entry._id.month - 1] ?? entry._id.month}/${String(entry._id.year).slice(2)}`,
          movements: 0,
          rate: 0,
        };
      }
      grouped[labelKey].movements += entry.count;
    }

    // Convert movements to a simple monthly turnover % based on average headcount
    Object.values(grouped).forEach((item) => {
      if (avgHeadcount > 0) {
        item.rate = (item.movements / avgHeadcount) * 100;
      } else {
        item.rate = 0;
      }
    });

    return Object.values(grouped);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="mt-4 text-luxury-text ">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-luxury-dark ">
          Analytics RH
        </h1>
        <p className="text-luxury-text  mt-1">
          Tableau de bord des indicateurs de performance RH
        </p>
      </div>

      {/* Predictive Alerts */}
      {predictiveAlerts && predictiveAlerts.alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-luxury-dark mb-4">Alertes Prédictives</h2>
          <div className="space-y-3">
            {predictiveAlerts.alerts.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'high'
                    ? 'border-red-500 bg-red-50'
                    : alert.severity === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {alert.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white  rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-luxury-text ">Effectif Total</p>
              <p className="text-3xl font-bold text-luxury-dark  mt-2">
                {kpis?.totalEmployees || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {kpis?.activeEmployees || 0} actifs
              </p>
            </div>
            <div className="bg-blue-100  p-3 rounded-full">
              <svg className="w-8 h-8 text-luxury-gold dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-luxury-text ">Taux de Présence</p>
              <p className="text-3xl font-bold text-luxury-dark  mt-2">
                {kpis?.attendanceRate || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Ce mois</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-luxury-text ">Coût Salarial</p>
              <p className="text-3xl font-bold text-luxury-dark  mt-2">
                {(kpis?.totalPayrollCost || 0).toLocaleString()} BIF
              </p>
              <p className="text-sm text-gray-500 mt-1">Ce mois</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-luxury-text ">Performance Moyenne</p>
              <p className="text-3xl font-bold text-luxury-dark  mt-2">
                {kpis?.averagePerformance || 0}/5
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {kpis?.pendingLeaves || 0} congés en attente
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white  rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-luxury-dark  mb-4">
            Évolution des Coûts Salariaux
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${(value / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value === undefined ? ['N/A', 'Coût salarial'] : [`${value.toLocaleString()} BIF`, 'Coût salarial']
                  }
                  labelFormatter={(label) => `Mois : ${label}`}
                />
                <Line type="monotone" dataKey="cost" stroke="#B45309" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-luxury-dark ">Taux de Turnover</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-200 rounded-md bg-gray-50"
            >
              <option value="3">3 derniers mois</option>
              <option value="6">6 derniers mois</option>
              <option value="12">12 derniers mois</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value === undefined ? ['N/A', 'Taux de turnover'] : [`${value.toFixed(1)}%`, 'Taux de turnover']
                  }
                  labelFormatter={(label) => `Mois : ${label}`}
                />
                <Bar dataKey="rate" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {turnover && (
            <p className="mt-3 text-sm text-gray-600">
              Taux de turnover global sur la période :
              <span className="font-semibold text-luxury-dark ml-1">
                {turnover.turnoverRate.toFixed(1)}%
              </span>
            </p>
          )}
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-luxury-dark  mb-4">
            Distribution des Performances
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 ">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>

        <div className="bg-white  rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-luxury-dark  mb-4">
            Analyse des Absences
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 ">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition">
            Analyse Turnover
          </button>
          <button className="px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition">
            Prévision Recrutement
          </button>
          <button className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition">
            Projection Coûts
          </button>
        </div>
        <div className="flex space-x-4">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Exporter en PDF
          </button>
          <button className="px-4 py-2 bg-luxury-gold text-luxury-cream rounded-lg  transition">
            Générer Rapport Complet
          </button>
        </div>
      </div>
    </div>
  );
}
