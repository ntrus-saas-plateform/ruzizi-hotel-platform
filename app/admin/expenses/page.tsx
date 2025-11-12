'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ExpenseResponse } from '@/types/expense.types';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    establishmentId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [establishments, setEstablishments] = useState<any[]>([]);

  useEffect(() => {
    fetchEstablishments();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, filters]);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
      });
      const response = await fetch(`/api/expenses?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch expenses');
      setExpenses(data.data.data || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      utilities: 'Services publics',
      maintenance: 'Maintenance',
      supplies: 'Fournitures',
      salaries: 'Salaires',
      marketing: 'Marketing',
      taxes: 'Taxes',
      insurance: 'Assurance',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
            <p className="text-gray-600 mt-2">Suivre toutes les dépenses de la plateforme</p>
          </div>
          <button
            onClick={() => router.push('/expenses/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Nouvelle Dépense
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Recherche..."
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              name="category"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Toutes les catégories</option>
              <option value="utilities">Services publics</option>
              <option value="maintenance">Maintenance</option>
              <option value="supplies">Fournitures</option>
              <option value="salaries">Salaires</option>
              <option value="marketing">Marketing</option>
              <option value="taxes">Taxes</option>
              <option value="insurance">Assurance</option>
              <option value="other">Autre</option>
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune dépense trouvée</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.amount.toLocaleString()} BIF
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}
                        >
                          {expense.status === 'approved'
                            ? 'Approuvé'
                            : expense.status === 'pending'
                              ? 'En attente'
                              : 'Rejeté'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/expenses/${expense.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
