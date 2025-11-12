'use client';

import { useState, useEffect } from 'react';

interface HRKPIs {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  attendanceRate: number;
  totalPayrollCost: number;
  pendingLeaves: number;
  averagePerformance: number;
}

export default function HRAnalyticsPage() {
  const [kpis, setKpis] = useState<HRKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6');

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await fetch('/api/hr/analytics/kpis');
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics RH
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Tableau de bord des indicateurs de performance RH
        </p>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Effectif Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {kpis?.totalEmployees || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {kpis?.activeEmployees || 0} actifs
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de Présence</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coût Salarial</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Performance Moyenne</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Évolution des Coûts Salariaux
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Taux de Turnover
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Distribution des Performances
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Analyse des Absences
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Graphique à implémenter avec une bibliothèque de charts
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-4">
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          Exporter en PDF
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Générer Rapport Complet
        </button>
      </div>
    </div>
  );
}
