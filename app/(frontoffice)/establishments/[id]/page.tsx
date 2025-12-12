'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { EstablishmentResponse } from '@/types/establishment.types';
import type { AccommodationResponse } from '@/types/accommodation.types';
import InteractiveMap from '@/components/maps/InteractiveMap';
import {
  CalendarDays,
  CircleParking,
  Dumbbell,
  HeartHandshake,
  Moon,
  Snowflake,
  Sparkles,
  Tv,
  Users,
  Utensils,
  Waves,
  Wifi,
} from 'lucide-react';

// Helper function to get amenity icons
const getAmenityIcon = (amenity: string) => {
  const lowerAmenity = amenity.toLowerCase();
  if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) {
    return <Wifi className="size-3" />;
  }
  if (lowerAmenity.includes('pool') || lowerAmenity.includes('piscine')) {
    return <Waves className="size-3" />;
  }
  if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('food')) {
    return <Utensils className="size-3" />;
  }
  if (lowerAmenity.includes('parking')) {
    return <CircleParking className="size-3" />;
  }
  if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) {
    return <Dumbbell className="size-3" />;
  }
  if (lowerAmenity.includes('spa')) {
    return <HeartHandshake className="size-3" />;
  }
  if (lowerAmenity.includes('air') || lowerAmenity.includes('climatisation')) {
    return <Snowflake className="size-3" />;
  }
  if (lowerAmenity.includes('tv') || lowerAmenity.includes('télévision')) {
    return <Tv className="size-3" />;
  }
  return <Sparkles className="size-3" />; // Default icon
};

