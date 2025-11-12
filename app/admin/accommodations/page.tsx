'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import type { AccommodationResponse } from '@/types/accommodation.types';

export default function AccommodationsPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
      <AccommodationsContent />
    </ProtectedRoute>
  );
}

function AccommodationsContent() {
  const router = useRouter();
  const { tokens, user } = useAuth();
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAccommodations();
  }, [searchTerm, typeFilter, statusFilter]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/accommodations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch accommodations');
      }

      setAccommodations(data.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hébergement ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete accommodation');
      }

      fetchAccommodations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete accommodation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Occupé';
      case 'maintenance':
        return 'Maintenance';
      case 'reserved':
        return 'Réservé';
      default:
        return status;
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Hébergements</h1>
            <button
              onClick={() => router.push('/accommodations/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Nouvel hébergement
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="standard_room">Chambre Standard</option>
                  <option value="suite">Suite</option>
                  <option value="house">Maison</option>
                  <option value="apartment">Appartement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  <option value="available">Disponible</option>
                  <option value="occupied">Occupé</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Réservé</option>
                </select>
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
            /* Accommodations List */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun hébergement trouvé</p>
                </div>
              ) : (
                accommodations.map((accommodation) => (
                  <div
                    key={accommodation.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {accommodation.images[0] ? (
                        <img
                          src={accommodation.images[0]}
                          alt={accommodation.name}
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
                          {accommodation.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(accommodation.status)}`}>
                          {getStatusLabel(accommodation.status)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{getTypeLabel(accommodation.type)}</p>

                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-gray-600">
                          {accommodation.pricing.basePrice.toLocaleString()} BIF
                        </span>
                        <span className="text-gray-600">
                          {accommodation.capacity.maxGuests} pers.
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        {accommodation.capacity.bedrooms} ch. • {accommodation.capacity.bathrooms} sdb
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/accommodations/${accommodation.id}`)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => router.push(`/accommodations/${accommodation.id}/edit`)}
                          className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(accommodation.id)}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Supprimer
                        </button>
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
