'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/frontoffice/Navigation';
import Footer from '@/components/frontoffice/Footer';
import EstablishmentCard from '@/components/frontoffice/EstablishmentCard';
import EstablishmentsMap from '@/components/maps/EstablishmentsMap';

export default function EstablishmentsPage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('fr');
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    amenities: [] as string[],
  });
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const content = {
    fr: {
      title: 'Nos Établissements',
      subtitle: "Découvrez nos hébergements d'exception à travers le Burundi",
      filters: 'Filtres',
      city: 'Ville',
      type: 'Type',
      amenities: 'Équipements',
      allCities: 'Toutes les villes',
      allTypes: 'Tous les types',
      results: 'résultat(s)',
      noResults: 'Aucun établissement trouvé',
      noResultsDesc: 'Essayez de modifier vos critères de recherche',
      clearFilters: 'Effacer les filtres',
      mapView: 'Vue carte',
      listView: 'Vue liste',
    },
    en: {
      title: 'Our Establishments',
      subtitle: 'Discover our exceptional accommodations across Burundi',
      filters: 'Filters',
      city: 'City',
      type: 'Type',
      amenities: 'Amenities',
      allCities: 'All cities',
      allTypes: 'All types',
      results: 'result(s)',
      noResults: 'No establishments found',
      noResultsDesc: 'Try modifying your search criteria',
      clearFilters: 'Clear filters',
      mapView: 'Map view',
      listView: 'List view',
    },
  };

  const t = content[language as keyof typeof content];

  const cities = Array.from(new Set(establishments.map((e) => e.location?.city).filter(Boolean)));
  const types = Array.from(new Set(establishments.map((e) => e.type).filter(Boolean)));
  const allAmenities = Array.from(new Set(establishments.flatMap((e) => e.services || [])));

  const filteredEstablishments = establishments.filter((est) => {
    if (filters.city && est.location?.city !== filters.city) return false;
    if (filters.type && est.type !== filters.type) return false;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => est.services?.includes(a)))
      return false;
    return true;
  });

  const clearFilters = () => {
    setFilters({
      city: '',
      type: '',
      amenities: [],
    });
  };

  const toggleAmenity = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <div className="min-h-screen pb-20 pt-48">
      <Navigation />

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-xl text-luxury-text">{t.subtitle}</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card-luxury border border-amber-100 p-6 lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-luxury-dark flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  {t.filters}
                </h2>
                {(filters.city || filters.type || filters.amenities.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.city}</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="">{t.allCities}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.type}</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="">{t.allTypes}</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type === 'hotel'
                          ? 'Hôtel'
                          : type === 'resort'
                            ? 'Resort'
                            : type === 'guesthouse'
                              ? "Maison d'hôtes"
                              : type === 'lodge'
                                ? 'Lodge'
                                : type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities Filter */}
                {allAmenities.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.amenities}
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allAmenities.slice(0, 10).map((amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filters.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Establishments Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-luxury-text">
                <span className="font-semibold text-luxury-dark">
                  {filteredEstablishments.length}
                </span>{' '}
                {t.results}
              </p>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-luxury-dark shadow-sm'
                      : 'text-gray-600 hover:text-luxury-dark'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {t.listView}
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white text-luxury-dark shadow-sm'
                      : 'text-gray-600 hover:text-luxury-dark'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.mapView}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
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
            ) : filteredEstablishments.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[hsl(var(--color-luxury-gold-light))]/10 rounded-full mb-6">
                  <svg
                    className="w-10 h-10 text-[hsl(var(--color-luxury-text))]/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-luxury-dark mb-2">{t.noResults}</h3>
                <p className="text-luxury-text mb-6">{t.noResultsDesc}</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-luxury rounded-2xl text-luxury-cream transition-colors font-medium"
                >
                  {t.clearFilters}
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <EstablishmentsMap
                establishments={filteredEstablishments}
                showAll={true}
                height="400px"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEstablishments.map((establishment) => (
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
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                    }
                    location={`${establishment.location?.city || 'Bujumbura'}, ${establishment.location?.country || 'Burundi'}`}
                    rating={4.8}
                    reviewCount={127}
                    priceRange={establishment.pricingMode === 'nightly' ? '🌙 Nuitée' : '📅 Mois'}
                    amenities={
                      establishment.services && establishment.services.length > 0
                        ? establishment.services.slice(0, 5)
                        : ['WiFi gratuit', 'Piscine', 'Restaurant']
                    }
                    isAvailable={establishment.isActive !== false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
