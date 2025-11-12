'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientResponse } from '@/types/client.types';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    classification: '',
  });

  useEffect(() => {
    fetchClients();
  }, [currentPage, filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== '')),
      });

      const response = await fetch(`/api/clients?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch clients');
      }

      setClients(data.data.data || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClients();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      classification: '',
    });
    setCurrentPage(1);
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'regular':
        return 'bg-blue-100 text-blue-800';
      case 'walkin':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'vip':
        return 'VIP';
      case 'regular':
        return 'Régulier';
      case 'walkin':
        return 'Passage';
      default:
        return classification;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-2">Gérer tous les clients de la plateforme</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Nom, email, téléphone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification
                </label>
                <select
                  name="classification"
                  value={filters.classification}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les classifications</option>
                  <option value="vip">VIP</option>
                  <option value="regular">Régulier</option>
                  <option value="walkin">Passage</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Rechercher
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun client trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Séjours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total dépensé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dette
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.personalInfo.firstName} {client.personalInfo.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.personalInfo.email}</div>
                          <div className="text-sm text-gray-500">{client.personalInfo.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getClassificationColor(client.classification)}`}
                          >
                            {getClassificationLabel(client.classification)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.totalStays}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {client.totalSpent.toLocaleString()} BIF
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${client.debt > 0 ? 'text-red-600' : 'text-green-600'}`}
                          >
                            {client.debt.toLocaleString()} BIF
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => router.push(`/clients/${client.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
