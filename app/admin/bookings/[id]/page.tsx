'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { BookingResponse } from '@/types/booking.types';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  // Validate booking ID
  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      router.push('/admin/bookings');
      return;
    }
  }, [bookingId, router]);

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch booking');
      }

      setBooking(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm('Confirmer cette réservation ? Le client sera notifié par email.')) return;

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Échec de la confirmation');
      }

      setActionSuccess('Réservation confirmée avec succès. Le client a été notifié.');
      fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!confirm('Effectuer le check-out pour cette réservation ? Cela marquera la réservation comme terminée.')) return;

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Échec du check-out');
      }

      setActionSuccess('Check-out effectué avec succès. La chambre est maintenant disponible.');
      fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    if (reason === null) return; // User clicked cancel

    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellationReason: reason || 'Annulée par l\'administrateur'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Échec de l\'annulation');
      }

      setActionSuccess('Réservation annulée avec succès');
      fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setActionLoading(false);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'partial':
        return 'Partiellement payé';
      case 'unpaid':
        return 'Non payé';
      default:
        return status;
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

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour aux réservations
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Retour aux réservations
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Réservation {booking.bookingCode}
              </h1>
              <p className="text-gray-600 mt-2">
                Créée le {new Date(booking.createdAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(booking.createdAt).toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                {getPaymentStatusLabel(booking.paymentStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionSuccess}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions disponibles</h2>
          
          {/* Status Info */}
          {booking.status === 'pending' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⏳ En attente de confirmation</strong> - Cette réservation doit être confirmée par un administrateur ou un manager.
              </p>
            </div>
          )}
          
          {booking.status === 'confirmed' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ Confirmée</strong> - Le client peut effectuer son check-in. Vous pouvez effectuer le check-out une fois le séjour terminé.
              </p>
            </div>
          )}
          
          {booking.status === 'cancelled' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>❌ Annulée</strong> - Cette réservation a été annulée et ne peut plus être modifiée.
              </p>
            </div>
          )}
          
          {booking.status === 'completed' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>✓ Terminée</strong> - Le check-out a été effectué. Cette réservation est archivée.
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmer la réservation
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Annuler
                </button>
              </>
            )}
            
            {booking.status === 'confirmed' && (
              <>
                <button
                  onClick={handleCheckout}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Effectuer le check-out
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Annuler
                </button>
              </>
            )}
            
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <button
                onClick={() => router.push(`/admin/bookings/${bookingId}/edit`)}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
            )}
            
            {booking.status === 'cancelled' || booking.status === 'completed' ? (
              <button
                onClick={() => router.push('/admin/bookings')}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à la liste
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Nom complet</span>
                <p className="font-medium">
                  {booking.clientInfo.firstName} {booking.clientInfo.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email</span>
                <p className="font-medium">{booking.clientInfo.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Téléphone</span>
                <p className="font-medium">{booking.clientInfo.phone}</p>
              </div>
              {booking.clientInfo.idNumber && (
                <div>
                  <span className="text-sm text-gray-600">Numéro d'identité</span>
                  <p className="font-medium">{booking.clientInfo.idNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de la Réservation</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Type de réservation</span>
                <p className="font-medium">
                  {booking.bookingType === 'online'
                    ? 'En ligne'
                    : booking.bookingType === 'onsite'
                      ? 'Sur place'
                      : 'Client de passage'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Date d'arrivée</span>
                <p className="font-medium">
                  {new Date(booking.checkIn).toLocaleDateString('fr-FR')}
                  {booking.bookingType === 'walkin' &&
                    ` à ${new Date(booking.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Date de départ</span>
                <p className="font-medium">
                  {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                  {booking.bookingType === 'walkin' &&
                    ` à ${new Date(booking.checkOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Nombre de personnes</span>
                <p className="font-medium">{booking.numberOfGuests} personne(s)</p>
              </div>
              {booking.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes</span>
                  <p className="font-medium">{booking.notes}</p>
                </div>
              )}
              {booking.status === 'cancelled' && (booking as any).cancellationReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-semibold text-red-800">Raison de l'annulation</span>
                  <p className="text-red-700 mt-1">{(booking as any).cancellationReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarification</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                Prix unitaire (
                {booking.pricingDetails.mode === 'nightly'
                  ? 'par nuit'
                  : booking.pricingDetails.mode === 'monthly'
                    ? 'par mois'
                    : 'par heure'}
                )
              </span>
              <span className="font-medium">
                {booking.pricingDetails.unitPrice.toLocaleString()} BIF
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">
                Quantité ({booking.pricingDetails.quantity}{' '}
                {booking.pricingDetails.mode === 'nightly'
                  ? 'nuit(s)'
                  : booking.pricingDetails.mode === 'monthly'
                    ? 'mois'
                    : 'heure(s)'}
                )
              </span>
              <span className="font-medium">{booking.pricingDetails.quantity}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-medium">
                {booking.pricingDetails.subtotal.toLocaleString()} BIF
              </span>
            </div>
            {booking.pricingDetails.discount && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Remise</span>
                <span className="font-medium text-green-600">
                  -{booking.pricingDetails.discount.toLocaleString()} BIF
                </span>
              </div>
            )}
            {booking.pricingDetails.tax && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Taxes</span>
                <span className="font-medium">
                  {booking.pricingDetails.tax.toLocaleString()} BIF
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">
                  {booking.pricingDetails.total.toLocaleString()} BIF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
