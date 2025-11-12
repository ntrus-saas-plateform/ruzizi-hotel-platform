'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import type { EstablishmentResponse } from '@/types/establishment.types';

export default function EstablishmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
      <EstablishmentsContent />
    </ProtectedRoute>
  );
}

function EstablishmentsContent() {
  const router = useRouter();
  const { tokens, user } = useAuth();
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    fetchEstablishments();
  }, [searchTerm, cityFilter]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (cityFilter) params.append('city', cityFilter);

      const response = await fetch(`/api/establishments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch establishments');
      }

      setEstablishments(data.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/establishments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete establishment');
      }

      fetchEstablishments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete establishment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Établissements</h1>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => router.push('/establishments/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Nouvel établissement
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Filtrer par ville"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            /* Establishments List */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishments.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun établissement trouvé</p>
                </div>
              ) : (
                establishments.map((establishment) => (
                  <div
                    key={establishment.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {establishment.images[0] ? (
                        <img
                          src={establishment.images[0]}
                          alt={establishment.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Pas d'image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {establishment.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            establishment.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {establishment.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{establishment.location.city}</p>

                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {establishment.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Mode: {establishment.pricingMode === 'nightly' ? 'Nuitée' : 'Mensuel'}
                        </span>
                        <span className="text-gray-600">
                          Capacité: {establishment.totalCapacity}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => router.push(`/establishments/${establishment.id}`)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Voir
                        </button>
                        {user?.role === 'super_admin' && (
                          <>
                            <button
                              onClick={() =>
                                router.push(`/establishments/${establishment.id}/edit`)
                              }
                              className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(establishment.id)}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
