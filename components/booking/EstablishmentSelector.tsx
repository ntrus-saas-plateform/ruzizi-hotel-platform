'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import type { EstablishmentResponse } from '@/types/establishment.types';
import type {
  AccommodationResponse,
  AccommodationType,
  AccommodationPricingMode,
} from '@/types/accommodation.types';

interface EstablishmentSelectorProps {
  selectedEstablishment: string | null;
  selectedAccommodation: string | null;
  onEstablishmentChange: (establishmentId: string | null) => void;
  onAccommodationChange: (
    accommodationId: string | null,
    accommodation: AccommodationResponse | null
  ) => void;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'capacity-desc' | 'rating-desc';

export default function EstablishmentSelector({
  selectedEstablishment,
  selectedAccommodation,
  onEstablishmentChange,
  onAccommodationChange,
  checkInDate,
  checkOutDate,
  numberOfGuests = 1,
}: EstablishmentSelectorProps) {
  const [language, setLanguage] = useState('fr');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Filtres pour les hébergements
  const [typeFilter, setTypeFilter] = useState<AccommodationType | ''>('');
  const [pricingModeFilter, setPricingModeFilter] = useState<AccommodationPricingMode | ''>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000000,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [minBedrooms, setMinBedrooms] = useState<number>(0);
  const [minBathrooms, setMinBathrooms] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  // SWR fetcher function
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  // Use SWR for establishments data
  const {
    data: establishmentsData,
    error: establishmentsError,
    isLoading: establishmentsLoading,
  } = useSWR('/api/public/establishments', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // 5 minutes
  });

