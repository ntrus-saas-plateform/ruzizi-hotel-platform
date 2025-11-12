'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/public/bookings/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors du chargement');
      }

      setBooking(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
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

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Réservation non trouvée'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header de succès */}
          <div className="bg-green-600 text-white p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Réservation confirmée!</h1>
            <p className="text-green-100">
              Votre réservation a été enregistrée avec succès
            </p>
          </div>

          {/* Détails de la réservation */}
          <div className="p-8">
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Numéro de réservation</h2>
              <p className="text-2xl font-bold text-gray-900">{booking.bookingNumber}</p>
            </div>

            <div className="space-y-6">
              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates de séjour</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Arrivée</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.checkInDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Départ</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.checkOutDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {booking.numberOfNights} {booking.numberOfNights === 1 ? 'nuit' : 'nuits'}
                </p>
              </div>

              {/* Invités */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invités</h3>
                <p className="text-gray-700">
                  {booking.guests.adults} {booking.guests.adults === 1 ? 'adulte' : 'adultes'}
                  {booking.guests.children > 0 &&
                    `, ${booking.guests.children} ${booking.guests.children === 1 ? 'enfant' : 'enfants'}`}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Client principal: {booking.mainGuest.firstName} {booking.mainGuest.lastName}
                </p>
              </div>

              {/* Prix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prix total</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {booking.pricing.totalPrice.toLocaleString()} {booking.pricing.currency}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Statut du paiement:{' '}
                  <span className="font-medium">
                    {booking.paymentStatus === 'pending' ? 'En attente' : booking.paymentStatus}
                  </span>
                </p>
              </div>

              {/* Informations importantes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Informations importantes
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Un email de confirmation a été envoyé à {booking.mainGuest.email}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Veuillez présenter une pièce d'identité valide lors de votre arrivée
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      L'heure d'arrivée est à partir de 14h00 et le départ avant 12h00
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Pour toute modification ou annulation, contactez-nous au +257 69 65 75 54
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimer
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center text-gray-600">
          <p>
            Des questions? Contactez-nous au{' '}
            <a href="tel:+25769657554" className="text-blue-600 hover:underline">
              +257 69 65 75 54
            </a>{' '}
            ou par email à{' '}
            <a href="mailto:contact@ruzizihotel.com" className="text-blue-600 hover:underline">
              contact@ruzizihotel.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
