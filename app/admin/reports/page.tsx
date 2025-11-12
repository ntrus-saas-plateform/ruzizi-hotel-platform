'use client';

import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'financial' | 'occupancy' | 'hr' | 'comparison'>(
    'financial'
  );
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEstablishments();
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/establishments?limit=100');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
        if (data.data.data.length > 0) {
          setSelectedEstablishment(data.data.data[0].id);
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

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600 mt-2">Générer et consulter les rapports</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration du rapport</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de rapport
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="financial">Rapport Financier</option>
                <option value="occupancy">Rapport d'Occupation</option>
                <option value="hr">Rapport RH</option>
                <option value="comparison">Comparaison d'Établissements</option>
              </select>
            </div>

            {reportType !== 'comparison' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Établissement
                </label>
                <select
                  value={selectedEstablishment}
                  onChange={(e) => setSelectedEstablishment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'hr' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                      (y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}
          </div>

          {reportType === 'comparison' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner les établissements à comparer
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {establishments.map((est) => (
                  <label key={est.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedEstablishments.includes(est.id)}
                      onChange={() => toggleEstablishment(est.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{est.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Génération...' : 'Générer le rapport'}
          </button>
        </div>

        {report && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
              </p>
            </div>

            {report.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Résumé</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {typeof value === 'number'
                          ? key.includes('rate') || key.includes('margin')
                            ? `${value.toFixed(2)}%`
                            : key.includes('revenue') ||
                                key.includes('expense') ||
                                key.includes('profit') ||
                                key.includes('salary')
                              ? `$${value.toFixed(2)}`
                              : value
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.details && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Détails</h3>
                
                {report.details.expensesByCategory && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Dépenses par catégorie</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Catégorie
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Montant
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Nombre
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.details.expensesByCategory.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{item.category}</td>
                              <td className="px-4 py-2 text-sm">${item.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm">{item.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {report.details.topAccommodations && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Top 10 Hébergements</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Nom
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Réservations
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Revenu
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.details.topAccommodations.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{item.name}</td>
                              <td className="px-4 py-2 text-sm">{item.type}</td>
                              <td className="px-4 py-2 text-sm">{item.bookings}</td>
                              <td className="px-4 py-2 text-sm">${item.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {report.establishments && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Comparaison</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Établissement
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Revenu
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Dépenses
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Profit Net
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Marge
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Occupation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.establishments.map((est: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm font-medium">{est.name}</td>
                          <td className="px-4 py-2 text-sm">${est.revenue.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm">${est.expenses.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">
                            ${est.netProfit.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm">{est.profitMargin.toFixed(2)}%</td>
                          <td className="px-4 py-2 text-sm">{est.occupancyRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