  // Use SWR for accommodations data
  const accommodationsUrl = selectedEstablishment
    ? (() => {
        const params = new URLSearchParams({
          establishmentId: selectedEstablishment,
          status: 'available',
        });

        if (typeFilter) params.append('type', typeFilter);
        if (pricingModeFilter) params.append('pricingMode', pricingModeFilter);
        if (priceRange.min > 0) params.append('minPrice', priceRange.min.toString());
        if (priceRange.max < 1000000) params.append('maxPrice', priceRange.max.toString());
        if (numberOfGuests > 1) params.append('minGuests', numberOfGuests.toString());
        if (searchTerm) params.append('search', searchTerm);
        if (checkInDate) params.append('checkInDate', checkInDate);
        if (checkOutDate) params.append('checkOutDate', checkOutDate);

        return `/api/public/accommodations?${params.toString()}`;
      })()
    : null;
  const {
    data: accommodationsData,
    error: accommodationsError,
    isLoading: accommodationsLoadingData,
  } = useSWR(accommodationsUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000,
  });

  // Data from SWR
  const establishments = establishmentsData?.data?.data || establishmentsData?.data || [];
  const accommodations = accommodationsData?.data?.data || accommodationsData?.data || [];
  const loading = establishmentsLoading;
  const accommodationsLoading = accommodationsLoadingData;

  useEffect(() => {
    if (!selectedEstablishment) {
      onAccommodationChange(null, null);
    }
  }, [selectedEstablishment, onAccommodationChange]);

  const content = {
    fr: {
      selectEstablishment: 'Sélectionner un établissement',
      selectAccommodation: 'Choisir votre hébergement',
      noEstablishments: 'Aucun établissement disponible',
      noAccommodations: 'Aucun hébergement disponible',
      loading: 'Chargement...',
      filters: 'Filtres',
      type: "Type d'hébergement",
      pricingMode: 'Mode de tarification',
      priceRange: 'Gamme de prix',
      search: 'Rechercher',
      all: 'Tous',
      standardRoom: 'Chambre standard',
      suite: 'Suite',
      house: 'Maison de passage',
      apartment: 'Appartement',
      nightly: 'Par nuit',
      monthly: 'Par mois',
      hourly: 'Par heure',
      from: 'De',
      to: 'à',
      bif: 'BIF',
      guests: 'invités',
      guest: 'invité',
      bedrooms: 'chambres',
      bedroom: 'chambre',
      bathrooms: 'salles de bain',
      bathroom: 'salle de bain',
      available: 'Disponible',
      perNight: 'par nuit',
      perMonth: 'par mois',
      perHour: 'par heure',
      clearFilters: 'Effacer les filtres',
      showFilters: 'Afficher les filtres',
      hideFilters: 'Masquer les filtres',
      sortBy: 'Trier par',
      priceLowToHigh: 'Prix croissant',
      priceHighToLow: 'Prix décroissant',
      nameAZ: 'Nom (A-Z)',
      capacityHighToLow: 'Capacité décroissante',
      ratingHighToLow: 'Note décroissante',
      gridView: 'Vue grille',
      listView: 'Vue liste',
      minBedrooms: 'Chambres min.',
      minBathrooms: 'Salles de bain min.',
      amenities: 'Équipements',
      results: 'résultats',
      selected: 'Sélectionné',
      viewDetails: 'Voir détails',
      selectThis: 'Sélectionner',
      area: 'Superficie',
      floor: 'Étage',
    },
    en: {
      selectEstablishment: 'Select an establishment',
      selectAccommodation: 'Choose your accommodation',
      noEstablishments: 'No establishments available',
      noAccommodations: 'No accommodations available',
      loading: 'Loading...',
      filters: 'Filters',
      type: 'Accommodation type',
      pricingMode: 'Pricing mode',
      priceRange: 'Price range',
      search: 'Search',
      all: 'All',
      standardRoom: 'Standard room',
      suite: 'Suite',
      house: 'Guesthouse',
      apartment: 'Apartment',
      nightly: 'Per night',
      monthly: 'Per month',
      hourly: 'Per hour',
      from: 'From',
      to: 'to',
      bif: 'BIF',
      guests: 'guests',
      guest: 'guest',
      bedrooms: 'bedrooms',
      bedroom: 'bedroom',
      bathrooms: 'bathrooms',
      bathroom: 'bathroom',
      available: 'Available',
      perNight: 'per night',
      perMonth: 'per month',
      perHour: 'per hour',
      clearFilters: 'Clear filters',
      showFilters: 'Show filters',
      hideFilters: 'Hide filters',
      sortBy: 'Sort by',
      priceLowToHigh: 'Price: Low to High',
      priceHighToLow: 'Price: High to Low',
      nameAZ: 'Name (A-Z)',
      capacityHighToLow: 'Capacity: High to Low',
      ratingHighToLow: 'Rating: High to Low',
      gridView: 'Grid view',
      listView: 'List view',
      minBedrooms: 'Min. bedrooms',
      minBathrooms: 'Min. bathrooms',
      amenities: 'Amenities',
      results: 'results',
      selected: 'Selected',
      viewDetails: 'View details',
      selectThis: 'Select',
      area: 'Area',
      floor: 'Floor',
    },
  };

  const t = content[language as keyof typeof content];

  const getTypeLabel = (type: AccommodationType) => {
    const labels = {
      standard_room: t.standardRoom,
      suite: t.suite,
      house: t.house,
      apartment: t.apartment,
    };
    return labels[type] || type;
  };

  const getPricingModeLabel = (mode: AccommodationPricingMode) => {
    const labels = {
      nightly: t.nightly,
      monthly: t.monthly,
      hourly: t.hourly,
    };
    return labels[mode] || mode;
  };

  const getPricingText = (accommodation: AccommodationResponse) => {
    const price = accommodation.pricing.basePrice.toLocaleString();
    const mode = accommodation.pricingMode;
    const modeText = mode === 'nightly' ? t.perNight : mode === 'monthly' ? t.perMonth : t.perHour;
    return `${price} ${t.bif} ${modeText}`;
  };

  const clearFilters = () => {
    setTypeFilter('');
    setPricingModeFilter('');
    setPriceRange({ min: 0, max: 1000000 });
    setSearchTerm('');
    setMinBedrooms(0);
    setMinBathrooms(0);
    setSelectedAmenities([]);
  };

  const hasActiveFilters =
    typeFilter ||
    pricingModeFilter ||
    priceRange.min > 0 ||
    priceRange.max < 1000000 ||
    searchTerm ||
    minBedrooms > 0 ||
    minBathrooms > 0 ||
    selectedAmenities.length > 0;

  // Get all unique amenities from accommodations
  const allAmenities = Array.from(
    new Set(
      Array.isArray(accommodations) ? accommodations.flatMap((acc) => acc.amenities || []) : []
    )
  );

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Filter and sort accommodations
  const getFilteredAndSortedAccommodations = () => {
    if (!Array.isArray(accommodations)) return [];
    let filtered = [...accommodations];

    // Apply bedroom filter
    if (minBedrooms > 0) {
      filtered = filtered.filter((acc) => acc.capacity.bedrooms >= minBedrooms);
    }

    // Apply bathroom filter
    if (minBathrooms > 0) {
      filtered = filtered.filter((acc) => acc.capacity.bathrooms >= minBathrooms);
    }

    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((acc) =>
        selectedAmenities.every((amenity) => acc.amenities.includes(amenity))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.pricing.basePrice - b.pricing.basePrice;
        case 'price-desc':
          return b.pricing.basePrice - a.pricing.basePrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'capacity-desc':
          return b.capacity.maxGuests - a.capacity.maxGuests;
        case 'rating-desc':
          return 0; // Placeholder for rating
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredAccommodations = getFilteredAndSortedAccommodations();

  return (
    <div className="space-y-8">
      {/* Sélection d'établissement */}
      <div className="py-10">
        <div className="flex items-center mb-4">
          <h3 className="text-xl font-bold text-luxury-dark">{t.selectEstablishment}</h3>
        </div>

        {loading ? (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-[hsl(var(--color-luxury-text))]/5 animate-pulse"
              >
                <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[hsl(var(--color-luxury-text))]/5 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-[hsl(var(--color-luxury-text))]/5 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : establishmentsError ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
            <p className="text-luxury-text text-sm">
              Impossible de charger les établissements. Veuillez réessayer.
            </p>
          </div>
        ) : establishments.length === 0 ? (
          <p className="text-luxury-text text-center py-4">{t.noEstablishments}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {establishments.map((establishment: EstablishmentResponse) => (
              <div
                key={establishment.id}
                onClick={() => onEstablishmentChange(establishment.id)}
                className={`p-4 bg-luxury-cream rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedEstablishment === establishment.id
                    ? 'border-luxury-gold shadow-card-luxury'
                    : 'border-[hsl(var(--color-luxury-text))]/20 hover:border-[hsl(var(--color-luxury-gold))]'
                }`}
              >
                <h4 className="font-semibold text-luxury-dark mb-2">{establishment.name}</h4>
                <p className="text-sm text-luxury-text mb-2">
                  {establishment.location.city}, {establishment.location.country || 'Burundi'}
                </p>
                <div className="flex items-center text-xs text-luxury-text">
                  <svg
                    className="w-4 h-4 mr-1"
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
                  {establishment.location.address}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sélection d'hébergement */}
      {selectedEstablishment && (
        <div className="py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center">
              <div>
                <h3 className="text-xl font-bold text-luxury-dark">{t.selectAccommodation}</h3>
                <p className="text-sm text-luxury-text">
                  {filteredAccommodations.length} {t.results}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-white rounded-lg border border-amber-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded transition-all ${
                    viewMode === 'grid'
                      ? 'bg-luxury-gold text-luxury-cream'
                      : 'text-luxury-text hover:text-[hsl(var(--color-luxury-gold))]'
                  }`}
                  title={t.gridView}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded transition-all ${
                    viewMode === 'list'
                      ? 'bg-luxury-gold text-luxury-cream'
                      : 'text-luxury-text hover:text-[hsl(var(--color-luxury-gold))]'
                  }`}
                  title={t.listView}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white border border-amber-100 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 text-sm"
              >
                <option value="price-asc">{t.priceLowToHigh}</option>
                <option value="price-desc">{t.priceHighToLow}</option>
                <option value="name-asc">{t.nameAZ}</option>
                <option value="capacity-desc">{t.capacityHighToLow}</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {showFilters ? t.hideFilters : t.showFilters}
                </span>
                {hasActiveFilters && <span className="w-2 h-2 bg-luxury-gold rounded-full"></span>}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-luxury-gold font-medium flex items-center space-x-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-sm">{t.clearFilters}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="mb-6 p-6 bg-white rounded-xl border border-amber-100 shadow-card-luxury">
              <h4 className="font-semibold text-luxury-dark mb-4 flex items-center">
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                {t.filters}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type d'hébergement */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.type}
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as AccommodationType | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="">{t.all}</option>
                    <option value="standard_room">{t.standardRoom}</option>
                    <option value="suite">{t.suite}</option>
                    <option value="house">{t.house}</option>
                    <option value="apartment">{t.apartment}</option>
                  </select>
                </div>

                {/* Mode de tarification */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.pricingMode}
                  </label>
                  <select
                    value={pricingModeFilter}
                    onChange={(e) =>
                      setPricingModeFilter(e.target.value as AccommodationPricingMode | '')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="">{t.all}</option>
                    <option value="nightly">{t.nightly}</option>
                    <option value="monthly">{t.monthly}</option>
                    <option value="hourly">{t.hourly}</option>
                  </select>
                </div>

                {/* Gamme de prix */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.priceRange}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder={t.from}
                      value={priceRange.min || ''}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, min: parseInt(e.target.value) || 0 }))
                      }
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 text-sm"
                    />
                    <input
                      type="number"
                      placeholder={t.to}
                      value={priceRange.max === 1000000 ? '' : priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: parseInt(e.target.value) || 1000000,
                        }))
                      }
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90 text-sm"
                    />
                  </div>
                </div>

                {/* Recherche */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.search}
                  </label>
                  <input
                    type="text"
                    placeholder="Nom, équipements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  />
                </div>

                {/* Min Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.minBedrooms}
                  </label>
                  <select
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="0">{t.all}</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}+
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-luxury-text mb-2">
                    {t.minBathrooms}
                  </label>
                  <select
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-luxury-gold))]/90 focus:border-[hsl(var(--color-luxury-gold))]/90"
                  >
                    <option value="0">{t.all}</option>
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num}+
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amenities Filter */}
              {allAmenities.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-luxury-text mb-3">
                    {t.amenities}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-luxury-gold text-luxury-cream shadow-md'
                            : 'bg-gray-100 text-luxury-text hover:bg-gray-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liste des hébergements */}
          {accommodationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-[hsl(var(--color-luxury-gold))]/10 overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-[hsl(var(--color-luxury-text))]/5"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[hsl(var(--color-luxury-text))]/5 rounded w-3/4"></div>
                    <div className="h-3 bg-[hsl(var(--color-luxury-text))]/5 rounded w-1/2"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-[hsl(var(--color-luxury-text))]/5 rounded w-16"></div>
                      <div className="h-6 bg-[hsl(var(--color-luxury-text))]/5 rounded w-20"></div>
                    </div>
                    <div className="h-8 bg-[hsl(var(--color-luxury-text))]/5 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : accommodationsError ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 text-red-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
              <p className="text-luxury-text text-sm">
                Impossible de charger les hébergements. Veuillez réessayer.
              </p>
            </div>
          ) : filteredAccommodations.length === 0 ? (
            <div className="text-center py-8">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
              <p className="text-luxury-text">{t.noAccommodations}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccommodations.map((accommodation) => (
                <div
                  key={accommodation.id}
                  onClick={() => onAccommodationChange(accommodation.id, accommodation)}
                  className={`bg-white rounded-xl shadow-card-luxury border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                    selectedAccommodation === accommodation.id
                      ? 'border-luxury-gold transform scale-105'
                      : 'border-[hsl(var(--color-luxury-text))]/5 hover:border-[hsl(var(--color-luxury-gold))]/70'
                  }`}
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {accommodation.images && accommodation.images[0] ? (
                      <Image
                        src={accommodation.images[0]}
                        alt={accommodation.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.image-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center image-fallback ${accommodation.images && accommodation.images[0] ? 'hidden' : 'flex'}`}
                    >
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                        />
                      </svg>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-700 text-luxury-cream text-xs rounded-full">
                        {t.available}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 flex justify-between items-center">
                        <h4 className="font-bold text-luxury-dark text-lg mb-1">
                          {accommodation.name}
                        </h4>
                        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                          {getTypeLabel(accommodation.type)}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Info */}
                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-luxury-cream rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-luxury-gold mb-1">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="text-sm font-semibold text-luxury-dark">
                          {accommodation.capacity.maxGuests}
                        </div>
                        <div className="text-xs text-gray-500">{t.guests}</div>
                      </div>

                      {accommodation.capacity.bedrooms > 0 && (
                        <div className="text-center">
                          <div className="flex items-center justify-center text-luxury-gold mb-1">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                              />
                            </svg>
                          </div>
                          <div className="text-sm font-semibold text-luxury-dark">
                            {accommodation.capacity.bedrooms}
                          </div>
                          <div className="text-xs text-gray-500">{t.bedrooms}</div>
                        </div>
                      )}

                      {accommodation.capacity.bathrooms > 0 && (
                        <div className="text-center">
                          <div className="flex items-center justify-center text-luxury-gold mb-1">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                              />
                            </svg>
                          </div>
                          <div className="text-sm font-semibold text-luxury-dark">
                            {accommodation.capacity.bathrooms}
                          </div>
                          <div className="text-xs text-gray-500">{t.bathrooms}</div>
                        </div>
                      )}
                    </div>

                    {/* Équipements */}
                    {accommodation.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {accommodation.amenities
                            .slice(0, 4)
                            .map((amenity: string, index: number) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 bg-[hsl(var(--color-luxury-gold-light))]/10 text-luxury-text text-xs rounded-full font-medium"
                              >
                                {amenity}
                              </span>
                            ))}
                          {accommodation.amenities.length > 4 && (
                            <span className="px-2.5 py-1 bg-luxury-text text-luxury-cream text-xs rounded-full font-medium">
                              +{accommodation.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prix */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {getPricingModeLabel(accommodation.pricingMode)}
                          </p>
                          <p className="text-2xl font-bold text-luxury-gold">
                            {accommodation.pricing.basePrice.toLocaleString()} {t.bif}
                          </p>
                        </div>
                        <button
                          onClick={() => onAccommodationChange(accommodation.id, accommodation)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedAccommodation === accommodation.id
                              ? 'bg-green-700 text-luxury-cream'
                              : 'bg-luxury-gold text-luxury-cream hover:bg-amber-700'
                          }`}
                        >
                          {selectedAccommodation === accommodation.id ? t.selected : t.selectThis}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredAccommodations.map((accommodation) => (
                <div
                  key={accommodation.id}
                  onClick={() => onAccommodationChange(accommodation.id, accommodation)}
                  className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-lg ${
                    selectedAccommodation === accommodation.id
                      ? 'border-amber-500 shadow-lg'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-64 h-48 md:h-auto bg-gray-200 relative overflow-hidden flex-shrink-0">
                      {accommodation.images && accommodation.images[0] ? (
                        <Image
                          src={accommodation.images[0]}
                          alt={accommodation.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 256px"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector(
                                '.image-fallback'
                              ) as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center image-fallback ${accommodation.images && accommodation.images[0] ? 'hidden' : 'flex'}`}
                      >
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-green-500 text-luxury-cream text-xs rounded-full font-medium shadow-lg">
                          {t.available}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-bold text-luxury-dark text-xl">
                              {accommodation.name}
                            </h4>
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                              {getTypeLabel(accommodation.type)}
                            </span>
                          </div>
                        </div>
                        {selectedAccommodation === accommodation.id && (
                          <div className="flex items-center space-x-2 text-green-600 font-medium ml-4">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{t.selected}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-luxury-text">
                          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">
                              {accommodation.capacity.maxGuests}
                            </div>
                            <div className="text-xs text-gray-500">{t.guests}</div>
                          </div>
                        </div>

                        {accommodation.capacity.bedrooms > 0 && (
                          <div className="flex items-center space-x-2 text-luxury-text">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
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
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold">
                                {accommodation.capacity.bedrooms}
                              </div>
                              <div className="text-xs text-gray-500">{t.bedrooms}</div>
                            </div>
                          </div>
                        )}

                        {accommodation.capacity.bathrooms > 0 && (
                          <div className="flex items-center space-x-2 text-luxury-text">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold">
                                {accommodation.capacity.bathrooms}
                              </div>
                              <div className="text-xs text-gray-500">{t.bathrooms}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {accommodation.amenities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {accommodation.amenities.map((amenity: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-luxury-text text-xs rounded-full font-medium"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {getPricingModeLabel(accommodation.pricingMode)}
                          </p>
                          <p className="text-3xl font-bold text-luxury-gold">
                            {accommodation.pricing.basePrice.toLocaleString()}{' '}
                            <span className="text-lg">{t.bif}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => onAccommodationChange(accommodation.id, accommodation)}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                            selectedAccommodation === accommodation.id
                              ? 'bg-green-600 text-luxury-cream'
                              : 'bg-luxury-gold text-luxury-cream hover:bg-amber-700'
                          }`}
                        >
                          {selectedAccommodation === accommodation.id ? t.selected : t.selectThis}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
