'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Accommodation {
  id: string;
  name: string;
  type: 'room' | 'guesthouse';
  establishmentId: string;
  establishmentName?: string;
  price?: number;
  pricing?: {
    basePrice: number;
    seasonalPrice?: number;
  };
  capacity?: number | {
    maxGuests: number;
  };
  images: string[];
  amenities: string[];
  isAvailable: boolean;
}

export default function AccommodationsSection() {
  const router = useRouter();
  const [language, setLanguage] = useState('fr');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEstablishment, setSelectedEstablishment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [capacity, setCapacity] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accomResponse, estabResponse] = await Promise.all([
        fetch('/api/public/accommodations'),
        fetch('/api/public/establishments')
      ]);

      const accomData = await accomResponse.json();
      const estabData = await estabResponse.json();

      console.log('Accommodations API response:', accomData);
      console.log('Establishments API response:', estabData);

      if (accomData.success) {
        // Normalize accommodations to extract establishment info
        const normalizedAccommodations = (accomData.data.data || accomData.data || []).map((accom: any) => {
          console.log('🔍 Processing accommodation:', accom.name);
          console.log('  Raw establishmentId:', accom.establishmentId);
          console.log('  Type:', typeof accom.establishmentId);

          let estId: string | undefined;
          let estName: string | undefined;

          if (typeof accom.establishmentId === 'object' && accom.establishmentId !== null) {
            // Try different possible ID fields
            estId = accom.establishmentId._id || 
                    accom.establishmentId.id || 
                    (typeof accom.establishmentId.toString === 'function' ? accom.establishmentId.toString() : undefined);
            estName = accom.establishmentId.name;
            console.log('  Object - _id:', accom.establishmentId._id);
            console.log('  Object - id:', accom.establishmentId.id);
            console.log('  Object - name:', accom.establishmentId.name);
          } else if (typeof accom.establishmentId === 'string') {
            estId = accom.establishmentId;
            console.log('  String ID:', estId);
          }

          console.log('✅ Extracted estId:', estId);
          console.log('✅ Extracted estName:', estName);

          const normalized = {
            ...accom,
            id: accom.id || accom._id,
            establishmentId: estId,
            establishmentName: estName || accom.establishmentName,
            isAvailable: accom.isAvailable !== undefined ? accom.isAvailable : accom.status === 'available'
          };

          console.log('📦 Normalized:', { 
            id: normalized.id, 
            name: normalized.name, 
            establishmentId: normalized.establishmentId,
            isAvailable: normalized.isAvailable 
          });

          return normalized;
        });

        console.log('Normalized accommodations:', normalizedAccommodations);
        setAccommodations(normalizedAccommodations);
      }
      if (estabData.success) {
        setEstablishments(estabData.data.data || estabData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Nos Chambres & Maisons de Passage",
      subtitle: "Trouvez l'hébergement parfait pour votre séjour",
      filterBy: "Filtrer par",
      establishment: "Établissement",
      allEstablishments: "Tous les établissements",
      type: "Type",
      allTypes: "Tous les types",
      room: "Chambre",
      guesthouse: "Maison de passage",
      priceRange: "Gamme de prix",
      allPrices: "Tous les prix",
      budget: "Budget (< 50,000 FBU)",
      standard: "Standard (50,000 - 100,000 FBU)",
      premium: "Premium (> 100,000 FBU)",
      capacity: "Capacité",
      allCapacities: "Toutes capacités",
      single: "1 personne",
      double: "2 personnes",
      family: "3+ personnes",
      perNight: "par nuit",
      persons: "personnes",
      available: "Disponible",
      unavailable: "Non disponible",
      bookNow: "Réserver",
      viewDetails: "Voir détails",
      noResults: "Aucun hébergement trouvé",
      noResultsDesc: "Essayez de modifier vos critères de recherche",
      resetFilters: "Réinitialiser les filtres",
      showing: "Affichage",
      of: "sur",
      results: "résultats",
      previous: "Précédent",
      next: "Suivant"
    },
    en: {
      title: "Our Rooms & Guesthouses",
      subtitle: "Find the perfect accommodation for your stay",
      filterBy: "Filter by",
      establishment: "Establishment",
      allEstablishments: "All establishments",
      type: "Type",
      allTypes: "All types",
      room: "Room",
      guesthouse: "Guesthouse",
      priceRange: "Price Range",
      allPrices: "All prices",
      budget: "Budget (< 50,000 FBU)",
      standard: "Standard (50,000 - 100,000 FBU)",
      premium: "Premium (> 100,000 FBU)",
      capacity: "Capacity",
      allCapacities: "All capacities",
      single: "1 person",
      double: "2 persons",
      family: "3+ persons",
      perNight: "per night",
      persons: "persons",
      available: "Available",
      unavailable: "Unavailable",
      bookNow: "Book Now",
      viewDetails: "View Details",
      noResults: "No accommodations found",
      noResultsDesc: "Try adjusting your search criteria",
      resetFilters: "Reset Filters",
      showing: "Showing",
      of: "of",
      results: "results",
      previous: "Previous",
      next: "Next"
    }
  };

  const t = content[language as keyof typeof content];

  // Filter accommodations
  const filteredAccommodations = accommodations.filter(accom => {
    if (selectedEstablishment !== 'all' && accom.establishmentId !== selectedEstablishment) return false;
    if (selectedType !== 'all' && accom.type !== selectedType) return false;

    const price = accom.price || accom.pricing?.basePrice || 0;
    if (priceRange !== 'all') {
      if (priceRange === 'budget' && price >= 50000) return false;
      if (priceRange === 'standard' && (price < 50000 || price > 100000)) return false;
      if (priceRange === 'premium' && price <= 100000) return false;
    }

    const maxGuests = typeof accom.capacity === 'number' ? accom.capacity : accom.capacity?.maxGuests || 0;
    if (capacity !== 'all') {
      if (capacity === 'single' && maxGuests !== 1) return false;
      if (capacity === 'double' && maxGuests !== 2) return false;
      if (capacity === 'family' && maxGuests < 3) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccommodations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccommodations = filteredAccommodations.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setSelectedEstablishment('all');
    setSelectedType('all');
    setPriceRange('all');
    setCapacity('all');
    setCurrentPage(1);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white via-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-amber-800 bg-clip-text text-transparent mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-12 border border-amber-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Establishment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.establishment}
              </label>
              <select
                value={selectedEstablishment}
                onChange={(e) => { setSelectedEstablishment(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
              >
                <option value="all">{t.allEstablishments}</option>
                {establishments.map(est => (
                  <option key={est.id} value={est.id}>{est.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.type}
              </label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
              >
                <option value="all">{t.allTypes}</option>
                <option value="room">{t.room}</option>
                <option value="guesthouse">{t.guesthouse}</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.priceRange}
              </label>
              <select
                value={priceRange}
                onChange={(e) => { setPriceRange(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
              >
                <option value="all">{t.allPrices}</option>
                <option value="budget">{t.budget}</option>
                <option value="standard">{t.standard}</option>
                <option value="premium">{t.premium}</option>
              </select>
            </div>

            {/* Capacity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.capacity}
              </label>
              <select
                value={capacity}
                onChange={(e) => { setCapacity(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
              >
                <option value="all">{t.allCapacities}</option>
                <option value="single">{t.single}</option>
                <option value="double">{t.double}</option>
                <option value="family">{t.family}</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Button */}
          {(selectedEstablishment !== 'all' || selectedType !== 'all' || priceRange !== 'all' || capacity !== 'all') && (
            <div className="mt-4 text-center">
              <button
                onClick={resetFilters}
                className="px-6 py-2 text-amber-600 hover:text-amber-700 font-medium flex items-center mx-auto space-x-2 hover:bg-amber-50 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t.resetFilters}</span>
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 text-center text-gray-600">
            {t.showing} {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAccommodations.length)} {t.of} {filteredAccommodations.length} {t.results}
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
          </div>
        ) : filteredAccommodations.length === 0 ? (
          /* No Results */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.noResults}</h3>
            <p className="text-gray-600 mb-6">{t.noResultsDesc}</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition font-medium"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <>
            {/* Accommodations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {paginatedAccommodations.map((accom) => (
                <div
                  key={accom.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:transform hover:-translate-y-2"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={accom.images[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                      alt={accom.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${accom.isAvailable
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        }`}>
                        {accom.isAvailable ? t.available : t.unavailable}
                      </span>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-medium">
                        {accom.type === 'room' ? t.room : t.guesthouse}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition">
                      {accom.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate">
                        {accom.establishmentName || 'Établissement'}
                      </span>
                    </p>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {accom.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                      {accom.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{accom.amenities.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Capacity & Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm">
                          {typeof accom.capacity === 'number'
                            ? accom.capacity
                            : accom.capacity?.maxGuests || 'N/A'} {t.persons}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          {(accom.price || accom.pricing?.basePrice || 0).toLocaleString()} FBU
                        </div>
                        <div className="text-xs text-gray-500">{t.perNight}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/accommodations/${accom.id}`)}
                          className="flex-1 px-4 py-2.5 border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 hover:border-amber-700 transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{t.viewDetails}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Book button clicked for:', accom.name);
                            console.log('establishmentId:', accom.establishmentId);
                            console.log('accommodation id:', accom.id);
                            console.log('isAvailable:', accom.isAvailable);

                            if (accom.isAvailable && accom.establishmentId) {
                              const bookingUrl = `/booking?establishment=${accom.establishmentId}&accommodation=${accom.id}`;
                              console.log('Navigating to:', bookingUrl);
                              router.push(bookingUrl);
                            } else {
                              console.warn('Cannot book:', {
                                isAvailable: accom.isAvailable,
                                hasEstablishmentId: !!accom.establishmentId
                              });
                            }
                          }}
                          disabled={!accom.isAvailable || !accom.establishmentId}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 hover:shadow-lg transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center space-x-1 transform hover:scale-105 disabled:transform-none"
                          title={!accom.isAvailable ? 'Hébergement non disponible' : !accom.establishmentId ? 'Établissement non défini' : 'Réserver cet hébergement'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{t.previous}</span>
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${currentPage === page
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                          : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
                >
                  <span>{t.next}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
