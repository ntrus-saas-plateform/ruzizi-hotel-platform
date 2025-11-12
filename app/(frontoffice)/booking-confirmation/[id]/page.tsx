'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

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

  const content = {
    fr: {
      loading: "Chargement...",
      notFound: "Réservation non trouvée",
      backHome: "Retour à l'accueil",
      confirmed: "Réservation Confirmée !",
      confirmationDesc: "Votre réservation a été enregistrée avec succès",
      bookingNumber: "Numéro de réservation",
      stayDates: "Dates de séjour",
      arrival: "Arrivée",
      departure: "Départ",
      nights: "nuits",
      night: "nuit",
      guests: "Invités",
      adults: "adultes",
      adult: "adulte",
      children: "enfants",
      child: "enfant",
      mainGuest: "Client principal",
      totalPrice: "Prix total",
      paymentStatus: "Statut du paiement",
      pending: "En attente",
      importantInfo: "Informations importantes",
      print: "Imprimer",
      questions: "Des questions?",
      contactUs: "Contactez-nous au",
      orEmail: "ou par email à",
      infoItems: [
        "Un email de confirmation a été envoyé",
        "Veuillez présenter une pièce d'identité valide lors de votre arrivée",
        "L'heure d'arrivée est à partir de 14h00 et le départ avant 12h00",
        "Pour toute modification ou annulation, contactez-nous"
      ]
    },
    en: {
      loading: "Loading...",
      notFound: "Booking not found",
      backHome: "Back to home",
      confirmed: "Booking Confirmed!",
      confirmationDesc: "Your reservation has been successfully registered",
      bookingNumber: "Booking number",
      stayDates: "Stay dates",
      arrival: "Arrival",
      departure: "Departure",
      nights: "nights",
      night: "night",
      guests: "Guests",
      adults: "adults",
      adult: "adult",
      children: "children",
      child: "child",
      mainGuest: "Main guest",
      totalPrice: "Total price",
      paymentStatus: "Payment status",
      pending: "Pending",
      importantInfo: "Important information",
      print: "Print",
      questions: "Questions?",
      contactUs: "Contact us at",
      orEmail: "or by email at",
      infoItems: [
        "A confirmation email has been sent",
        "Please present valid ID upon arrival",
        "Check-in time is from 2:00 PM and check-out before 12:00 PM",
        "For any modification or cancellation, contact us"
      ]
    }
  };

  const t = content[language as keyof typeof content];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-amber-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg text-gray-600 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.notFound}</h1>
          <p className="text-red-600 mb-6">{error || t.notFound}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            {t.backHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-green-700 to-green-800 bg-clip-text text-transparent mb-4">
            {t.confirmed}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.confirmationDesc}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Confirmation Header */}
          <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mb-6 pb-6 border-b border-white/20">
                <h2 className="text-sm font-medium text-green-100 mb-2">{t.bookingNumber}</h2>
                <p className="text-3xl font-bold text-white font-mono tracking-wider">{booking.bookingNumber}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Dates */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t.stayDates}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">{t.arrival}</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">{t.departure}</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.checkOutDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-amber-700 font-semibold">
                      {booking.numberOfNights} {booking.numberOfNights === 1 ? t.night : t.nights}
                    </p>
                  </div>
                </div>

                {/* Guests */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t.guests}</h3>
                  </div>
                  <p className="text-gray-700 text-lg font-medium mb-3">
                    {booking.guests?.adults || booking.numberOfGuests || 1} {(booking.guests?.adults || booking.numberOfGuests || 1) === 1 ? t.adult : t.adults}
                    {booking.guests?.children > 0 &&
                      `, ${booking.guests.children} ${booking.guests.children === 1 ? t.child : t.children}`}
                  </p>
                  <div className="pt-3 border-t border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 mb-1">{t.mainGuest}</p>
                    <p className="text-gray-900 font-medium">
                      {booking.mainGuest?.firstName || booking.guestName} {booking.mainGuest?.lastName || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Price */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t.totalPrice}</h3>
                  </div>
                  <p className="text-4xl font-bold text-green-600 mb-3">
                    {(booking.pricing?.totalPrice || booking.totalAmount || 0).toLocaleString()} {booking.pricing?.currency || 'BIF'}
                  </p>
                  <div className="pt-3 border-t border-green-200">
                    <p className="text-sm font-semibold text-green-700 mb-1">{t.paymentStatus}</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.paymentStatus === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {booking.paymentStatus === 'pending' ? t.pending : booking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Important Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t.importantInfo}</h3>
                  </div>
                  <ul className="space-y-3">
                    {t.infoItems.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {item}
                          {index === 0 && booking.mainGuest?.email && ` à ${booking.mainGuest.email}`}
                          {index === 3 && ' au +257 69 65 75 54'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-amber-500 hover:text-amber-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>{t.print}</span>
                </button>
                <button
                  onClick={() => router.push('/track-booking')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Suivre ma réservation</span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{t.backHome}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.questions}</h3>
            <p className="text-gray-600 mb-6">Notre équipe est disponible 24h/24 pour vous assister</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <a
                href="tel:+25769657554"
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +257 69 65 75 54
              </a>
              <a
                href="mailto:contact@ruzizihotel.com"
                className="flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@ruzizihotel.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