export default function EstablishmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const establishmentId = params.id as string;
  const [language, setLanguage] = useState('fr');

  const [establishment, setEstablishment] = useState<EstablishmentResponse | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const estResponse = await fetch(`/api/public/establishments/${establishmentId}`);
      const estData = await estResponse.json();

      if (!estResponse.ok) {
        throw new Error(estData.error?.message || 'Failed to fetch establishment');
      }

      setEstablishment(estData.data);

      const accResponse = await fetch(
        `/api/public/accommodations?establishmentId=${establishmentId}&limit=100`
      );
      const accData = await accResponse.json();

      if (accResponse.ok) {
        setAccommodations(accData.data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    if (establishmentId) {
      fetchData();
    }
  }, [establishmentId]);

  const handleBookNow = () => {
    router.push(`/booking?establishment=${establishmentId}`);
  };

  const handleViewOnMap = () => {
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'standard_room':
        return 'Chambre Standard';
      case 'suite':
        return 'Suite';
      case 'house':
        return 'Maison';
      case 'apartment':
        return 'Appartement';
      default:
        return type;
    }
  };

  const content = {
    fr: {
      title: 'Nos Chambres & Maisons de Passage',
      subtitle: "Trouvez l'hébergement parfait pour votre séjour",
      room: 'Chambre',
      guesthouse: 'Maison de passage',
      single: '1 personne',
      double: '2 personnes',
      family: '3+ personnes',
      perNight: 'par nuit',
      persons: 'personnes',
      available: 'Disponible',
      unavailable: 'Non disponible',
      bookNow: 'Réserver',
      viewDetails: 'Voir détails',
      noResults: 'Aucun hébergement trouvé',
      viewMore: 'Voir toutes les Chambres & Maisons de Passage',
    },
    en: {
      title: 'Our Rooms & Guesthouses',
      subtitle: 'Find the perfect accommodation for your stay',
      room: 'Room',
      guesthouse: 'Guesthouse',
      single: '1 person',
      double: '2 persons',
      family: '3+ persons',
      perNight: 'per night',
      persons: 'persons',
      available: 'Available',
      unavailable: 'Unavailable',
      bookNow: 'Book Now',
      viewDetails: 'View Details',
      noResults: 'No accommodations found',
      viewMore: 'View all Rooms & Guesthouses',
    },
  };

  const t = content[language as keyof typeof content];

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6 h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-48 animate-pulse"></div>

        {/* Hero Image Grid Skeleton */}
        <div className="grid grid-cols-4 gap-2 mb-8 h-96 md:h-[500px]">
          <div className="col-span-4 md:col-span-2 md:row-span-2 bg-[hsl(var(--color-luxury-text))]/5 rounded-2xl animate-pulse"></div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[hsl(var(--color-luxury-text))]/5 rounded-2xl animate-pulse hidden md:block"
            ></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location Section */}
            <div className="space-y-4">
              <div className="h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg w-2/3 animate-pulse"></div>
              <div className="h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-1/2 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-32 animate-pulse"></div>
                <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-40 animate-pulse"></div>
                <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-28 animate-pulse"></div>
              </div>
            </div>

            {/* Description Card Skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
              <div className="space-y-2">
                <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-5/6"></div>
                <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-4/5"></div>
              </div>
            </div>

            {/* Services Card Skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                ))}
              </div>
            </div>

            {/* Map Card Skeleton */}
            <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
              <div className="aspect-video bg-[hsl(var(--color-luxury-text))]/5 rounded-xl"></div>
              <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-3/4"></div>
            </div>

            {/* Accommodations Section Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-64 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-card-luxury overflow-hidden border border-gray-100 animate-pulse"
                  >
                    {/* Image Skeleton */}
                    <div className="h-56 bg-[hsl(var(--color-luxury-text))]/5"></div>

                    {/* Content Skeleton */}
                    <div className="p-6 space-y-4">
                      {/* Title and Price */}
                      <div className="flex items-start justify-between">
                        <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg w-2/3"></div>
                        <div className="space-y-1">
                          <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg w-24"></div>
                          <div className="h-3 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-16 ml-auto"></div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                        <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-4/5"></div>
                      </div>

                      {/* Amenities */}
                      <div className="flex gap-2">
                        <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-20"></div>
                        <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-24"></div>
                        <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full w-16"></div>
                      </div>

                      {/* Capacity */}
                      <div className="h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>

                      {/* Buttons */}
                      <div className="flex space-x-2">
                        <div className="flex-1 h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                        <div className="flex-1 h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Booking Card Skeleton */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6 border-2 border-gray-100 animate-pulse">
                <div className="text-center space-y-4 mb-6">
                  <div className="h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg w-32 mx-auto"></div>
                  <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-24 mx-auto"></div>
                </div>
                <div className="h-14 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl mb-3"></div>
                <div className="h-3 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-3/4 mx-auto"></div>
              </div>

              {/* Contact Card Skeleton */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-24"></div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded mr-3 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-28"></div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded mr-3 flex-shrink-0"></div>
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded flex-1"></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card Skeleton */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
                <div className="space-y-3">
                  <div className="h-12 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                  <div className="h-12 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xl text-red-600 mb-4">{error || 'Établissement non trouvé'}</p>
            <button
              onClick={() => router.push('/establishments')}
              className="px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-lg  transition font-medium"
            >
              Retour aux établissements
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images =
    establishment.images && establishment.images.length > 0
      ? establishment.images
      : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        ];

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-luxury-cream hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white/10 transition"
            title="Fermer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
            }
            className="absolute left-4 text-luxury-cream hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
            title="Image précédente"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <img
            src={images[selectedImageIndex]}
            alt={`${establishment.name} - Image ${selectedImageIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onError={(e) => {
              console.error(`❌ Erreur chargement image galerie ${selectedImageIndex + 1}`);
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
          />
          <button
            onClick={() =>
              setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-4 text-luxury-cream hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
            title="Image suivante"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-luxury-cream bg-black/50 px-4 py-2 rounded-full">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/establishments')}
          className="mb-6 flex items-center text-luxury-gold font-medium transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour aux établissements
        </button>

        {/* Hero Image Grid */}
        <div className="grid grid-cols-4 gap-2 mb-8 h-96 md:h-[500px]">
          <div
            className="col-span-4 md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-200"
            onClick={() => {
              setSelectedImageIndex(0);
              setShowGallery(true);
            }}
          >
            <img
              src={images[0]}
              alt={establishment.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                console.error('❌ Erreur chargement image principale:', {
                  establishment: establishment.name,
                  imagePreview: images[0].substring(0, 100),
                  isBase64: images[0].startsWith('data:image'),
                });
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {images.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl overflow-hidden cursor-pointer group hidden md:block bg-gray-200"
              onClick={() => {
                setSelectedImageIndex(idx + 1);
                setShowGallery(true);
              }}
            >
              <img
                src={img}
                alt={`${establishment.name} ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  console.error(`❌ Erreur chargement image ${idx + 2}:`, {
                    imagePreview: img.substring(0, 100),
                    isBase64: img.startsWith('data:image'),
                  });
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-luxury-cream text-xl font-bold pointer-events-none">
                  +{images.length - 5} photos
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location */}
            <div>
              <h1 className="text-4xl font-bold text-luxury-dark mb-4">{establishment.name}</h1>
              <div className="flex items-center text-luxury-text mb-4">
                <svg
                  className="w-5 h-5 mr-2 text-luxury-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium">
                  {establishment.location.city}, {establishment.location.address}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  {establishment.pricingMode === 'nightly' ? (
                    <span className='flex items-center gap-2'>
                      <Moon className="size-4" /> Par nuitée
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      {' '}
                      <CalendarDays className="size-4" /> Par mois
                    </span>
                  )}
                </span>
                <span className="px-3 py-1 flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Users className="size-4" /> Capacité: {establishment.totalCapacity} personnes
                </span>
                {establishment.isActive && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-luxury-cream rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-luxury-dark mb-4">À propos</h2>
              <p className="text-luxury-text leading-relaxed whitespace-pre-line">
                {establishment.description}
              </p>
            </div>

            {/* Services */}
            {establishment.services && establishment.services.length > 0 && (
              <div className="bg-luxury-cream rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-luxury-dark mb-4">Services & Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {establishment.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 text-luxury-text">
                      <svg
                        className="w-5 h-5 text-luxury-gold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Section */}
            <div id="map-section" className="bg-luxury-cream rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-luxury-dark mb-4">Localisation</h2>
              <InteractiveMap
                location={{
                  lat: establishment.location.coordinates.lat,
                  lng: establishment.location.coordinates.lng,
                  name: establishment.name,
                  address: `${establishment.location.address}, ${establishment.location.city}`
                }}
                height="400px"
                showControls={true}
                showDirections={true}
                className="mb-4"
              />
            </div>

            {/* Accommodations */}
            <div className="">
              <h2 className="text-2xl font-bold text-luxury-dark mb-6">Hébergements disponibles</h2>
              {accommodations.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <p className="text-luxury-text">Aucun hébergement disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accommodations.map((accom) => (
                    <div
                      key={accom?.id}
                      className="group bg-white rounded-2xl shadow-card-luxury transition-all duration-300 overflow-hidden border border-gray-100 hover:transform hover:-translate-y-2 hover:border-[hsl(var(--color-luxury-gold-light))]"
                    >
                      {/* Image */}
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={
                            accom?.images[0] ||
                            'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                          }
                          alt={accom?.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Image gallery indicator */}
                        {accom?.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black/50 text-luxury-cream px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{accom?.images.length}</span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              accom.status === 'available'
                                ? 'bg-green-700 text-luxury-cream shadow-lg'
                                : 'bg-red-700 text-luxury-cream shadow-lg'
                            }`}
                          >
                            {accom.status === 'available' ? t.available : t.unavailable}
                          </span>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-luxury-text text-luxury-gold-light rounded-full text-xs font-medium shadow-lg">
                            {accom?.type === 'standard_room' || accom?.type === 'suite'
                              ? t.room
                              : accom?.type === 'house' || accom?.type === 'apartment'
                                ? t.guesthouse
                                : accom?.type}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <h3 className="text-2xl font-bold text-[hsl(var(--color-luxury-dark))] group-hover:text-[hsl(var(--color-luxury-gold))] mb-2 transition">
                            {accom?.name}
                          </h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-luxury-gold">
                              {(accom?.pricing?.basePrice || 0).toLocaleString()}{' '}
                              FBU
                            </div>
                            <div className="text-xs text-luxury-text font-medium">{t.perNight}</div>
                          </div>
                        </div>
                        {accom?.description && (
                          <p className="text-sm text-luxury-text mb-4 line-clamp-2 leading-relaxed">
                            {accom?.description}
                          </p>
                        )}

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {accom?.amenities.slice(0, 3).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-[hsl(var(--color-luxury-gold-light))]/10 text-luxury-text rounded-full border border-luxury-gold-light text-xs font-medium flex items-center space-x-1"
                            >
                              <span>{getAmenityIcon(amenity)}</span>
                              <span>{amenity}</span>
                            </span>
                          ))}
                          {accom?.amenities.length > 3 && (
                            <span className="px-3 py-1 bg-luxury-text text-luxury-cream rounded-full text-xs font-medium">
                              +{accom?.amenities.length - 3} autres
                            </span>
                          )}
                        </div>

                        {/* Capacity & Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-luxury-text font-medium">
                            <Users className="size-4 text-luxury-gold-light" />
                            <span className="text-sm">
                              {typeof accom?.capacity === 'number'
                                ? accom?.capacity
                                : accom?.capacity?.maxGuests || 'N/A'}{' '}
                              {t.persons}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/accommodations/${accom?.id}`)}
                              className="flex-1 px-4 py-2.5 border-2 border-[hsl(var(--color-luxury-text))]/20  text-luxury-text rounded-xl hover:border-[hsl(var(--color-luxury-gold-light))] transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-1"
                            >
                              <span>{t.viewDetails}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (accom.status === 'available' && accom?.establishmentId) {
                                  const bookingUrl = `/booking?establishment=${accom?.establishmentId}&accommodation=${accom?.id}`;
                                  router.push(bookingUrl);
                                } else {
                                  console.warn('Cannot book:', {
                                    isAvailable: accom.status === 'available',
                                    hasEstablishmentId: !!accom?.establishmentId,
                                  });
                                }
                              }}
                              disabled={accom.status !== 'available' || !accom?.establishmentId}
                              className="flex-1 px-4 py-2.5 bg-gradient-luxury text-luxury-cream rounded-xl shadow-luxury transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transform hover:scale-105 disabled:transform-none"
                              title={
                                accom.status !== 'available'
                                  ? 'Hébergement non disponible'
                                  : !accom?.establishmentId
                                    ? 'Établissement non défini'
                                    : 'Réserver cet hébergement'
                              }
                            >
                              <span>{t.bookNow}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Booking Card */}
              <div className="bg-white rounded-2xl shadow-luxury p-6 border-2 border-amber-100">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-luxury-gold mb-2">
                    {accommodations.length > 0
                      ? Math.min(...accommodations.map((a) => a.pricing.basePrice)).toLocaleString()
                      : '---'}{' '}
                    BIF
                  </div>
                  <div className="text-sm text-luxury-text">
                    par {establishment.pricingMode === 'nightly' ? 'nuitée' : 'mois'}
                  </div>
                </div>
                <button
                  onClick={handleBookNow}
                  className="w-full px-6 py-4 bg-gradient-luxury text-luxury-cream rounded-xl transition font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Réserver maintenant
                </button>
                <p className="text-xs text-luxury-text text-center mt-3">
                  Réservation instantanée • Confirmation immédiate
                </p>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6">
                <h3 className="text-lg font-bold text-luxury-dark mb-4">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-luxury-gold mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      {establishment.contacts.phone.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:${phone}`}
                          className="block text-luxury-text hover:text-luxury-gold transition"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-luxury-gold mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`mailto:${establishment.contacts.email}`}
                      className="text-luxury-text hover:text-luxury-gold transition break-all"
                    >
                      {establishment.contacts.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6">
                <h3 className="text-lg font-bold text-luxury-dark mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleViewOnMap}
                    className="w-full px-4 py-3 border-2 border-[hsl(var(--color-luxury-text))]/20 text-luxury-text rounded-xl hover:border-[hsl(var(--color-luxury-gold))] hover:text-luxury-gold transition font-medium flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Voir sur la carte
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImageIndex(0);
                      setShowGallery(true);
                    }}
                    className="w-full px-4 py-3 border-2 border-[hsl(var(--color-luxury-text))]/20 text-luxury-text rounded-xl hover:border-[hsl(var(--color-luxury-gold))] hover:text-luxury-gold transition font-medium flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Voir toutes les photos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
