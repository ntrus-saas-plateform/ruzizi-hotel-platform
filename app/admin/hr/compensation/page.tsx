'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CompensationPlan {
  id: string;
  employeeId: string;
  employeeName?: string;
  planName: string;
  type: 'salary_increase' | 'bonus' | 'commission' | 'equity' | 'benefits';
  baseSalary: number;
  targetBonus: number;
  totalCompensation: number;
  status: 'active' | 'completed' | 'cancelled';
  effectiveDate: string;
  approvedBy?: string;
}

export default function CompensationPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<CompensationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });

  useEffect(() => {
    fetchCompensationPlans();
  }, [filters]);

  const fetchCompensationPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );
      const response = await fetch(`/api/hr/compensation?${params}`);
      const data = await response.json();
      if (data.success !== false) {
        setPlans(data);
      }
    } catch (err) {
      console.error('Error fetching compensation plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      salary_increase: 'Augmentation salaire',
      bonus: 'Prime',
      commission: 'Commission',
      equity: 'Participation',
      benefits: 'Avantages'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Plans de Rémunération</h1>
            <p className="text-luxury-text mt-2">Gérer les plans de compensation et rémunération</p>
          </div>
          <button
            onClick={() => router.push('/admin/hr/compensation/create')}
            className="px-4 py-2.5 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Plan
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les types</option>
              <option value="salary_increase">Augmentation salaire</option>
              <option value="bonus">Prime</option>
              <option value="commission">Commission</option>
              <option value="equity">Participation</option>
              <option value="benefits">Avantages</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/hr/compensation/analytics')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyses
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun plan de rémunération trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rémunération Totale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date d'effet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-luxury-dark">
                          {plan.employeeName || `Employé ${plan.employeeId.slice(-6)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {plan.planName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getTypeLabel(plan.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {plan.totalCompensation.toLocaleString()} BIF
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}
                        >
                          {plan.status === 'active' ? 'Actif' :
                           plan.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(plan.effectiveDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/hr/compensation/${plan.id}/edit`)}
                            className="text-luxury-gold hover:text-blue-900"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => router.push(`/admin/hr/compensation/${plan.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Détails
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}