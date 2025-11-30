'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
  _id: string;
  bookingCode: string;
  clientInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  status: string;
  pricingDetails: {
    total: number;
  };
  createdAt: string;
}

export default function PendingBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/bookings?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de chargement');
      }

      setBookings(data.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    if (!confirm('Confirmer cette réservation ?')) return;

    try {
      setActionLoading(bookingId);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Erreur:', data);
        throw new Error(data.error?.message || 'Erreur lors de la confirmation');
      }

      alert('Réservation confirmée avec succès!');
      fetchPendingBookings();
    } catch (err) {
      console.error('💥 Exception:', err);
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    if (!confirm('Rejeter cette réservation ?')) return;

    try {
      setActionLoading(bookingId);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rejet');
      }

      fetchPendingBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="mt-4 text-luxury-text">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-luxury-text hover:text-luxury-dark flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-luxury-dark">Réservations en attente</h1>
            <p className="text-luxury-text mt-2">
              {bookings.length} réservation(s) en attente de confirmation
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-luxury-text text-lg font-medium">Aucune réservation en attente</p>
          <p className="text-gray-500 text-sm mt-2">Toutes les réservations ont été traitées</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-luxury-dark">
                      {booking.bookingCode}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      En attente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium text-luxury-dark">
                        {booking.clientInfo.firstName} {booking.clientInfo.lastName}
                      </p>
                      <p className="text-sm text-luxury-text">{booking.clientInfo.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Dates</p>
                      <p className="font-medium text-luxury-dark">
                        {new Date(booking.checkIn).toLocaleDateString('fr-FR')} →{' '}
                        {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-luxury-text">
                        {booking.numberOfGuests} personne(s)
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Montant</p>
                      <p className="font-bold text-luxury-gold text-lg">
                        {booking.pricingDetails.total.toLocaleString()} BIF
                      </p>
                      <p className="text-xs text-gray-500">
                        Créée le {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirm(booking._id);
                      }}
                      disabled={actionLoading === booking._id}
                      className="px-4 py-2 bg-green-600 text-luxury-cream rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmer
                    </button>

                    <button
                      onClick={() => handleReject(booking._id)}
                      disabled={actionLoading === booking._id}
                      className="px-4 py-2 bg-red-600 text-luxury-cream rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rejeter
                    </button>

                    <button
                      onClick={() => router.push(`/admin/bookings/${booking._id}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
