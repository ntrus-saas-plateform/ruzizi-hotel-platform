'use client';

import { useState, useEffect } from 'react';

interface BookingDetailsProps {
  booking: any;
  onClose?: () => void;
}

export default function BookingDetails({ booking, onClose }: BookingDetailsProps) {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      bookingDetails: "Détails de la réservation",
      bookingCode: "Code de réservation",
      status: "Statut",
      accommodation: "Hébergement",
      dates: "Dates de séjour",
      arrival: "Arrivée",
      departure: "Départ",
      duration: "Durée",
      nights: "nuits",
      night: "nuit",
      guests: "Invités",
      mainGuest: "Client principal",
      totalPrice: "Prix total",
      paymentStatus: "Statut du paiement",
      specialRequests: "Demandes spéciales",
      arrivalTime: "Heure d'arrivée",
      establishment: "Établissement",
      location: "Localisation",
      contact: "Contact",
      amenities: "Équipements",
      capacity: "Capacité",
      type: "Type",
      currency: "BIF",
      close: "Fermer",
      print: "Imprimer",
      statusLabels: {
        pending: "En attente",
        confirmed: "Confirmée",
        checked_in: "Arrivé",
        checked_out: "Parti",
        cancelled: "Annulée"
      },
      paymentLabels: {
        unpaid: "Non payé",
        partial: "Partiellement payé",
        paid: "Payé",
        refunded: "Remboursé"
      }
    },
    en: {
      bookingDetails: "Booking Details",
      bookingCode: "Booking Code",
      status: "Status",
      accommodation: "Accommodation",
      dates: "Stay Dates",
      arrival: "Arrival",
      departure: "Departure",
      duration: "Duration",
      nights: "nights",
      night: "night",
      guests: "Guests",
      mainGuest: "Main Guest",
      totalPrice: "Total Price",
      paymentStatus: "Payment Status",
      specialRequests: "Special Requests",
      arrivalTime: "Arrival Time",
      establishment: "Establishment",
      location: "Location",
      contact: "Contact",
      amenities: "Amenities",
      capacity: "Capacity",
      type: "Type",
      currency: "BIF",
      close: "Close",
      print: "Print",
      statusLabels: {
        pending: "Pending",
        confirmed: "Confirmed",
        checked_in: "Checked In",
        checked_out: "Checked Out",
        cancelled: "Cancelled"
      },
      paymentLabels: {
        unpaid: "Unpaid",
        partial: "Partially Paid",
        paid: "Paid",
        refunded: "Refunded"
      }
    }
  };

  const t = content[language as keyof typeof content];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      checked_in: 'bg-green-100 text-green-800 border-green-200',
      checked_out: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      unpaid: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      refunded: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.bookingDetails}</h2>
              <p className="text-blue-100 font-mono text-lg">{booking.bookingCode}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.status}</label>
            <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(booking.status)}`}>
              {t.statusLabels[booking.status as keyof typeof t.statusLabels] || booking.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.paymentStatus}</label>
            <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-semibold border ${getPaymentStatusColor(booking.paymentStatus)}`}>
              {t.paymentLabels[booking.paymentStatus as keyof typeof t.paymentLabels] || booking.paymentStatus}
            </span>
          </div>
        </div>

        {/* Establishment & Accommodation */}
        {booking.establishment && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t.establishment}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{booking.establishment.name}</p>
                {booking.establishment.location && (
                  <p className="text-gray-600 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {booking.establishment.location.city}, {booking.establishment.location.country}
                  </p>
                )}
              </div>
              {booking.establishment.contact && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.contact}:</p>
                  {booking.establishment.contact.phone && (
                    <p className="text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {booking.establishment.contact.phone}
                    </p>
                  )}
                  {booking.establishment.contact.email && (
                    <p className="text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {booking.establishment.contact.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accommodation Details */}
        {booking.accommodation && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              {t.accommodation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{booking.accommodation.name}</p>
                <p className="text-gray-600">{t.type}: {booking.accommodation.type}</p>
                {booking.accommodation.capacity && (
                  <p className="text-gray-600">{t.capacity}: {booking.accommodation.capacity.maxGuests} personnes</p>
                )}
              </div>
              {booking.accommodation.amenities && booking.accommodation.amenities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t.amenities}:</p>
                  <div className="flex flex-wrap gap-1">
                    {booking.accommodation.amenities.slice(0, 6).map((amenity: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {amenity}
                      </span>
                    ))}
                    {booking.accommodation.amenities.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{booking.accommodation.amenities.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t.dates}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.arrival}:</p>
              <p className="font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
              {booking.arrivalTime && (
                <p className="text-sm text-gray-600 mt-1">{t.arrivalTime}: {booking.arrivalTime}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.departure}:</p>
              <p className="font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.duration}:</p>
              <p className="font-semibold text-gray-900">
                {booking.numberOfNights} {booking.numberOfNights === 1 ? t.night : t.nights}
              </p>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t.guests}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.mainGuest}:</p>
              <p className="font-semibold text-gray-900">
                {booking.mainGuest.firstName} {booking.mainGuest.lastName}
              </p>
              <p className="text-gray-600">{booking.mainGuest.email}</p>
              {booking.mainGuest.phone && (
                <p className="text-gray-600">{booking.mainGuest.phone}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Nombre total:</p>
              <p className="font-semibold text-gray-900">
                {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'personne' : 'personnes'}
              </p>
              {booking.guests && (
                <p className="text-gray-600">
                  {booking.guests.adults} adulte{booking.guests.adults > 1 ? 's' : ''}
                  {booking.guests.children > 0 && `, ${booking.guests.children} enfant${booking.guests.children > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {t.specialRequests}
            </h3>
            <p className="text-gray-700 bg-white rounded-lg p-4 border border-yellow-200">
              {booking.specialRequests}
            </p>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {t.totalPrice}
          </h3>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">{t.totalPrice}:</span>
              <span className="text-2xl font-bold text-green-600">
                {booking.totalAmount?.toLocaleString() || '0'} {t.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{t.print}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2"
            >
              <span>{t.close}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}