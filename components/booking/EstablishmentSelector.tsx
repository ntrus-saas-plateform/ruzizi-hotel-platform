'use client';

import { useState, useEffect } from 'react';
import type { EstablishmentResponse } from '@/types/establishment.types';
import type { AccommodationResponse, AccommodationType, AccommodationPricingMode } from '@/types/accommodation.types';

interface EstablishmentSelectorProps {
  selectedEstablishment: string | null;
  selectedAccommodation: string | null;
  onEstablishmentChange: (establishmentId: string | null) => void;
  onAccommodationChange: (accommodationId: string | null, accommodation: AccommodationResponse | null) => void;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

export default function EstablishmentSelector({
  selectedEstablishment,
  selectedAccommodation,
  onEstablishmentChange,
  onAccommodationChange,
  checkInDate,
  checkOutDate,
  numberOfGuests = 1
}: EstablishmentSelectorProps) {
  const [establishments, setEstablishments] = useState<EstablishmentResponse[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [accommodationsLoading, setAccommodationsLoading] = useState(false);
  const [language, setLanguage] = useState('fr');

  // Filtres pour les hébergements
  const [typeFilter, setTypeFilter] = useState<AccommodationType | ''>('');
  const [pricingModeFilter, setPricingModeFilter] = useState<AccommodationPricingMode | ''>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (selectedEstablishment) {
      fetchAccommodations();
    } else {
      setAccommodations([]);
      onAccommodationChange(null, null);
    }
  }, [selectedEstablishment, typeFilter, pricingModeFilter, priceRange, searchTerm, checkInDate, checkOutDate, numberOfGuests]);

  const content = {
    fr: {
      selectEstablishment: "Sélectionner un établissement",
      selectAccommodation: "Choisir votre hébergement",
      noEstablishments: "Aucun établissement disponible",
      noAccommodations: "Aucun hébergement disponible",
      loading: "Chargement...",
      filters: "Filtres",
      type: "Type d'hébergement",
      pricingMode: "Mode de tarification",
      priceRange: "Gamme de prix",
      search: "Rechercher",
      all: "Tous",
      standardRoom: "Chambre standard",
      suite: "Suite",
      house: "Maison de passage",
      apartment: "Appartement",
      nightly: "Par nuit",
      monthly: "Par mois",
      hourly: "Par heure",
      from: "De",
      to: "à",
      bif: "BIF",
      guests: "invités",
      guest: "invité",
      bedrooms: "chambres",
      bedroom: "chambre",
      bathrooms: "salles de bain",
      bathroom: "salle de bain",
      available: "Disponible",
      perNight: "par nuit",
      perMonth: "par mois",
      perHour: "par heure",
      clearFilters: "Effacer les filtres"
    },
    en: {
      selectEstablishment: "Select an establishment",
      selectAccommodation: "Choose your accommodation",
      noEstablishments: "No establishments available",
      noAccommodations: "No accommodations available",
      loading: "Loading...",
      filters: "Filters",
      type: "Accommodation type",
      pricingMode: "Pricing mode",
      priceRange: "Price range",
      search: "Search",
      all: "All",
      standardRoom: "Standard room",
      suite: "Suite",
      house: "Guesthouse",
      apartment: "Apartment",
      nightly: "Per night",
      monthly: "Per month",
      hourly: "Per hour",
      from: "From",
      to: "to",
      bif: "BIF",
      guests: "guests",
      guest: "guest",
      bedrooms: "bedrooms",
      bedroom: "bedroom",
      bathrooms: "bathrooms",
      bathroom: "bathroom",
      available: "Available",
      perNight: "per night",
      perMonth: "per month",
      perHour: "per hour",
      clearFilters: "Clear filters"
    }
  };

