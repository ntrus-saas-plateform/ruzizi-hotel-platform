'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface OccupancyStats {
  totalAccommodations: number;
  totalDays: number;
  totalPossibleNights: number;
  totalOccupiedNights: number;
  occupancyRate: number;
  occupancyByType: Array<{
    type: string;
    count: number;
    occupancyRate: number;
  }>;
  startDate: string;
  endDate: string;
}

export default function DashboardPage() {
  const [occupancyStats, setOccupancyStats] = useState<OccupancyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchOccupancyStats();
  }, [dateRange]);

  const fetchOccupancyStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const data = await apiClient.get(`/api/bookings/occupancy?${params}`) as any;
      setOccupancyStats(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'standard_room':
        return 'Chambre Standard';
      case 'suite':
        return 'Suite';
      case 'house':
        return 'Maison';
      case 'apartment':
        return 'Appartement';
      default:
        return type;
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-luxury-dark">Tableau de Bord</h1>
          <p className="text-luxury-text mt-2 text-sm sm:text-base">Vue d'ensemble des réservations et de l'occupation</p>
        </header>

        {/* Date Range Filter */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6" aria-labelledby="date-range-heading">
          <h2 id="date-range-heading" className="text-base sm:text-lg font-semibold text-luxury-dark mb-4">Période</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="start-date-help"
              />
              <span id="start-date-help" className="sr-only">Sélectionnez la date de début de la période d'analyse</span>
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="end-date-help"
              />
              <span id="end-date-help" className="sr-only">Sélectionnez la date de fin de la période d'analyse</span>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={fetchOccupancyStats}
                className="w-full px-4 py-2.5 bg-luxury-gold text-luxury-cream rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-500/50 touch-manipulation min-h-[44px]"
                aria-label="Actualiser les statistiques d'occupation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="mt-4 text-luxury-text">Chargement des statistiques...</p>
          </div>
        ) : occupancyStats ? (
          <>
            {/* Overall Occupancy Card */}
            <section className="bg-white rounded-lg shadow p-6 mb-6" aria-labelledby="global-occupancy-heading">
              <h2 id="global-occupancy-heading" className="text-lg font-semibold text-luxury-dark mb-4">
                Taux d'Occupation Global
              </h2>
              <div className="text-center">
                <div
                  className={`text-6xl font-bold ${getOccupancyColor(occupancyStats.occupancyRate)}`}
                  aria-label={`Taux d'occupation global: ${occupancyStats.occupancyRate.toFixed(1)} pour cent`}
                >
                  {occupancyStats.occupancyRate.toFixed(1)}%
                </div>
                <p className="text-luxury-text mt-4">
                  {occupancyStats.totalOccupiedNights.toLocaleString()} nuits occupées sur{' '}
                  {occupancyStats.totalPossibleNights.toLocaleString()} possibles
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6" role="list">
                  <div className="bg-gray-50 rounded-lg p-4" role="listitem">
                    <p className="text-sm text-luxury-text">Hébergements</p>
                    <p className="text-2xl font-bold text-luxury-dark">
                      {occupancyStats.totalAccommodations}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4" role="listitem">
                    <p className="text-sm text-luxury-text">Jours</p>
                    <p className="text-2xl font-bold text-luxury-dark">{occupancyStats.totalDays}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4" role="listitem">
                    <p className="text-sm text-luxury-text">Nuits occupées</p>
                    <p className="text-2xl font-bold text-luxury-dark">
                      {occupancyStats.totalOccupiedNights}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Occupancy by Type */}
            <section className="bg-white rounded-lg shadow p-6" aria-labelledby="occupancy-by-type-heading">
              <h2 id="occupancy-by-type-heading" className="text-lg font-semibold text-luxury-dark mb-4">
                Taux d'Occupation par Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
                {occupancyStats.occupancyByType.map((typeStats) => (
                  <div key={typeStats.type} className="bg-gray-50 rounded-lg p-4" role="listitem">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {getTypeLabel(typeStats.type)}
                    </h3>
                    <div
                      className={`text-3xl font-bold ${getOccupancyColor(typeStats.occupancyRate)}`}
                      aria-label={`Taux d'occupation pour ${getTypeLabel(typeStats.type)}: ${typeStats.occupancyRate.toFixed(1)} pour cent`}
                    >
                      {typeStats.occupancyRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-luxury-text mt-2">{typeStats.count} unité(s)</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" aria-labelledby="quick-stats-heading">
              <h2 id="quick-stats-heading" className="sr-only">Statistiques rapides</h2>

              <article className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-luxury-text">Réservations Actives</p>
                    <p className="text-2xl font-bold text-luxury-dark mt-1" aria-label="Nombre de réservations actives">-</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center" aria-hidden="true">
                    <svg
                      className="w-6 h-6 text-luxury-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </article>

              <article className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-luxury-text">Arrivées Aujourd'hui</p>
                    <p className="text-2xl font-bold text-luxury-dark mt-1" aria-label="Nombre d'arrivées aujourd'hui">-</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center" aria-hidden="true">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                </div>
              </article>

              <article className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-luxury-text">Départs Aujourd'hui</p>
                    <p className="text-2xl font-bold text-luxury-dark mt-1" aria-label="Nombre de départs aujourd'hui">-</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center" aria-hidden="true">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      />
                    </svg>
                  </div>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
