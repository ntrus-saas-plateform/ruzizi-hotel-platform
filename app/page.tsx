'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/frontoffice/Navigation';
import HeroSection from '@/components/frontoffice/HeroSection';
import EstablishmentCard from '@/components/frontoffice/EstablishmentCard';
import AccommodationsSection from '@/components/frontoffice/AccommodationsSection';
import MapSection from '@/components/frontoffice/MapSection';
import ContactForm from '@/components/frontoffice/ContactForm';
import Footer from '@/components/frontoffice/Footer';
import {
  Trophy,
  Building2,
  Users,
  Clock,
  Star,
  MapPin,
  Utensils,
  HeartHandshake,
  Target,
  MoveRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
      const response = await fetch('/api/public/establishments?limit=3');
      const data = await response.json();
      if (data.success) {
        const establishments = data.data.data || [];
        establishments.forEach((est: any) => {});
        setEstablishments(establishments);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      aboutTitle: 'Notre Excellence',
      aboutSubtitle: "Une tradition d'hospitalité burundaise",
      aboutDescription:
        "Ruzizi Hôtel incarne l'excellence de l'hospitalité burundaise depuis plus d'une décennie. Nous combinons le charme traditionnel avec le confort moderne pour créer des expériences inoubliables.",
      establishmentsTitle: 'Nos Établissements',
      establishmentsSubtitle: "Découvrez nos hébergements d'exception",
      featuresTitle: 'Pourquoi Choisir Ruzizi Hôtel ?',
      viewAll: 'Voir tous les établissements',
      features: [
        {
          title: 'Confort Premium',
          description:
            'Chambres spacieuses et élégamment décorées avec toutes les commodités modernes',
          icon: Building2,
        },
        {
          title: "Service d'Excellence",
          description: 'Personnel attentif et professionnel disponible 24h/24 pour votre confort',
          icon: Star,
        },
        {
          title: 'Emplacements Privilégiés',
          description:
            'Situés dans les zones les plus prisées avec un accès facile aux attractions',
          icon: MapPin,
        },
        {
          title: 'Gastronomie Raffinée',
          description:
            'Restaurants proposant une cuisine locale et internationale de haute qualité',
          icon: Utensils,
        },
        {
          title: 'Bien-être & Détente',
          description: 'Spa, piscine et installations de loisirs pour votre relaxation totale',
          icon: HeartHandshake,
        },
        {
          title: 'Événements & Affaires',
          description: 'Salles de conférence modernes et services événementiels complets',
          icon: Target,
        },
      ],
    },
    en: {
      aboutTitle: 'Our Excellence',
      aboutSubtitle: 'A tradition of Burundian hospitality',
      aboutDescription:
        'Ruzizi Hotel embodies the excellence of Burundian hospitality for over a decade. We combine traditional charm with modern comfort to create unforgettable experiences.',
      establishmentsTitle: 'Our Establishments',
      establishmentsSubtitle: 'Discover our exceptional accommodations',
      featuresTitle: 'Why Choose Ruzizi Hotel?',
      viewAll: 'View all establishments',
      features: [
        {
          title: 'Premium Comfort',
          description: 'Spacious and elegantly decorated rooms with all modern amenities',
          icon: Building2,
        },
        {
          title: 'Excellence Service',
          description: 'Attentive and professional staff available 24/7 for your comfort',
          icon: Star,
        },
        {
          title: 'Prime Locations',
          description: 'Located in the most sought-after areas with easy access to attractions',
          icon: MapPin,
        },
        {
          title: 'Refined Gastronomy',
          description: 'Restaurants offering high-quality local and international cuisine',
          icon: Utensils,
        },
        {
          title: 'Wellness & Relaxation',
          description: 'Spa, pool and leisure facilities for your total relaxation',
          icon: HeartHandshake,
        },
        {
          title: 'Events & Business',
          description: 'Modern conference rooms and complete event services',
          icon: Target,
        },
      ],
    },
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-luxury-cream">
      {/* Navigation Header */}
      <Navigation bg={false} />

      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 order-2 lg:order-1">
              {[
                {
                  number: '10+',
                  label: language === 'fr' ? "Années d'expérience" : 'Years of experience',
                  Icon: Trophy,
                  gradient: 'bg-gradient-hero',
                },
                {
                  number: '150+',
                  label: language === 'fr' ? 'Chambres disponibles' : 'Available rooms',
                  Icon: Building2,
                  gradient: 'bg-gradient-hero',
                },
                {
                  number: '5000+',
                  label: language === 'fr' ? 'Clients satisfaits' : 'Satisfied customers',
                  Icon: Users,
                  gradient: 'bg-gradient-hero',
                },
                {
                  number: '24/7',
                  label: language === 'fr' ? 'Service client' : 'Customer service',
                  Icon: Clock,
                  gradient: 'bg-gradient-hero',
                },
              ].map((stat, index) => {
                const IconComponent = stat.Icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-2xl p-6 shadow-card-luxury transition-all duration-300 border-luxury-gold hover:-translate-y-2"
                  >
                    {/* Content */}
                    <div className="text-center relative z-10">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${stat.gradient} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}
                      >
                        <IconComponent className="w-7 h-7 text-luxury-cream" strokeWidth={2} />
                      </div>

                      {/* Number */}
                      <div
                        className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform duration-300`}
                      >
                        {stat.number}
                      </div>

                      {/* Label */}
                      <div className="text-luxury-text font-medium text-sm leading-snug group-hover:text-gray-800 transition-colors">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* About Text */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
              <Heart className="w-8 h-8 text-luxury-cream" strokeWidth={2} />
            </div> */}
              <h2 className="text-4xl font-bold text-luxury-dark mb-4">{t.aboutTitle}</h2>
              <p className="text-xl text-luxury-gold font-medium mb-6">{t.aboutSubtitle}</p>
              <p className="text-lg text-luxury-text leading-relaxed text-pretty">
                {t.aboutDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Establishments Section */}
      <section className="py-20 bg-[hsl(var(--color-luxury-gold-light))]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
              {t.establishmentsTitle}
            </h2>
            <p className="text-lg text-luxury-text">{t.establishmentsSubtitle}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <article
                  key={i}
                  className="bg-white rounded-2xl shadow-card-luxury overflow-hidden border border-gray-100 animate-pulse"
                >
                  {/* Image Skeleton */}
                  <div className="relative h-[20rem] bg-gradient-to-r from-[hsl(var(--color-luxury-gold-light))]/10 via-[hsl(var(--color-luxury-gold-light))]/15 to-[hsl(var(--color-luxury-gold-light))]/10 bg-[length:200%_100%]">
                    {/* Badges Skeleton */}
                    <div className="absolute top-4 left-4">
                      <div className="h-6 w-24 bg-[hsl(var(--color-luxury-text))]/5 rounded-full"></div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="h-6 w-20 bg-white/90 rounded-full"></div>
                    </div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg w-2/3"></div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className="w-4 h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded"
                            ></div>
                          ))}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-1/2 mb-2"></div>

                      {/* Rating */}
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-1/3"></div>
                    </div>

                    {/* Description */}
                    <div className="mb-4 space-y-2">
                      <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-full"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-4/5"></div>
                    </div>

                    {/* Amenities */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map((amenity) => (
                          <div
                            key={amenity}
                            className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-20"
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <div className="flex-1 h-11 bg-[hsl(var(--color-luxury-text))]/5 rounded-xl"></div>
                      <div className="flex-1 h-11 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2  gap-8">
                {establishments.map((establishment) => (
                  <EstablishmentCard
                    key={establishment.id}
                    id={establishment.id}
                    name={establishment.name}
                    description={
                      establishment.description ||
                      "Découvrez le confort et l'élégance dans cet établissement d'exception."
                    }
                    image={
                      establishment.images && establishment.images.length > 0
                        ? establishment.images[0]
                        : '/bg.jpg'
                    }
                    location={`${establishment.location?.city || 'Bujumbura'}, ${establishment.location?.country || 'Burundi'}`}
                    rating={4.8}
                    reviewCount={127}
                    priceRange=""
                    amenities={
                      establishment.services && establishment.services.length > 0
                        ? establishment.services.slice(0, 5)
                        : ['WiFi gratuit', 'Piscine', 'Restaurant', 'Spa', 'Parking']
                    }
                    isAvailable={establishment.isActive !== false}
                  />
                ))}
              </div>

              {establishments.length > 2 && (
                <div className="mt-8">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => router.push('/establishments')}
                      className="px-4 py-2 font-semibold cursor-pointer text-lg flex items-end gap-3 text-[hsl(var(--color-luxury-text))] rounded-xl hover:text-[hsl(var(--color-luxury-gold))] transition"
                    >
                      {t.viewAll} <MoveRight className="size-6" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Accommodations Section */}
      <AccommodationsSection />

      {/* Features Section */}
      <section className="py-5">
        <div className="max-w-7xl bg-luxury-dark mx-auto px-10 py-6 sm:px-16 sm:py-12 lg:px-20 lg:py-16 rounded-[5rem] shadow-luxury">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-subtle bg-clip-text text-transparent mb-4">
              {t.featuresTitle}
            </h2>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {t.features.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
                className="group backdrop-blur-sm rounded-4xl p-8 bg-luxury-cream shadow-card-luxury border border-luxury-gold-light  transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div className="text-center">
                  <div className="text-4xl text-luxury-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[hsl(var(--color-luxury-dark))] mb-4 group-hover:text-[hsl(var(--color-luxury-gold))] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-luxury-text leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <div id="map-section">
        <MapSection />
      </div>

      {/* Contact Section */}
      <ContactForm />

      {/* Footer */}
      <Footer />
    </div>
  );
}