  const t = content[language as keyof typeof content];

  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/public/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching establishments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodations = async () => {
    if (!selectedEstablishment) return;
    
    setAccommodationsLoading(true);
    try {
      const params = new URLSearchParams({
        establishmentId: selectedEstablishment,
        status: 'available'
      });

      if (typeFilter) params.append('type', typeFilter);
      if (pricingModeFilter) params.append('pricingMode', pricingModeFilter);
      if (priceRange.min > 0) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max < 1000000) params.append('maxPrice', priceRange.max.toString());
      if (numberOfGuests > 1) params.append('minGuests', numberOfGuests.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (checkInDate) params.append('checkInDate', checkInDate);
      if (checkOutDate) params.append('checkOutDate', checkOutDate);

      const response = await fetch(`/api/public/accommodations?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setAccommodationsLoading(false);
    }
  };

  const getTypeLabel = (type: AccommodationType) => {
    const labels = {
      standard_room: t.standardRoom,
      suite: t.suite,
      house: t.house,
      apartment: t.apartment
    };
    return labels[type] || type;
  };

  const getPricingModeLabel = (mode: AccommodationPricingMode) => {
    const labels = {
      nightly: t.nightly,
      monthly: t.monthly,
      hourly: t.hourly
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
  };

  const hasActiveFilters = typeFilter || pricingModeFilter || priceRange.min > 0 || priceRange.max < 1000000 || searchTerm;

  return (
    <div className="space-y-8">
      {/* Sélection d'établissement */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t.selectEstablishment}</h3>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t.loading}</p>
          </div>
        ) : establishments.length === 0 ? (
          <p className="text-gray-600 text-center py-4">{t.noEstablishments}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {establishments.map((establishment) => (
              <div
                key={establishment.id}
                onClick={() => onEstablishmentChange(establishment.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedEstablishment === establishment.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                }`}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{establishment.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {establishment.location.city}, {establishment.location.country || 'Burundi'}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.selectAccommodation}</h3>
            </div>
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

          {/* Filtres */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-amber-200">
            <h4 className="font-semibold text-gray-900 mb-4">{t.filters}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type d'hébergement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.type}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as AccommodationType | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.pricingMode}</label>
                <select
                  value={pricingModeFilter}
                  onChange={(e) => setPricingModeFilter(e.target.value as AccommodationPricingMode | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">{t.all}</option>
                  <option value="nightly">{t.nightly}</option>
                  <option value="monthly">{t.monthly}</option>
                  <option value="hourly">{t.hourly}</option>
                </select>
              </div>

              {/* Gamme de prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.priceRange}</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder={t.from}
                    value={priceRange.min || ''}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t.to}
                    value={priceRange.max === 1000000 ? '' : priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 1000000 }))}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Recherche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.search}</label>
                <input
                  type="text"
                  placeholder="Nom, équipements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Liste des hébergements */}
          {accommodationsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t.loading}</p>
            </div>
          ) : accommodations.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <p className="text-gray-600">{t.noAccommodations}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((accommodation) => (
                <div
                  key={accommodation.id}
                  onClick={() => onAccommodationChange(accommodation.id, accommodation)}
                  className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                    selectedAccommodation === accommodation.id
                      ? 'border-amber-500 shadow-lg transform scale-105'
                      : 'border-gray-200 hover:border-amber-300 hover:shadow-md'
                  }`}
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {accommodation.images[0] ? (
                      <img
                        src={accommodation.images[0]}
                        alt={accommodation.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        {t.available}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{accommodation.name}</h4>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        {getTypeLabel(accommodation.type)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {accommodation.capacity.maxGuests} {accommodation.capacity.maxGuests === 1 ? t.guest : t.guests}
                      </div>
                      
                      {accommodation.capacity.bedrooms > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          {accommodation.capacity.bedrooms} {accommodation.capacity.bedrooms === 1 ? t.bedroom : t.bedrooms}
                        </div>
                      )}

                      {accommodation.capacity.bathrooms > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          {accommodation.capacity.bathrooms} {accommodation.capacity.bathrooms === 1 ? t.bathroom : t.bathrooms}
                        </div>
                      )}
                    </div>

                    {/* Équipements */}
                    {accommodation.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {amenity}
                            </span>
                          ))}
                          {accommodation.amenities.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{accommodation.amenities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prix */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">
                        {getPricingText(accommodation)}
                      </p>
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