'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import SafeRender from '@/components/SafeRender';

export default function ReportsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reportType, setReportType] = useState<'financial' | 'occupancy' | 'hr' | 'comparison'>('financial');
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/backoffice/login');
      return;
    }
    
    fetchEstablishments();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [user, isLoading, router]);

  const fetchEstablishments = async () => {
    try {
      const response = await apiClient.get('/api/establishments?limit=100') as any;
      if (response.success) {
        setEstablishments(response.data?.data || []);
        if (response.data?.data.length > 0) {
          const firstEst = response.data.data[0];
          const establishment = firstEst.establishment || firstEst;
          setSelectedEstablishment(establishment.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async () => {
    if (!selectedEstablishment && reportType !== 'comparison') {
      alert('Veuillez sélectionner un établissement');
      return;
    }

    if (reportType === 'comparison' && selectedEstablishments.length === 0) {
      alert('Veuillez sélectionner au moins un établissement');
      return;
    }

    setLoading(true);
    try {
      let url = '';
      switch (reportType) {
        case 'financial':
          url = `/api/reports/financial?establishmentId=${selectedEstablishment}&startDate=${startDate}&endDate=${endDate}`;
          break;
        case 'occupancy':
          url = `/api/reports/occupancy?establishmentId=${selectedEstablishment}&startDate=${startDate}&endDate=${endDate}`;
          break;
        case 'hr':
          url = `/api/reports/hr?establishmentId=${selectedEstablishment}&year=${year}&month=${month}`;
          break;
        case 'comparison':
          url = `/api/reports/comparison?establishmentIds=${selectedEstablishments.join(',')}&startDate=${startDate}&endDate=${endDate}`;
          break;
      }

      const response = await apiClient.get(url) as any;
      if (response.success) {
        setReport(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstablishment = (id: string) => {
    setSelectedEstablishments((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const reportTypeIcons = {
    financial: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    occupancy: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    hr: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    comparison: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  };

  // Helper function pour logger les objets potentiellement problématiques
  const logObjectIfNeeded = (value: any, context: string) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`🔍 Object found in ${context}:`, value);
      console.trace(`📍 Stack trace for ${context}`);
      return String(value);
    }
    return value;
  };

  // Wrapper global pour logger tous les rendus
  const safeRender = (value: any, context: string) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.error(`🚨 CRITICAL: Object being rendered in ${context}:`, value);
      console.trace(`📍 Stack trace for ${context}`);
      return `[Object: ${JSON.stringify(value)}]`;
    }
    return value;
  };

  return (
    <SafeRender context="reports-page">
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-luxury-dark mb-2">
            Rapports
          </h1>
          <p className="text-luxury-text">Générer et consulter les rapports détaillés</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(['financial', 'occupancy', 'hr', 'comparison'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                reportType === type
                  ? 'bg-gradient-luxury border-luxury-gold text-luxury-cream shadow-xl'
                  : 'bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:border-[hsl(var(--color-luxury-gold))]'
              }`}
            >
              <svg className={`w-8 h-8 mx-auto mb-3 ${reportType === type ? 'text-luxury-cream' : 'text-luxury-gold'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {reportTypeIcons[type]}
              </svg>
              <p className="font-semibold text-center">
                {type === 'financial' && 'Financier'}
                {type === 'occupancy' && 'Occupation'}
                {type === 'hr' && 'RH'}
                {type === 'comparison' && 'Comparaison'}
              </p>
            </button>
          ))}
        </div>

        {/* Configuration */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-luxury-dark flex items-center">
              <svg className="w-6 h-6 mr-3 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Configuration du rapport
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
            >
              {showFilters ? 'Masquer' : 'Afficher'}
            </button>
          </div>

          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
            {reportType !== 'comparison' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Établissement</label>
                <select
                  value={selectedEstablishment}
                  onChange={(e) => setSelectedEstablishment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                >
                  {establishments.map((est) => {
                    const establishment = est.establishment || est;
                    const safeName = safeRender(establishment.name, 'establishment.name');
                    return (
                      <option key={establishment.id} value={establishment.id}>
                        {safeName || 'Établissement sans nom'}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {reportType === 'comparison' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sélectionner les établissements à comparer
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
                  {establishments.map((est) => {
                    const establishment = est.establishment || est;
                    const safeName = safeRender(establishment.name, 'establishment.checkbox.name');
                    return (
                      <label key={establishment.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-green-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEstablishments.includes(establishment.id)}
                          onChange={() => toggleEstablishment(establishment.id)}
                          className="w-5 h-5 text-luxury-gold border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {safeName || 'Établissement sans nom'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {reportType === 'hr' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Année</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Mois</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 bg-luxury-gold text-luxury-cream rounded-xl  disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Génération en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Générer le rapport
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 md:p-8">
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-luxury-dark mb-2">
  {safeRender(report.title, 'report.title') || 'Rapport généré'}
</h2>
              <p className="text-sm text-luxury-text flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            {report.summary && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-luxury-dark mb-6">Résumé</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.summary).map(([key, value]) => {
                    const safeValue = safeRender(value, `summary.${key}`);
                    return (
                    <div key={key} className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200">
                      <p className="text-sm text-luxury-text capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-luxury-dark">
                        {typeof safeValue === 'number'
                          ? key.includes('rate') || key.includes('margin')
                            ? `${safeValue.toFixed(2)}%`
                            : key.includes('revenue') || key.includes('expense') || key.includes('profit') || key.includes('salary')
                              ? `${safeValue.toLocaleString()} BIF`
                              : safeValue
                          : String(safeValue)}
                      </p>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {report.details && (
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-luxury-dark">Détails</h3>
                
                {report.details.expensesByCategory && (
                  <div>
                    <h4 className="text-lg font-semibold text-luxury-dark mb-4">Dépenses par catégorie</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Catégorie</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Montant</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Nombre</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.details.expensesByCategory.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-green-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-luxury-dark">{item.category}</td>
                              <td className="px-6 py-4 text-sm text-luxury-dark">{item.amount.toLocaleString()} BIF</td>
                              <td className="px-6 py-4 text-sm text-luxury-dark">{item.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {report.details.topAccommodations && (
                  <div>
                    <h4 className="text-lg font-semibold text-luxury-dark mb-4">Top 10 Hébergements</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Nom</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Réservations</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Revenu</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.details.topAccommodations.map((item: any, idx: number) => {
                            const accommodation = item.accommodation || item;
                            return (
                              <tr key={idx} className="hover:bg-green-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-luxury-dark">
                                  {accommodation.name || item.name || 'Hébergement sans nom'}
                                </td>
                                <td className="px-6 py-4 text-sm text-luxury-dark">
                                  {accommodation.type || item.type || 'Non spécifié'}
                                </td>
                                <td className="px-6 py-4 text-sm text-luxury-dark">
                                  {item.bookings || 0}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-luxury-gold">
                                  {(item.revenue || 0).toLocaleString()} BIF
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {report.establishments && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-luxury-dark mb-6">Comparaison des Établissements</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Établissement</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Revenu</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Dépenses</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Profit Net</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Marge</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Occupation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.establishments.map((est: any, idx: number) => {
                        const establishment = est.establishment || est;
                        return (
                          <tr key={idx} className="hover:bg-green-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-luxury-dark">
                              {establishment.name || 'Établissement sans nom'}
                            </td>
                            <td className="px-6 py-4 text-sm text-luxury-dark">{est.revenue?.toLocaleString() || 0} BIF</td>
                            <td className="px-6 py-4 text-sm text-luxury-dark">{est.expenses?.toLocaleString() || 0} BIF</td>
                            <td className="px-6 py-4 text-sm font-bold text-luxury-gold">{est.netProfit?.toLocaleString() || 0} BIF</td>
                            <td className="px-6 py-4 text-sm text-luxury-dark">{est.profitMargin?.toFixed(2) || '0.00'}%</td>
                            <td className="px-6 py-4 text-sm text-luxury-dark">{est.occupancyRate?.toFixed(2) || '0.00'}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </SafeRender>
  );
}
