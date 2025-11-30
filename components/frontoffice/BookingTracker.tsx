'use client';

import { ClipboardCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BookingTrackerProps {
  onSearch?: (code: string) => void;
}

interface BookingInfo {
  id: string;
  code: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  establishmentName: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  numberOfGuests: number;
  totalAmount?: number;
  specialRequests?: string;
}

export default function BookingTracker({ onSearch }: BookingTrackerProps) {
  const [language, setLanguage] = useState('fr');
  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Suivre ma Réservation",
      subtitle: "Vérifiez le statut de votre réservation",
      description: "Entrez votre code de réservation pour consulter les détails et le statut de votre séjour.",
      codeLabel: "Code de réservation",
      codePlaceholder: "RZ-2024-001234",
      searchButton: "Rechercher",
      searching: "Recherche en cours...",
      notFound: "Réservation non trouvée",
      notFoundDesc: "Vérifiez votre code de réservation et réessayez",
      bookingDetails: "Détails de la réservation",
      status: "Statut",
      establishment: "Établissement",
      dates: "Dates de séjour",
      guests: "Nombre d'invités",
      totalAmount: "Montant total",
      specialRequests: "Demandes spéciales",
      contactSupport: "Contacter le support",
      statuses: {
        pending: "En attente",
        confirmed: "Confirmée",
        'checked-in': "Arrivé(e)",
        'checked-out': "Parti(e)",
        cancelled: "Annulée"
      },
      statusColors: {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-green-100 text-green-800",
        'checked-in': "bg-blue-100 text-blue-800",
        'checked-out': "bg-gray-100 text-gray-800",
        cancelled: "bg-red-100 text-red-800"
      }
    },
    en: {
      title: "Track My Booking",
      subtitle: "Check your reservation status",
      description: "Enter your booking code to view details and status of your stay.",
      codeLabel: "Booking code",
      codePlaceholder: "RZ-2024-001234",
      searchButton: "Search",
      searching: "Searching...",
      notFound: "Booking not found",
      notFoundDesc: "Check your booking code and try again",
      bookingDetails: "Booking details",
      status: "Status",
      establishment: "Establishment",
      dates: "Stay dates",
      guests: "Number of guests",
      totalAmount: "Total amount",
      specialRequests: "Special requests",
      contactSupport: "Contact support",
      statuses: {
        pending: "Pending",
        confirmed: "Confirmed",
        'checked-in': "Checked in",
        'checked-out': "Checked out",
        cancelled: "Cancelled"
      },
      statusColors: {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-green-100 text-green-800",
        'checked-in': "bg-blue-100 text-blue-800",
        'checked-out': "bg-gray-100 text-gray-800",
        cancelled: "bg-red-100 text-red-800"
      }
    }
  };

  const t = content[language as keyof typeof content];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingCode.trim()) {
      setError('Veuillez entrer un code de réservation');
      return;
    }

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données de test
      const mockBooking: BookingInfo = {
        id: '1',
        code: bookingCode.toUpperCase(),
        status: 'confirmed',
        establishmentName: 'Ruzizi Hôtel Bujumbura',
        checkInDate: '2024-12-15',
        checkOutDate: '2024-12-18',
        guestName: 'Jean Dupont',
        numberOfGuests: 2,
        totalAmount: 450000,
        specialRequests: 'Chambre avec vue sur le lac'
      };

      setBooking(mockBooking);
      
      if (onSearch) {
        onSearch(bookingCode);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'BIF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-luxury text-luxury-cream rounded-full mb-6 shadow-lg">
          <ClipboardCheck />
        </div> */}
        <h1 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h1>
        <p className="text-xl text-luxury-text mb-2">{t.subtitle}</p>
        <p className="text-luxury-text">{t.description}</p>
      </div>

      {/* Search Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-luxury p-8 mb-8">
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-luxury-text mb-3">
              {t.codeLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                placeholder={t.codePlaceholder}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 transition-all duration-200 bg-white shadow-sm text-lg font-mono"
                required
              />
              <ClipboardCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-2xl  disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center space-x-3 transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t.searching}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{t.searchButton}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-700 font-medium">{t.notFound}</p>
              <p className="text-red-600 text-sm">{t.notFoundDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details */}
      {booking && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card-luxury border border-luxury-gold-light p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-luxury-dark">{t.bookingDetails}</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${t.statusColors[booking.status]}`}>
              {t.statuses[booking.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                  Code de réservation
                </h3>
                <p className="text-2xl font-mono font-bold text-luxury-gold">{booking.code}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                  {t.establishment}
                </h3>
                <p className="text-lg font-semibold text-luxury-dark">{booking.establishmentName}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                  Client principal
                </h3>
                <p className="text-lg font-semibold text-luxury-dark">{booking.guestName}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                  {t.guests}
                </h3>
                <p className="text-lg font-semibold text-luxury-dark">
                  {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'personne' : 'personnes'}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                  {t.dates}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-luxury-dark">
                    <svg className="w-4 h-4 mr-2 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Arrivée: {formatDate(booking.checkInDate)}</span>
                  </div>
                  <div className="flex items-center text-luxury-dark">
                    <svg className="w-4 h-4 mr-2 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Départ: {formatDate(booking.checkOutDate)}</span>
                  </div>
                </div>
              </div>

              {booking.totalAmount && (
                <div>
                  <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                    {t.totalAmount}
                  </h3>
                  <p className="text-2xl font-bold text-luxury-gold">{formatAmount(booking.totalAmount)}</p>
                </div>
              )}

              {booking.specialRequests && (
                <div>
                  <h3 className="text-sm font-semibold text-luxury-text uppercase tracking-wide mb-2">
                    {t.specialRequests}
                  </h3>
                  <p className="text-luxury-text bg-luxury-cream p-3 rounded-xl">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <p className="text-luxury-text">Besoin d'aide avec votre réservation ?</p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="tel:+25769657554"
                  className="px-6 py-3 bg-luxury-gold text-luxury-cream rounded-2xl transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Appeler</span>
                </a>
                <a
                  href="mailto:contact@ruzizihotel.com"
                  className="px-6 py-3 border-2 border-luxury-gold text-luxury-gold rounded-xl transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}