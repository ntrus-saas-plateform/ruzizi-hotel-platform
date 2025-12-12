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
        { name: 'Aéroport de Bujumbura', distance: '12 km', icon: '✈️' },
        { name: 'Centre-ville', distance: '2 km', icon: '🏢' },
        { name: 'Lac Tanganyika', distance: '1-5 km', icon: '🏖️' },
        //{ name: 'Marché central', distance: '3 km', icon: '🛒' },
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
        { name: 'Bujumbura Airport', distance: '12 km', icon: '✈️' },
        { name: 'City Center', distance: '2 km', icon: '🏢' },
        { name: 'Lake Tanganyika', distance: '1-5 km', icon: '🏖️' },
        { name: 'Central Market', distance: '3 km', icon: '🛒' },
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

        {/* Features & Contact Info */}
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
