'use client';

import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (selectedEstablishment) {
      fetchAnalytics();
    }
  }, [selectedEstablishment, dateRange]);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/establishments');
      const result = await response.json();
      if (result.success && result.data.data.length > 0) {
        setEstablishments(result.data.data);
        setSelectedEstablishment(result.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        establishmentId: selectedEstablishment,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await fetch(`/api/analytics/financial?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Financiers</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedEstablishment}
              onChange={(e) => setSelectedEstablishment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Revenu Total</p>
                <p className="text-2xl font-bold text-green-600">{data.revenue.toLocaleString()} BIF</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Dépenses Totales</p>
                <p className="text-2xl font-bold text-red-600">{data.expenses.toLocaleString()} BIF</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Profit Net</p>
                <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.netProfit.toLocaleString()} BIF
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Marge Bénéficiaire</p>
                <p className={`text-2xl font-bold ${data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.profitMargin}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Statistiques Réservations</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold">{data.bookings.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmées:</span>
                    <span className="font-semibold text-green-600">{data.bookings.confirmed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En attente:</span>
                    <span className="font-semibold text-yellow-600">{data.bookings.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminées:</span>
                    <span className="font-semibold text-blue-600">{data.bookings.completed}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Taux d'Occupation</h2>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{data.occupancy}%</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
