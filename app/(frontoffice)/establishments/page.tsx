'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EstablishmentResponse } from '@/types/establishment.types';

export default function PublicEstablishmentsPage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [pricingModeFilter, setPricingModeFilter] = useState<'nightly' | 'monthly' | ''>('');

  useEffect(() => {
    fetchEstablishments();
  }, [searchTerm, cityFilter, pricingModeFilter]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (cityFilter) params.append('city', cityFilter);
      if (pricingModeFilter) params.append('pricingMode', pricingModeFilter);

      const response = await fetch(`/api/public/establishments?${params.toString()}`);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Ruzizi Hôtel</h1>
          <p className="mt-2 text-gray-600">Découvrez nos établissements au Burundi</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer les établissements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
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
                placeholder="Bujumbura, Gitega..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de tarification
              </label>
              <select
                value={pricingModeFilter}
                onChange={(e) => setPricingModeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="nightly">Par nuitée</option>
                <option value="monthly">Par mois</option>
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
          /* Establishments Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {establishments.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Aucun établissement trouvé</p>
              </div>
            ) : (
              establishments.map((establishment) => (
                <div
                  key={establishment.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/establishments/${establishment.id}`)}
                >
                  {/* Image */}
                  <div className="h-56 bg-gray-200 overflow-hidden">
                    {establishment.images[0] ? (
                      <img
                        src={establishment.images[0]}
                        alt={establishment.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {establishment.name}
                    </h3>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {establishment.location.city}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {establishment.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {establishment.pricingMode === 'nightly' ? 'Par nuitée' : 'Par mois'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {establishment.totalCapacity} places
                      </span>
                    </div>

                    {establishment.services.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {establishment.services.slice(0, 3).map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {service}
                          </span>
                        ))}
                        {establishment.services.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{establishment.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
