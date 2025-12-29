'use client';

import { CircleParking, Dumbbell, HeartHandshake, Utensils, Waves, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';
import SimpleMap from '@/components/maps/SimpleMap';

interface MapSectionProps {
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  establishments?: any[];
}

export default function MapSection({
  address = "Avenue de l'Université, Bujumbura, Burundi",
  coordinates = { lat: -3.3614, lng: 29.3599 },
  establishments = [],
}: MapSectionProps) {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: 'Notre Emplacement',
      subtitle: 'Situé au cœur de Bujumbura',
      directions: "Obtenir l'itinéraire",
      phone: 'Téléphone',
      email: 'Email',
      address: 'Adresse',
      contactTitle: 'Contactez-nous',
      contactSubtitle: 'Nous sommes là pour vous aider',
      features: {
        parking: 'Parking gratuit',
        wifi: 'WiFi gratuit',
        restaurant: 'Restaurant sur place',
        spa: 'Spa & Bien-être',
        pool: 'Piscine',
        gym: 'Salle de sport',
      },
      nearby: 'À proximité',
      nearbyPlaces: [
        { name: 'Aéroport de Bujumbura', icon: '✈️', lat: -3.324, lng: 29.318 },
        { name: 'Centre-ville', icon: '🏢', lat: -3.378, lng: 29.361 },
        { name: 'Lac Tanganyika', icon: '🏖️', lat: -3.39, lng: 29.36 },
        //{ name: 'Marché central', icon: '🛒', lat: -3.381, lng: 29.362 },
      ],
    },
    en: {
      title: 'Our Location',
      subtitle: 'Located in the heart of Bujumbura',
      directions: 'Get Directions',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      contactTitle: 'Contact Us',
      contactSubtitle: 'We are here to help you',
      features: {
        parking: 'Free Parking',
        wifi: 'Free WiFi',
        restaurant: 'On-site Restaurant',
        spa: 'Spa & Wellness',
        pool: 'Swimming Pool',
        gym: 'Fitness Center',
      },
      nearby: 'Nearby',
      nearbyPlaces: [
        { name: 'Bujumbura Airport', icon: '✈️', lat: -3.324, lng: 29.318 },
        { name: 'City Center', icon: '🏢', lat: -3.378, lng: 29.361 },
        { name: 'Lake Tanganyika', icon: '🏖️', lat: -3.39, lng: 29.36 },
        { name: 'Central Market', icon: '🛒', lat: -3.381, lng: 29.362 },
      ],
    },
  };

  const t = content[language as keyof typeof content];

  // Utiliser les coordonnées du premier établissement s'il existe
  const primaryEstablishment = establishments.length > 0 ? establishments[0] : null;
  const mapLocation = primaryEstablishment ? {
    lat: primaryEstablishment.location?.coordinates?.lat || coordinates.lat,
    lng: primaryEstablishment.location?.coordinates?.lng || coordinates.lng,
    name: primaryEstablishment.name || 'Ruzizi Hôtel',
    address: primaryEstablishment.location?.address ?
      `${primaryEstablishment.location.address}, ${primaryEstablishment.location.city}` :
      address,
    city: primaryEstablishment.location?.city?.toLowerCase() || 'bujumbura'
  } : {
    lat: coordinates.lat,
    lng: coordinates.lng,
    name: 'Ruzizi Hôtel',
    address: address,
    city: 'bujumbura'
  };

  // Distance géodésique simple en km
  const computeDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Carrousel simple d'établissements
  const [currentEstIndex, setCurrentEstIndex] = useState(0);

  useEffect(() => {
    if (!establishments || establishments.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentEstIndex((prev) => (prev + 1) % establishments.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [establishments]);

  const features = [
    { name: t.features.parking, icon: CircleParking, color: 'from-blue-500 to-blue-600' },
    { name: t.features.wifi, icon: Wifi, color: 'from-green-500 to-green-600' },
    { name: t.features.restaurant, icon: Utensils, color: 'from-orange-500 to-orange-600' },
    { name: t.features.spa, icon: HeartHandshake, color: 'from-purple-500 to-purple-600' },
    { name: t.features.pool, icon: Waves, color: 'from-cyan-500 to-cyan-600' },
    { name: t.features.gym, icon: Dumbbell, color: 'from-red-500 to-red-600' },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[hsl(var(--color-luxury-gold-light))]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-3 sm:mb-4">
            {t.title}
          </h2>
          <p className="text-base sm:text-lg text-luxury-text px-4 sm:px-0">{t.subtitle}</p>
        </div>

        {/* Map */}
        <div className="mb-8 sm:mb-12 px-2 sm:px-0">
          <SimpleMap
            location={mapLocation}
            showNearbyPlaces={true}
            className="w-full max-w-4xl mx-auto"
          />
        </div>

        {/* Carousel des établissements autour de l'emplacement */}
        {establishments && establishments.length > 0 && (
          <div className="mb-10 max-w-4xl mx-auto px-3 sm:px-0">
            <div className="bg-white rounded-2xl shadow-card-luxury border border-luxury-gold-light/40 p-4 sm:p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-luxury-gold mb-1 font-semibold">
                  Établissement à proximité
                </p>
                {(() => {
                  const est = establishments[currentEstIndex] || establishments[0];
                  return (
                    <>
                      <h3 className="text-lg sm:text-xl font-bold text-luxury-dark truncate">
                        {est?.name}
                      </h3>
                      <p className="text-sm text-luxury-text mt-1 flex flex-wrap items-center gap-2">
                        {est?.location?.city && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-xs">📍</span>
                            <span className="font-medium">{est.location.city}</span>
                          </span>
                        )}
                        {est?.location?.address && (
                          <span className="text-xs text-gray-500 truncate max-w-full">
                            {est.location.address}
                          </span>
                        )}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Contrôles du carrousel */}
              {establishments.length > 1 && (
                <div className="flex flex-col items-end gap-3">
                  <div className="inline-flex items-center bg-luxury-dark text-luxury-cream rounded-full px-2 py-1 text-xs">
                    <span>
                      {currentEstIndex + 1} / {establishments.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentEstIndex((prev) =>
                          prev === 0 ? establishments.length - 1 : prev - 1,
                        )
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-luxury-gold-light text-luxury-dark hover:bg-luxury-gold/5 text-xs"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentEstIndex((prev) => (prev + 1) % establishments.length)
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-luxury-gold-light text-luxury-dark hover:bg-luxury-gold/5 text-xs"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features, Nearby & Contact Info */}
        <div className="bg-gradient-luxury py-6 sm:py-8 lg:py-10 rounded-xl sm:rounded-2xl lg:rounded-3xl mx-2 sm:mx-4 lg:mx-0">
          <div className="px-3 sm:px-6 lg:px-8">
            {/* Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-3 max-w-6xl mx-auto mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 lg:p-3 text-luxury-dark rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-105"
                >
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 mb-1.5 sm:mb-2 text-luxury-cream flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-luxury-cream text-center leading-tight">
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Nearby Places - distances dynamiques */}
            {t.nearbyPlaces && t.nearbyPlaces.length > 0 && (
              <div className="max-w-4xl mx-auto mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-luxury-cream mb-3 flex items-center gap-2">
                  <span>📍</span>
                  <span>{t.nearby}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {t.nearbyPlaces.map((place: any, index: number) => {
                    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return null;
                    const d = computeDistanceKm(mapLocation.lat, mapLocation.lng, place.lat, place.lng);
                    const rounded = Math.round(d * 10) / 10;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-black/15 rounded-xl px-3 py-2 text-luxury-cream"
                      >
                        <div className="w-8 h-8 flex items-center justify-center text-lg">
                          <span>{place.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <p className="text-xs text-luxury-cream/80">
                            {rounded.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="border-t border-luxury-cream/20 pt-6 sm:pt-8">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-luxury-cream mb-2">
                  {t.contactTitle}
                </h3>
                <p className="text-sm sm:text-base text-luxury-cream/80">
                  {t.contactSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {/* Téléphone */}
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-luxury-cream/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg sm:text-xl">📞</span>
                  </div>
                  <h4 className="font-semibold text-luxury-cream mb-1 text-sm sm:text-base">
                    {t.phone}
                  </h4>
                  <a
                    href="tel:+25769657554"
                    className="text-xs sm:text-sm text-luxury-cream/80 hover:text-luxury-cream transition-colors"
                  >
                    +257 69 65 75 54
                  </a>
                </div>

                {/* Email */}
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-luxury-cream/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg sm:text-xl">✉️</span>
                  </div>
                  <h4 className="font-semibold text-luxury-cream mb-1 text-sm sm:text-base">
                    {t.email}
                  </h4>
                  <a
                    href="mailto:contact@ruzizihotel.com"
                    className="text-xs sm:text-sm text-luxury-cream/80 hover:text-luxury-cream transition-colors"
                  >
                    contact@ruzizihotel.com
                  </a>
                </div>

                {/* Adresse */}
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-luxury-cream/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg sm:text-xl">📍</span>
                  </div>
                  <h4 className="font-semibold text-luxury-cream mb-1 text-sm sm:text-base">
                    {t.address}
                  </h4>
                  <p className="text-xs sm:text-sm text-luxury-cream/80 leading-relaxed">
                    {mapLocation.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
