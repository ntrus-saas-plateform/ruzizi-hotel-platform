'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoveRight,
  CircleParking,
  Dumbbell,
  HeartHandshake,
  Snowflake,
  Sparkles,
  Tv,
  Users,
  Utensils,
  Waves,
  Wifi,
} from 'lucide-react';

interface Accommodation {
  id: string;
  name: string;
  description?: string;
  type: 'standard_room' | 'suite' | 'house' | 'apartment';
  establishmentId: string;
  establishmentName?: string;
  price?: number;
  pricing?: {
    basePrice: number;
    seasonalPrice?: number;
  };
  capacity?:
    | number
    | {
        maxGuests: number;
      };
  images: string[];
  amenities: string[];
  isAvailable: boolean;
}

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

export default function AccommodationsSection() {
  const router = useRouter();
  const [language, setLanguage] = useState('fr');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accomResponse] = await Promise.all([fetch('/api/public/accommodations?limit=18')]);

      const accomData = await accomResponse.json();

      if (accomData.success) {
        // Normalize accommodations to extract establishment info
        const normalizedAccommodations = (accomData.data.data || accomData.data || []).map(
          (accom: any) => {
            let estId: string | undefined;
            let estName: string | undefined;

            if (typeof accom.establishmentId === 'object' && accom.establishmentId !== null) {
              // Try different possible ID fields
              estId =
                accom.establishmentId._id ||
                accom.establishmentId.id ||
                (typeof accom.establishmentId.toString === 'function'
                  ? accom.establishmentId.toString()
                  : undefined);
              estName = accom.establishmentId.name;
            } else if (typeof accom.establishmentId === 'string') {
              estId = accom.establishmentId;
            }

            const normalized = {
              ...accom,
              id: accom.id || accom._id,
              establishmentId: estId,
              establishmentName: estName || accom.establishmentName,
              isAvailable:
                accom.isAvailable !== undefined ? accom.isAvailable : accom.status === 'available',
            };

            return normalized;
          }
        );

        setAccommodations(normalizedAccommodations);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
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

  return (
    <section className="py-20 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-luxury-text">{t.subtitle}</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-card-luxury overflow-hidden border border-gray-100 animate-pulse"
              >
                {/* Image Skeleton */}
                <div className="h-56 bg-gradient-to-r from-[hsl(var(--color-luxury-gold-light))]/10 via-[hsl(var(--color-luxury-gold-light))]/15 to-[hsl(var(--color-luxury-gold-light))]/10 bg-[length:200%_100%] animate-shimmer"></div>

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
                  <div className="flex space-x-2 pt-2">
                    <div className="flex-1 h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                    <div className="flex-1 h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Accommodations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {accommodations.map((accom) => (
                <div
                  key={accom.id}
                  className="group bg-white rounded-2xl shadow-card-luxury transition-all duration-300 overflow-hidden border border-gray-100 hover:transform hover:-translate-y-2 hover:border-[hsl(var(--color-luxury-gold-light))]"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={
                        accom.images[0] ||
                        'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      }
                      alt={accom.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Image gallery indicator */}
                    {accom.images.length > 1 && (
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
                        <span>{accom.images.length}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          accom.isAvailable
                            ? 'bg-green-700 text-luxury-cream shadow-lg'
                            : 'bg-red-700 text-luxury-cream shadow-lg'
                        }`}
                      >
                        {accom.isAvailable ? t.available : t.unavailable}
                      </span>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-luxury-text text-luxury-gold-light rounded-full text-xs font-medium shadow-lg">
                        {accom.type === 'standard_room' || accom.type === 'suite'
                          ? t.room
                          : accom.type === 'house' || accom.type === 'apartment'
                            ? t.guesthouse
                            : accom.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-2xl font-bold text-[hsl(var(--color-luxury-dark))] group-hover:text-[hsl(var(--color-luxury-gold))] mb-2 transition">
                        {accom.name}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-luxury-gold">
                          {(accom.price || accom.pricing?.basePrice || 0).toLocaleString()} FBU
                        </div>
                        <div className="text-xs text-gray-500 font-medium">{t.perNight}</div>
                      </div>
                    </div>
                    {accom.description && (
                      <p className="text-sm text-luxury-text mb-4 line-clamp-2 leading-relaxed">
                        {accom.description}
                      </p>
                    )}

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {accom.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[hsl(var(--color-luxury-gold-light))]/10 text-luxury-text rounded-full border border-luxury-gold-light text-xs font-medium flex items-center space-x-1"
                        >
                          <span>{getAmenityIcon(amenity)}</span>
                          <span>{amenity}</span>
                        </span>
                      ))}
                      {accom.amenities.length > 3 && (
                        <span className="px-3 py-1 bg-luxury-text text-luxury-cream rounded-full text-xs font-medium">
                          +{accom.amenities.length - 3} autres
                        </span>
                      )}
                    </div>

                    {/* Capacity & Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-luxury-text font-medium">
                        <Users className="size-4 text-luxury-gold-light" />
                        <span className="text-sm">
                          {typeof accom.capacity === 'number'
                            ? accom.capacity
                            : accom.capacity?.maxGuests || 'N/A'}{' '}
                          {t.persons}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/accommodations/${accom.id}`)}
                          className="flex-1 px-4 py-2.5 border-2 border-[hsl(var(--color-luxury-text))]/20  text-luxury-text rounded-xl hover:border-[hsl(var(--color-luxury-gold-light))] transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-1"
                        >
                          <span>{t.viewDetails}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (accom.isAvailable && accom.establishmentId) {
                              const bookingUrl = `/booking?establishment=${accom.establishmentId}&accommodation=${accom.id}`;
                              router.push(bookingUrl);
                            } else {
                              console.warn('Cannot book:', {
                                isAvailable: accom.isAvailable,
                                hasEstablishmentId: !!accom.establishmentId,
                              });
                            }
                          }}
                          disabled={!accom.isAvailable || !accom.establishmentId}
                          className="flex-1 px-4 py-2.5 bg-gradient-luxury text-luxury-cream rounded-xl shadow-luxury transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 transform hover:scale-105 disabled:transform-none"
                          title={
                            !accom.isAvailable
                              ? 'Hébergement non disponible'
                              : !accom.establishmentId
                                ? 'Établissement non défini'
                                : 'Réserver cet hébergement'
                          }
                        >
                          <span>{t.bookNow}</span>
                        </button>
                      </div>

                      {/* Debug info - Remove in production */}
                      {!accom.establishmentId && accom.isAvailable && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Établissement non défini pour cet hébergement
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {accommodations.length > 0 && (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => router.push('/accommodations')}
                  className="px-4 py-2 font-semibold cursor-pointer text-lg flex items-end gap-3 text-[hsl(var(--color-luxury-text))] rounded-xl hover:text-[hsl(var(--color-luxury-gold))] transition"
                >
                  {t.viewMore} <MoveRight className="size-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
