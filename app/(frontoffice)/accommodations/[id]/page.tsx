'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Accommodation {
  id: string;
  name: string;
  type: string;
  description?: string;
  establishmentId: {
    _id: string;
    id: string;
    name: string;
    location: {
      address: string;
      city: string;
      country: string;
    };
    contacts: {
      phone: string;
      email: string;
    };
  };
  pricing: {
    basePrice: number;
    seasonalPrice?: number;
    currency: string;
  };
  capacity: {
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    showers: number;
    livingRooms: number;
    kitchens: number;
    balconies: number;
  };
  details?: {
    floor?: number;
    area?: number;
    view?: string;
    bedType?: string;
  };
  amenities: string[];
  images: string[];
  status: string;
  pricingMode: string;
}

export default function AccommodationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [language, setLanguage] = useState('fr');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const fetchAccommodation = async () => {
    try {
      const response = await fetch(`/api/public/accommodations/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Hébergement non trouvé');
      }

      setAccommodation(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const content = {
    fr: {
      backToList: 'Retour à la liste',
      bookNow: 'Réserver maintenant',
      pricePerNight: 'par nuit',
      pricePerMonth: 'par mois',
      pricePerHour: 'par heure',
      overview: 'Aperçu',
      capacity: 'Capacité',
      maxGuests: 'Personnes max',
      bedrooms: 'Chambres',
      bathrooms: 'Salles de bain',
      showers: 'Douches',
      livingRooms: 'Salons',
      kitchens: 'Cuisines',
      balconies: 'Balcons',
      details: 'Détails',
      floor: 'Étage',
      area: 'Surface',
      view: 'Vue',
      bedType: 'Type de lit',
      amenities: 'Équipements',
      establishment: 'Établissement',
      location: 'Localisation',
      contact: 'Contact',
      phone: 'Téléphone',
      email: 'Email',
      available: 'Disponible',
      unavailable: 'Non disponible',
      loading: 'Chargement...',
      notFound: 'Hébergement non trouvé',
      description: 'Description',
      noDescription: 'Aucune description disponible',
    },
    en: {
      backToList: 'Back to list',
      bookNow: 'Book now',
      pricePerNight: 'per night',
      pricePerMonth: 'per month',
      pricePerHour: 'per hour',
      overview: 'Overview',
      capacity: 'Capacity',
      maxGuests: 'Max guests',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      showers: 'Showers',
      livingRooms: 'Living rooms',
      kitchens: 'Kitchens',
      balconies: 'Balconies',
      details: 'Details',
      floor: 'Floor',
      area: 'Area',
      view: 'View',
      bedType: 'Bed type',
      amenities: 'Amenities',
      establishment: 'Establishment',
      location: 'Location',
      contact: 'Contact',
      phone: 'Phone',
      email: 'Email',
      available: 'Available',
      unavailable: 'Unavailable',
      loading: 'Loading...',
      notFound: 'Accommodation not found',
      description: 'Description',
      noDescription: 'No description available',
    },
  };

  const t = content[language as keyof typeof content];

  const getPricingLabel = (mode: string) => {
    if (mode === 'nightly') return t.pricePerNight;
    if (mode === 'monthly') return t.pricePerMonth;
    if (mode === 'hourly') return t.pricePerHour;
    return t.pricePerNight;
  };

  const handleBooking = () => {
    if (accommodation) {
      const establishmentId = accommodation.establishmentId._id || accommodation.establishmentId.id;
      router.push(`/booking?establishment=${establishmentId}&accommodation=${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button Skeleton */}
          <div className="mb-6 h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-40 animate-pulse"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery Skeleton */}
              <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="relative h-96 bg-[hsl(var(--color-luxury-text))]/5"></div>
                <div className="p-4 flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-20 h-20 bg-[hsl(var(--color-luxury-text))]/5 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Overview Card Skeleton */}
              <div className="bg-white rounded-2xl p-6 space-y-6 animate-pulse">
                {/* Title */}
                <div className="space-y-2">
                  <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-2/3"></div>
                  <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-1/4"></div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-3/4"></div>
                  </div>
                </div>

                {/* Capacity Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-white rounded-lg">
                      <div className="h-8 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-12 mx-auto mb-2"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-20 mx-auto"></div>
                    </div>
                  ))}
                </div>

                {/* Additional Capacity */}
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-white rounded-lg">
                      <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-8 mx-auto mb-1"></div>
                      <div className="h-3 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>

                {/* Details Section */}
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-24"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-16"></div>
                        <div className="h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities Card Skeleton */}
              <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded flex-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Booking Card Skeleton */}
              <div className="bg-white rounded-2xl shadow-card-luxury border-2 border-gray-100 p-6 animate-pulse">
                <div className="mb-6 space-y-3">
                  <div className="h-10 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-48"></div>
                  <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>
                  <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-40"></div>
                </div>

                <div className="h-14 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-lg mb-3"></div>
              </div>

              {/* Establishment Info Card Skeleton */}
              <div className="bg-white rounded-2xl shadow-card-luxury p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-32"></div>

                <div className="space-y-4">
                  {/* Establishment Name */}
                  <div className="h-7 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-3/4"></div>

                  {/* Location Section */}
                  <div className="space-y-2">
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-24"></div>
                    <div className="flex items-start">
                      <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded mr-2 flex-shrink-0 mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-full"></div>
                        <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded w-20"></div>

                    {/* Phone */}
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded mr-2"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded flex-1"></div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded mr-2"></div>
                      <div className="h-4 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-40 pb-20">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-luxury-dark mb-4">{t.notFound}</h2>
          <p className="text-luxury-text mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-lg  transition"
          >
            {t.backToList}
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = accommodation.status === 'available';

  return (
    <div className="min-h-screen pt-40 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
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
          {t.backToList}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-luxury-cream rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <img
                  src={
                    accommodation.images[selectedImage] ||
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      isAvailable
                        ? 'bg-green-700 text-luxury-cream'
                        : 'bg-red-700 text-luxury-cream'
                    }`}
                  >
                    {isAvailable ? t.available : t.unavailable}
                  </span>
                </div>
              </div>
              {accommodation.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {accommodation.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === idx ? 'border-luxury-gold' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${accommodation.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            <div className="bg-luxury-cream rounded-2xl p-6">
              <h1 className="text-3xl font-bold text-luxury-dark mb-2">{accommodation.name}</h1>
              <p className="text-lg text-luxury-text mb-4 capitalize">{accommodation.type}</p>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-luxury-dark mb-3">{t.description}</h2>
                <p className="text-luxury-text leading-relaxed">
                  {accommodation.description || t.noDescription}
                </p>
              </div>

              {/* Capacity Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-luxury-gold">
                    {accommodation.capacity.maxGuests}
                  </div>
                  <div className="text-sm text-luxury-text">{t.maxGuests}</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-luxury-gold">
                    {accommodation.capacity.bedrooms}
                  </div>
                  <div className="text-sm text-luxury-text">{t.bedrooms}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {accommodation.capacity.bathrooms}
                  </div>
                  <div className="text-sm text-luxury-text">{t.bathrooms}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {accommodation.capacity.showers}
                  </div>
                  <div className="text-sm text-luxury-text">{t.showers}</div>
                </div>
              </div>

              {/* Additional Capacity */}
              {(accommodation.capacity.livingRooms > 0 ||
                accommodation.capacity.kitchens > 0 ||
                accommodation.capacity.balconies > 0) && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {accommodation.capacity.livingRooms > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-luxury-text">
                        {accommodation.capacity.livingRooms}
                      </div>
                      <div className="text-xs text-luxury-text">{t.livingRooms}</div>
                    </div>
                  )}
                  {accommodation.capacity.kitchens > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-luxury-text">
                        {accommodation.capacity.kitchens}
                      </div>
                      <div className="text-xs text-luxury-text">{t.kitchens}</div>
                    </div>
                  )}
                  {accommodation.capacity.balconies > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-luxury-text">
                        {accommodation.capacity.balconies}
                      </div>
                      <div className="text-xs text-luxury-text">{t.balconies}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              {accommodation.details && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-luxury-dark mb-4">{t.details}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {accommodation.details.floor !== undefined && (
                      <div>
                        <div className="text-sm text-luxury-text">{t.floor}</div>
                        <div className="text-luxury-dark font-medium">
                          {accommodation.details.floor}
                        </div>
                      </div>
                    )}
                    {accommodation.details.area && (
                      <div>
                        <div className="text-sm text-luxury-text">{t.area}</div>
                        <div className="text-luxury-dark font-medium">
                          {accommodation.details.area} m²
                        </div>
                      </div>
                    )}
                    {accommodation.details.view && (
                      <div>
                        <div className="text-sm text-luxury-text">{t.view}</div>
                        <div className="text-luxury-dark font-medium">
                          {accommodation.details.view}
                        </div>
                      </div>
                    )}
                    {accommodation.details.bedType && (
                      <div>
                        <div className="text-sm text-luxury-text">{t.bedType}</div>
                        <div className="text-luxury-dark font-medium">
                          {accommodation.details.bedType}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            {accommodation.amenities.length > 0 && (
              <div className="bg-luxury-cream rounded-2xl p-6">
                <h2 className="text-xl font-bold text-luxury-dark mb-4">{t.amenities}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {accommodation.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-luxury-text">
                      <svg
                        className="w-5 h-5 text-green-700 flex-shrink-0"
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
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-luxury border-2 border-amber-100 p-6 sticky top-32">
              <div className="mb-6 text-center">
                <div className="text-4xl font-bold text-luxury-gold mb-1">
                  {accommodation.pricing.basePrice.toLocaleString()}{' '}
                  {accommodation.pricing.currency}
                </div>
                <div className="text-sm text-luxury-text">
                  {getPricingLabel(accommodation.pricingMode)}
                </div>
                {accommodation.pricing.seasonalPrice && (
                  <div className="mt-2 text-sm text-luxury-text">
                    Prix haute saison: {accommodation.pricing.seasonalPrice.toLocaleString()}{' '}
                    {accommodation.pricing.currency}
                  </div>
                )}
              </div>

              <button
                onClick={handleBooking}
                disabled={!isAvailable}
                className="w-full px-6 py-4 bg-gradient-luxury text-luxury-cream rounded-xl  hover:shadow-xl transition-all duration-200 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg shadow-lg flex items-center justify-center space-x-2 transform hover:scale-105 disabled:transform-none"
                title={
                  !isAvailable
                    ? 'Hébergement non disponible actuellement'
                    : 'Réserver cet hébergement'
                }
              >
                <span>{t.bookNow}</span>
              </button>

              {!isAvailable && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-center flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    Cet hébergement n'est pas disponible pour le moment
                  </p>
                </div>
              )}
            </div>

            {/* Establishment Info */}
            <div className="bg-white rounded-2xl shadow-card-luxury p-6">
              <h2 className="text-xl font-bold text-luxury-text mb-4">{t.establishment}</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-luxury-dark mb-2">
                    {accommodation.establishmentId.name}
                  </h3>
                </div>

                <div>
                  <div className="text-sm font-medium text-luxury-text mb-1">{t.location}</div>
                  <div className="flex items-start text-luxury-text">
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-luxury-gold"
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
                    <div>
                      <div>{accommodation.establishmentId.location.address}</div>
                      <div>
                        {accommodation.establishmentId.location.city},{' '}
                        {accommodation.establishmentId.location.country}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-luxury-text mb-2">{t.contact}</div>

                  {accommodation.establishmentId.contacts.phone && (
                    <div className="flex items-center text-luxury-text mb-2">
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <a
                        href={`tel:${accommodation.establishmentId.contacts.phone}`}
                        className="hover:text-luxury-gold"
                      >
                        {accommodation.establishmentId.contacts.phone}
                      </a>
                    </div>
                  )}

                  {accommodation.establishmentId.contacts.email && (
                    <div className="flex items-center text-luxury-text">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href={`mailto:${accommodation.establishmentId.contacts.email}`}
                        className="hover:text-luxury-gold"
                      >
                        {accommodation.establishmentId.contacts.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
