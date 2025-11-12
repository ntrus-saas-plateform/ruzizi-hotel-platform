'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/frontoffice/HeroSection';
import EstablishmentCard from '@/components/frontoffice/EstablishmentCard';
import MapSection from '@/components/frontoffice/MapSection';
import ContactForm from '@/components/frontoffice/ContactForm';

export default function HomePage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/public/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      aboutTitle: "Notre Excellence",
      aboutSubtitle: "Une tradition d'hospitalité burundaise",
      aboutDescription: "Ruzizi Hôtel incarne l'excellence de l'hospitalité burundaise depuis plus d'une décennie. Nous combinons le charme traditionnel avec le confort moderne pour créer des expériences inoubliables.",
      establishmentsTitle: "Nos Établissements",
      establishmentsSubtitle: "Découvrez nos hébergements d'exception",
      featuresTitle: "Pourquoi Choisir Ruzizi Hôtel ?",
      viewAll: "Voir tous les établissements",
      features: [
        {
          title: "Confort Premium",
          description: "Chambres spacieuses et élégamment décorées avec toutes les commodités modernes",
          icon: "🏨"
        },
        {
          title: "Service d'Excellence",
          description: "Personnel attentif et professionnel disponible 24h/24 pour votre confort",
          icon: "⭐"
        },
        {
          title: "Emplacements Privilégiés",
          description: "Situés dans les zones les plus prisées avec un accès facile aux attractions",
          icon: "📍"
        },
        {
          title: "Gastronomie Raffinée",
          description: "Restaurants proposant une cuisine locale et internationale de haute qualité",
          icon: "🍽️"
        },
        {
          title: "Bien-être & Détente",
          description: "Spa, piscine et installations de loisirs pour votre relaxation totale",
          icon: "💆‍♀️"
        },
        {
          title: "Événements & Affaires",
          description: "Salles de conférence modernes et services événementiels complets",
          icon: "🎯"
        }
      ]
    },
    en: {
      aboutTitle: "Our Excellence",
      aboutSubtitle: "A tradition of Burundian hospitality",
      aboutDescription: "Ruzizi Hotel embodies the excellence of Burundian hospitality for over a decade. We combine traditional charm with modern comfort to create unforgettable experiences.",
      establishmentsTitle: "Our Establishments",
      establishmentsSubtitle: "Discover our exceptional accommodations",
      featuresTitle: "Why Choose Ruzizi Hotel?",
      viewAll: "View all establishments",
      features: [
        {
          title: "Premium Comfort",
          description: "Spacious and elegantly decorated rooms with all modern amenities",
          icon: "🏨"
        },
        {
          title: "Excellence Service",
          description: "Attentive and professional staff available 24/7 for your comfort",
          icon: "⭐"
        },
        {
          title: "Prime Locations",
          description: "Located in the most sought-after areas with easy access to attractions",
          icon: "📍"
        },
        {
          title: "Refined Gastronomy",
          description: "Restaurants offering high-quality local and international cuisine",
          icon: "🍽️"
        },
        {
          title: "Wellness & Relaxation",
          description: "Spa, pool and leisure facilities for your total relaxation",
          icon: "💆‍♀️"
        },
        {
          title: "Events & Business",
          description: "Modern conference rooms and complete event services",
          icon: "🎯"
        }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-white via-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
              {t.aboutTitle}
            </h2>
            <p className="text-xl text-amber-700 font-medium mb-6">
              {t.aboutSubtitle}
            </p>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t.aboutDescription}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { number: "10+", label: language === 'fr' ? "Années d'expérience" : "Years of experience" },
              { number: "150+", label: language === 'fr' ? "Chambres disponibles" : "Available rooms" },
              { number: "5000+", label: language === 'fr' ? "Clients satisfaits" : "Satisfied customers" },
              { number: "24/7", label: language === 'fr' ? "Service client" : "Customer service" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-amber-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Establishments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
              {t.establishmentsTitle}
            </h2>
            <p className="text-xl text-gray-600">
              {t.establishmentsSubtitle}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-amber-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {establishments.slice(0, 6).map((establishment) => (
                  <EstablishmentCard
                    key={establishment.id}
                    id={establishment.id}
                    name={establishment.name}
                    description={establishment.description || "Découvrez le confort et l'élégance dans cet établissement d'exception."}
                    image={establishment.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                    location={`${establishment.location?.city || 'Bujumbura'}, ${establishment.location?.country || 'Burundi'}`}
                    rating={4.8}
                    reviewCount={127}
                    priceRange="$$$"
                    amenities={['WiFi gratuit', 'Piscine', 'Restaurant', 'Spa', 'Parking']}
                    isAvailable={true}
                  />
                ))}
              </div>

              {establishments.length > 6 && (
                <div className="text-center">
                  <button
                    onClick={() => router.push('/establishments')}
                    className="px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105 flex items-center mx-auto space-x-3"
                  >
                    <span>{t.viewAll}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
              {t.featuresTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:transform hover:-translate-y-2"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-amber-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <MapSection />

      {/* Contact Section */}
      <ContactForm />
    </div>
  );
}
