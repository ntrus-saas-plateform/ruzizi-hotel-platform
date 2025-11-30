'use client';

import { CircleParking, Dumbbell, HeartHandshake, Utensils, Waves, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MapSectionProps {
  title?: string;
  subtitle?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function MapSection({
  title = 'Notre Emplacement',
  subtitle = 'Situé au cœur de Bujumbura',
  address = "Avenue de l'Université, Bujumbura, Burundi",
  coordinates = { lat: -3.3614, lng: 29.3599 },
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

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
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
    <section className="pt-20 ">
      <div className="bg-gradient-luxury py-10 flex justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-6 justify-items-center gap-3 max-w-7xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center p-3 text-luxury-dark rounded-lg  transition-colors duration-200"
            >
              <feature.icon className="text-2xl mr-3" />
              <span className="text-sm font-medium text-luxury-cream">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
