'use client';

import { useState, useEffect } from 'react';
import type { AccommodationResponse } from '@/types/accommodation.types';
import type { CompleteClientInfo } from '@/types/guest.types';
import { Users } from 'lucide-react';

interface BookingSummaryProps {
  accommodation: AccommodationResponse;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfGuests: number;
  mainClient: CompleteClientInfo;
  totalAmount: number;
  specialRequests?: string;
  arrivalTime?: string;
}

export default function BookingSummary({
  accommodation,
  checkInDate,
  checkOutDate,
  numberOfNights,
  numberOfGuests,
  mainClient,
  totalAmount,
  specialRequests,
  arrivalTime
}: BookingSummaryProps) {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      summary: "Résumé de votre réservation",
      accommodation: "Hébergement",
      dates: "Dates",
      arrival: "Arrivée",
      departure: "Départ",
      duration: "Durée",
      nights: "nuits",
      night: "nuit",
      guests: "Invités",
      mainGuest: "Client principal",
      pricing: "Tarification",
      basePrice: "Prix de base",
      totalPrice: "Prix total",
      perNight: "par nuit",
      perMonth: "par mois",
      perHour: "par heure",
      specialRequests: "Demandes spéciales",
      arrivalTime: "Heure d'arrivée",
      taxes: "Taxes incluses",
      currency: "BIF"
    },
    en: {
      summary: "Your booking summary",
      accommodation: "Accommodation",
      dates: "Dates",
      arrival: "Arrival",
      departure: "Departure",
      duration: "Duration",
      nights: "nights",
      night: "night",
      guests: "Guests",
      mainGuest: "Main guest",
      pricing: "Pricing",
      basePrice: "Base price",
      totalPrice: "Total price",
      perNight: "per night",
      perMonth: "per month",
      perHour: "per hour",
      specialRequests: "Special requests",
      arrivalTime: "Arrival time",
      taxes: "Taxes included",
      currency: "BIF"
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

  const getPricingModeText = () => {
    switch (accommodation.pricingMode) {
      case 'nightly': return t.perNight;
      case 'monthly': return t.perMonth;
      case 'hourly': return t.perHour;
      default: return t.perNight;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      standard_room: language === 'fr' ? 'Chambre standard' : 'Standard room',
      suite: 'Suite',
      house: language === 'fr' ? 'Maison de passage' : 'Guesthouse',
      apartment: language === 'fr' ? 'Appartement' : 'Apartment'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-2xl shadow-luxury border border-[hsl(var(--color-luxury-gold))]/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-luxury text-luxury-cream p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-luxury-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">{t.summary}</h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hébergement */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
            {t.accommodation}
          </h3>
          <div className="bg-luxury-cream rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {accommodation.images[0] && (
                <img
                  src={accommodation.images[0]}
                  alt={accommodation.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-luxury-dark">{accommodation.name}</h4>
                <p className="text-sm text-luxury-text mb-2">{getTypeLabel(accommodation.type)}</p>
                <div className="flex flex-wrap gap-1">
                  {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="px-2 py-1 bg-[hsl(var(--color-luxury-gold-light))]/10 text-luxury-text text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                  {accommodation.amenities.length > 3 && (
                    <span className="px-2 py-1 bg-luxury-text text-luxury-cream text-xs rounded">
                      +{accommodation.amenities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
            {t.dates}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center text-green-700 mb-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">{t.arrival}</span>
              </div>
              <p className="font-semibold text-luxury-dark">{formatDate(checkInDate)}</p>
              {arrivalTime && (
                <p className="text-sm text-luxury-text mt-1">{t.arrivalTime}: {arrivalTime}</p>
              )}
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center text-red-700 mb-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">{t.departure}</span>
              </div>
              <p className="font-semibold text-luxury-dark">{formatDate(checkOutDate)}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {numberOfNights} {numberOfNights === 1 ? t.night : t.nights}
            </span>
          </div>
        </div>

        {/* Invités */}
        {/* <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
            <Users className="size-5 text-luxury-gold"/>
            {t.guests}
          </h3>
          <div className="bg-luxury-cream rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-luxury-text">Nombre total:</span>
              <span className="font-semibold text-luxury-dark">{numberOfGuests} {numberOfGuests === 1 ? 'personne' : 'personnes'}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <span className="text-sm text-luxury-text">{t.mainGuest}:</span>
              <p className="font-medium text-luxury-dark">{mainClient.firstName} {mainClient.lastName}</p>
              <p className="text-sm text-luxury-text">{mainClient.email}</p>
            </div>
          </div>
        </div> */}

        {/* Demandes spéciales */}
        {/* {specialRequests && (
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
              <svg className="w-5 h-5 text-luxury-gold mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {t.specialRequests}
            </h3>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-luxury-text">{specialRequests}</p>
            </div>
          </div>
        )} */}

        {/* Tarification */}
        <div>
          <h3 className="text-lg font-semibold text-luxury-dark mb-4 flex items-center">
            {t.pricing}
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-luxury-text">{t.basePrice} {getPricingModeText()}:</span>
                <span className="font-medium">{accommodation.pricing.basePrice.toLocaleString()} {t.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-luxury-text">{t.duration}:</span>
                <span className="font-medium">{numberOfNights} {numberOfNights === 1 ? t.night : t.nights}</span>
              </div>
              <div className="border-t border-green-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-luxury-dark">{t.totalPrice}:</span>
                  <span className="text-2xl font-bold text-green-600">{totalAmount.toLocaleString()} {t.currency}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.taxes}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}