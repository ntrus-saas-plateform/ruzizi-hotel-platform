'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AccommodationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accommodation, setAccommodation] = useState<any>(null);

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/accommodations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de chargement');
      }

      setAccommodation(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hébergement ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      router.push('/admin/accommodations');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
      occupied: { label: 'Occupé', color: 'bg-red-100 text-red-800' },
      maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      reserved: { label: 'Réservé', color: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error || 'Hébergement non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{accommodation.name}</h1>
            <p className="text-gray-600 mt-2 capitalize">
              {accommodation.type} - {accommodation.establishmentId?.name || 'N/A'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/accommodations/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations générales</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900 capitalize">{accommodation.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">{getStatusBadge(accommodation.status)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{accommodation.description || 'Aucune description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Capacité</label>
                  <p className="text-gray-900">{accommodation.capacity} personne(s)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prix par nuit</label>
                  <p className="text-gray-900 font-semibold">{accommodation.pricePerNight?.toLocaleString()} BIF</p>
                </div>
              </div>
            </div>
          </div>

          {accommodation.amenities && accommodation.amenities.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Équipements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {accommodation.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center space-x-2 text-gray-700">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{accommodation.capacity}</div>
                <div className="text-sm text-gray-600">Capacité</div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {accommodation.pricePerNight?.toLocaleString()} BIF
                </div>
                <div className="text-sm text-gray-600">Prix par nuit</div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {accommodation.type}
                </div>
                <div className="text-sm text-gray-600">Type</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/admin/bookings?accommodation=${id}`)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Voir les réservations
              </button>

              <button
                onClick={() => router.push(`/admin/bookings/create?accommodation=${id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle réservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
