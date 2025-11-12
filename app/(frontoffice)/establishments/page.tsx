'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EstablishmentCard from '@/components/frontoffice/EstablishmentCard';
import type { EstablishmentResponse } from '@/types/establishment.types';

export default function PublicEstablishmentsPage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [pricingModeFilter, setPricingModeFilter] = useState<'nightly' | 'monthly' | ''>('');
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    fetchEstablishments();
  }, [searchTerm, cityFilter, pricingModeFilter]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (cityFilter) params.append('city', cityFilter);
      if (pricingModeFilter) params.append('pricingMode', pricingModeFilter);

      const response = await fetch(`/api/public/establishments?${params.toString()}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch establishments');
      }

      setEstablishments(data.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Nos Établissements",
      subtitle: "Découvrez nos hébergements d'exception au Burundi",
      filterTitle: "Filtrer les établissements",
      search: "Rechercher",
      searchPlaceholder: "Nom, description...",
      city: "Ville",
      cityPlaceholder: "Bujumbura, Gitega...",
      pricingMode: "Mode de tarification",
      all: "Tous",
      nightly: "Par nuitée",
      monthly: "Par mois",
      loading: "Chargement...",
      noResults: "Aucun établissement trouvé",
      noResultsDesc: "Essayez de modifier vos critères de recherche",
      places: "places",
      clearFilters: "Effacer les filtres"
    },
    en: {
      title: "Our Establishments",
      subtitle: "Discover our exceptional accommodations in Burundi",
      filterTitle: "Filter establishments",
      search: "Search",
      searchPlaceholder: "Name, description...",
      city: "City",
      cityPlaceholder: "Bujumbura, Gitega...",
      pricingMode: "Pricing mode",
      all: "All",
      nightly: "Per night",
      monthly: "Per month",
      loading: "Loading...",
      noResults: "No establishments found",
      noResultsDesc: "Try modifying your search criteria",
      places: "places",
      clearFilters: "Clear filters"
    }
  };

  const t = content[language as keyof typeof content];

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setPricingModeFilter('');
  };

  const hasActiveFilters = searchTerm || cityFilter || pricingModeFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32">
      {/* Hero Header */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Advanced Filters */}
        <div className="mb-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {t.filterTitle}
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-amber-600 hover:text-amber-700 font-medium flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{t.clearFilters}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{t.search}</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{t.city}</label>
              <div className="relative">
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder={t.cityPlaceholder}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{t.pricingMode}</label>
              <div className="relative">
                <select
                  value={pricingModeFilter}
                  onChange={(e) => setPricingModeFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                >
                  <option value="">{t.all}</option>
                  <option value="nightly">{t.nightly}</option>
                  <option value="monthly">{t.monthly}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-amber-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="ml-4 text-lg text-gray-600 font-medium">{t.loading}</p>
          </div>
        ) : (
          /* Establishments Grid */
          <>
            {establishments.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.noResults}</h3>
                <p className="text-gray-600 mb-6">{t.noResultsDesc}</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">{establishments.length}</span> établissement{establishments.length > 1 ? 's' : ''} trouvé{establishments.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Establishments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {establishments.map((establishment) => (
                    <EstablishmentCard
                      key={establishment.id}
                      id={establishment.id}
                      name={establishment.name}
                      description={establishment.description || "Découvrez le confort et l'élégance dans cet établissement d'exception."}
                      image={establishment.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                      location={`${establishment.location?.city || 'Bujumbura'}, ${establishment.location?.country || 'Burundi'}`}
                      rating={4.5 + Math.random() * 0.5} // Random rating between 4.5-5.0
                      reviewCount={Math.floor(Math.random() * 200) + 50} // Random reviews 50-250
                      priceRange={establishment.pricingMode === 'nightly' ? '$$-$$$' : '$$$-$$$$'}
                      amenities={establishment.services || ['WiFi gratuit', 'Parking', 'Restaurant']}
                      isAvailable={true}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
