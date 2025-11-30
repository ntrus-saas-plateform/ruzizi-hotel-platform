'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { ClientResponse } from '@/types/client.types';
import type { BookingResponse } from '@/types/booking.types';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientResponse | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchBookings();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch client');
      }

      setClient(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!client) return;

    try {
      const response = await fetch(
        `/api/bookings?clientEmail=${encodeURIComponent(client.personalInfo.email)}&limit=100`
      );
      const data = await response.json();

      if (data.success) {
        setBookings(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="mt-4 text-luxury-text">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/clients')}
            className="mt-4 px-4 py-2 bg-luxury-gold text-luxury-cream rounded-md "
          >
            Retour aux clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/clients')}
            className="text-luxury-gold  mb-2"
          >
            ← Retour aux clients
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-luxury-dark">
                {client.personalInfo.firstName} {client.personalInfo.lastName}
              </h1>
              <p className="text-luxury-text mt-2">Profil client</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getClassificationColor(client.classification)}`}
            >
              {getClassificationLabel(client.classification)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-luxury-dark mb-4">
                Informations personnelles
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-luxury-text">Email</span>
                  <p className="font-medium">{client.personalInfo.email}</p>
                </div>
                <div>
                  <span className="text-sm text-luxury-text">Téléphone</span>
                  <p className="font-medium">{client.personalInfo.phone}</p>
                </div>
                {client.personalInfo.idNumber && (
                  <div>
                    <span className="text-sm text-luxury-text">Numéro d'identité</span>
                    <p className="font-medium">{client.personalInfo.idNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-luxury-dark mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-luxury-text">Total séjours</p>
                  <p className="text-2xl font-bold text-luxury-gold">{client.totalStays}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-luxury-text">Total dépensé</p>
                  <p className="text-2xl font-bold text-green-600">
                    {client.totalSpent.toLocaleString()} BIF
                  </p>
                </div>
                {client.debt > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-luxury-text">Dette</p>
                    <p className="text-2xl font-bold text-red-600">
                      {client.debt.toLocaleString()} BIF
                    </p>
                  </div>
                )}
                {client.discounts && client.discounts.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-luxury-text">Remises actives</p>
                    <p className="text-2xl font-bold text-purple-600">{client.discounts.length}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-luxury-dark mb-4">Historique des réservations</h2>
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune réservation trouvée</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-luxury-dark">{booking.bookingCode}</p>
                          <p className="text-sm text-luxury-text">
                            {new Date(booking.checkIn).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-luxury-text">
                          {booking.bookingType === 'online'
                            ? 'En ligne'
                            : booking.bookingType === 'onsite'
                              ? 'Sur place'
                              : 'Passage'}
                        </span>
                        <span className="font-semibold text-luxury-dark">
                          {booking.pricingDetails.total.toLocaleString()} BIF
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
