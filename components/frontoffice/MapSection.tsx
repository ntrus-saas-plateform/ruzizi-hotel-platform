'use client';

import { CircleParking, Dumbbell, HeartHandshake, Utensils, Waves, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';
import SimpleMap from '@/components/maps/SimpleMap';

interface MapSectionProps {
  title?: string;
  subtitle?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  establishments?: any[];
}

export default function MapSection({
  title = 'Notre Emplacement',
  subtitle = 'Situé au cœur de Bujumbura',
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
      phone: 'Appeler',
      email: 'Envoyer un email',
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
        { name: 'Lac Tanganyika', distance: '5 km', icon: '🏖️' },
        { name: 'Marché central', distance: '3 km', icon: '🛒' },
      ],
    },
    en: {
      title: 'Our Location',
      subtitle: 'Located in the heart of Bujumbura',
      directions: 'Get Directions',
      phone: 'Call',
      email: 'Send Email',
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
        { name: 'Lake Tanganyika', distance: '5 km', icon: '🏖️' },
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
    <section className="py-20 bg-[hsl(var(--color-luxury-gold-light))]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-luxury-text">{t.subtitle}</p>
        </div>

        {/* Map */}
        <div className="mb-12">
          <SimpleMap
            location={mapLocation}
            height="500px"
            showNearbyPlaces={true}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Features */}
        <div className="bg-gradient-luxury py-10 rounded-3xl">
          <div className="grid grid-cols-2 lg:grid-cols-6 justify-items-center gap-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center p-3 text-luxury-dark rounded-lg transition-colors duration-200"
              >
                <feature.icon className="text-2xl mr-3" />
                <span className="text-sm font-medium text-luxury-cream">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
