'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EstablishmentResponse } from '@/types/establishment.types';
import type { AccommodationResponse } from '@/types/accommodation.types';

export default function EstablishmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [establishment, setEstablishment] = useState<EstablishmentResponse | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch establishment
      const estResponse = await fetch(`/api/public/establishments/${params.id}`);
      const estData = await estResponse.json();

      if (!estResponse.ok) {
        throw new Error(estData.error?.message || 'Failed to fetch establishment');
      }

      setEstablishment(estData.data);

      // Fetch accommodations
      const accResponse = await fetch(
        `/api/public/accommodations?establishmentId=${params.id}&limit=100`
      );
      const accData = await accResponse.json();

      if (accResponse.ok) {
        setAccommodations(accData.data.data);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Établissement non trouvé'}</p>
          <button
            onClick={() => router.push('/establishments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour aux établissements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/establishments')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Retour aux établissements
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Establishment Info */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Images */}
          <div className="h-96 bg-gray-200">
            {establishment.images[0] ? (
              <img
                src={establishment.images[0]}
                alt={establishment.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{establishment.name}</h1>

            <div className="flex items-center text-gray-600 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {establishment.location.city} - {establishment.location.address}
            </div>

            <p className="text-gray-700 mb-6">{establishment.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Mode de tarification</p>
                <p className="text-lg font-semibold text-gray-900">
                  {establishment.pricingMode === 'nightly' ? 'Par nuitée' : 'Par mois'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Capacité totale</p>
                <p className="text-lg font-semibold text-gray-900">
                  {establishment.totalCapacity} places
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Contact</p>
                <p className="text-lg font-semibold text-gray-900">{establishment.contacts.phone[0]}</p>
              </div>
            </div>

            {establishment.services.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Services disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {establishment.services.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accommodations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hébergements disponibles</h2>

          {accommodations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Aucun hébergement disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((accommodation) => (
                <div
                  key={accommodation.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-200">
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
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{accommodation.name}</h3>

                    <p className="text-sm text-gray-600 mb-4">{getTypeLabel(accommodation.type)}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prix</span>
                        <span className="font-semibold text-gray-900">
                          {accommodation.pricing.basePrice.toLocaleString()} BIF
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Capacité</span>
                        <span className="font-semibold text-gray-900">
                          {accommodation.capacity.maxGuests} personnes
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Chambres</span>
                        <span className="font-semibold text-gray-900">
                          {accommodation.capacity.bedrooms}
                        </span>
                      </div>
                    </div>

                    {accommodation.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Équipements</p>
                        <div className="flex flex-wrap gap-1">
                          {accommodation.amenities.slice(0, 4).map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                          {accommodation.amenities.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{accommodation.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => router.push(`/booking?accommodation=${accommodation.id}`)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
