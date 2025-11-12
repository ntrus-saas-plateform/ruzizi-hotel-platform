'use client';

import { useState, useEffect } from 'react';

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

      const response = await fetch(`/api/bookings/occupancy?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch occupancy stats');
      }

      setOccupancyStats(data.data);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble des réservations et de l'occupation</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Période</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchOccupancyStats}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
          </div>
        ) : occupancyStats ? (
          <>
            {/* Overall Occupancy Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Taux d'Occupation Global
              </h2>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getOccupancyColor(occupancyStats.occupancyRate)}`}>
                  {occupancyStats.occupancyRate.toFixed(1)}%
                </div>
                <p className="text-gray-600 mt-4">
                  {occupancyStats.totalOccupiedNights.toLocaleString()} nuits occupées sur{' '}
                  {occupancyStats.totalPossibleNights.toLocaleString()} possibles
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Hébergements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {occupancyStats.totalAccommodations}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Jours</p>
                    <p className="text-2xl font-bold text-gray-900">{occupancyStats.totalDays}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Nuits occupées</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {occupancyStats.totalOccupiedNights}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Occupancy by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Taux d'Occupation par Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {occupancyStats.occupancyByType.map((typeStats) => (
                  <div key={typeStats.type} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {getTypeLabel(typeStats.type)}
                    </h3>
                    <div className={`text-3xl font-bold ${getOccupancyColor(typeStats.occupancyRate)}`}>
                      {typeStats.occupancyRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{typeStats.count} unité(s)</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Réservations Actives</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Arrivées Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
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
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Départs Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
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
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
