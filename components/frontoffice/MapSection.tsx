'use client';

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
  title = "Notre Emplacement",
  subtitle = "Situé au cœur de Bujumbura",
  address = "Avenue de l'Indépendance, Bujumbura, Burundi",
  coordinates = { lat: -3.3614, lng: 29.3599 }
}: MapSectionProps) {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Notre Emplacement",
      subtitle: "Situé au cœur de Bujumbura",
      directions: "Obtenir l'itinéraire",
      phone: "Appeler",
      email: "Envoyer un email",
      features: {
        parking: "Parking gratuit",
        wifi: "WiFi gratuit",
        restaurant: "Restaurant sur place",
        spa: "Spa & Bien-être",
        pool: "Piscine",
        gym: "Salle de sport"
      },
      nearby: "À proximité",
      nearbyPlaces: [
        { name: "Aéroport de Bujumbura", distance: "12 km", icon: "✈️" },
        { name: "Centre-ville", distance: "2 km", icon: "🏢" },
        { name: "Lac Tanganyika", distance: "5 km", icon: "🏖️" },
        { name: "Marché central", distance: "3 km", icon: "🛒" }
      ]
    },
    en: {
      title: "Our Location",
      subtitle: "Located in the heart of Bujumbura",
      directions: "Get Directions",
      phone: "Call",
      email: "Send Email",
      features: {
        parking: "Free Parking",
        wifi: "Free WiFi",
        restaurant: "On-site Restaurant",
        spa: "Spa & Wellness",
        pool: "Swimming Pool",
        gym: "Fitness Center"
      },
      nearby: "Nearby",
      nearbyPlaces: [
        { name: "Bujumbura Airport", distance: "12 km", icon: "✈️" },
        { name: "City Center", distance: "2 km", icon: "🏢" },
        { name: "Lake Tanganyika", distance: "5 km", icon: "🏖️" },
        { name: "Central Market", distance: "3 km", icon: "🛒" }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
  };

  const features = [
    { name: t.features.parking, icon: "🅿️", color: "from-blue-500 to-blue-600" },
    { name: t.features.wifi, icon: "📶", color: "from-green-500 to-green-600" },
    { name: t.features.restaurant, icon: "🍽️", color: "from-orange-500 to-orange-600" },
    { name: t.features.spa, icon: "💆‍♀️", color: "from-purple-500 to-purple-600" },
    { name: t.features.pool, icon: "🏊‍♂️", color: "from-cyan-500 to-cyan-600" },
    { name: t.features.gym, icon: "💪", color: "from-red-500 to-red-600" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Map Header */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ruzizi Hôtel</h3>
                    <p className="text-amber-100 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {address}
                    </p>
                  </div>
                  <button
                    onClick={openGoogleMaps}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    {t.directions}
                  </button>
                </div>
              </div>

              {/* Interactive Map Placeholder */}
              <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100">
                {/* Map Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 grid-rows-6 h-full">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border border-gray-300"></div>
                    ))}
                  </div>
                </div>

                {/* Hotel Marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md border">
                      <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">Ruzizi Hôtel</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Elements */}
                <div className="absolute top-4 right-4 space-y-2">
                  <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>

                {/* Click to open full map */}
                <button
                  onClick={openGoogleMaps}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/10 transition-all duration-300 group"
                >
                  <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                    <p className="text-gray-800 font-medium flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ouvrir dans Google Maps
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Contact</h3>
              <div className="space-y-4">
                <a
                  href="tel:+25769657554"
                  className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.phone}</p>
                    <p className="text-sm text-gray-600">+257 69 65 75 54</p>
                  </div>
                </a>

                <a
                  href="mailto:contact@ruzizihotel.com"
                  className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.email}</p>
                    <p className="text-sm text-gray-600">contact@ruzizihotel.com</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Services</h3>
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-2xl mr-3">{feature.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Places */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t.nearby}</h3>
              <div className="space-y-3">
                {t.nearbyPlaces.map((place, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{place.icon}</span>
                      <span className="font-medium text-gray-900">{place.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}