'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/frontoffice/Navigation';
import Footer from '@/components/frontoffice/Footer';
import type { EstablishmentResponse } from '@/types/establishment.types';
import type { AccommodationResponse } from '@/types/accommodation.types';

export default function EstablishmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const establishmentId = params.id as string;
  
  const [establishment, setEstablishment] = useState<EstablishmentResponse | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (establishmentId) {
      fetchData();
    }
  }, [establishmentId]);

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
      case 'standard_room': return 'Chambre Standard';
      case 'suite': return 'Suite';
      case 'house': return 'Maison';
      case 'apartment': return 'Appartement';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="h-[120px]"></div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-amber-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="h-[120px]"></div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-red-600 mb-4">{error || 'Établissement non trouvé'}</p>
            <button onClick={() => router.push('/establishments')} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition font-medium">
              Retour aux établissements
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = establishment.images && establishment.images.length > 0 
    ? establishment.images 
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="h-[120px]"></div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
          <button 
            onClick={() => setShowGallery(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white/10 transition"
            title="Fermer"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))} 
            className="absolute left-4 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
            title="Image précédente"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img 
            src={images[selectedImageIndex]} 
            alt={`${establishment.name} - Image ${selectedImageIndex + 1}`} 
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onError={(e) => {
              console.error(`❌ Erreur chargement image galerie ${selectedImageIndex + 1}`);
              e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
          />
          <button 
            onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))} 
            className="absolute right-4 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition"
            title="Image suivante"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.push('/establishments')} className="mb-6 flex items-center text-amber-600 hover:text-amber-700 font-medium transition">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux établissements
        </button>

        {/* Hero Image Grid */}
        <div className="grid grid-cols-4 gap-2 mb-8 h-96 md:h-[500px]">
          <div 
            className="col-span-4 md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-200" 
            onClick={() => { setSelectedImageIndex(0); setShowGallery(true); }}
          >
            <img 
              src={images[0]} 
              alt={establishment.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onLoad={() => console.log('✅ Image principale chargée:', establishment.name)}
              onError={(e) => {
                console.error('❌ Erreur chargement image principale:', {
                  establishment: establishment.name,
                  imagePreview: images[0].substring(0, 100),
                  isBase64: images[0].startsWith('data:image')
                });
                e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {images.slice(1, 5).map((img, idx) => (
            <div 
              key={idx} 
              className="relative rounded-2xl overflow-hidden cursor-pointer group hidden md:block bg-gray-200" 
              onClick={() => { setSelectedImageIndex(idx + 1); setShowGallery(true); }}
            >
              <img 
                src={img} 
                alt={`${establishment.name} ${idx + 2}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onLoad={() => console.log(`✅ Image ${idx + 2} chargée`)}
                onError={(e) => {
                  console.error(`❌ Erreur chargement image ${idx + 2}:`, {
                    imagePreview: img.substring(0, 100),
                    isBase64: img.startsWith('data:image')
                  });
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold pointer-events-none">
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
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{establishment.name}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{establishment.location.city}, {establishment.location.address}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  {establishment.pricingMode === 'nightly' ? '🌙 Par nuitée' : '📅 Par mois'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  👥 Capacité: {establishment.totalCapacity} personnes
                </span>
                {establishment.isActive && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{establishment.description}</p>
            </div>

            {/* Services */}
            {establishment.services && establishment.services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services & Équipements</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {establishment.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2 text-gray-700">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Section */}
            <div id="map-section" className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Localisation</h2>
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden mb-4">
                <iframe
                  src={`https://www.google.com/maps?q=${establishment.location.coordinates.lat},${establishment.location.coordinates.lng}&hl=fr&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <p className="text-gray-600 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{establishment.location.address}, {establishment.location.city}</span>
              </p>
            </div>

            {/* Accommodations */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hébergements disponibles</h2>
              {accommodations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-gray-500">Aucun hébergement disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accommodations.map((accommodation) => (
                    <div key={accommodation.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-gray-200 relative">
                        {accommodation.images && accommodation.images[0] ? (
                          <img src={accommodation.images[0]} alt={accommodation.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{accommodation.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{getTypeLabel(accommodation.type)}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-gray-600 text-sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {accommodation.capacity.maxGuests} pers.
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-amber-600">{accommodation.pricing.basePrice.toLocaleString()} BIF</div>
                            <div className="text-xs text-gray-500">par {establishment.pricingMode === 'nightly' ? 'nuit' : 'mois'}</div>
                          </div>
                        </div>
                        <button onClick={() => router.push(`/booking?accommodation=${accommodation.id}`)} className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition font-medium">
                          Réserver
                        </button>
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
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-100">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    À partir de {accommodations.length > 0 ? Math.min(...accommodations.map(a => a.pricing.basePrice)).toLocaleString() : '---'} BIF
                  </div>
                  <div className="text-sm text-gray-600">par {establishment.pricingMode === 'nightly' ? 'nuitée' : 'mois'}</div>
                </div>
                <button onClick={handleBookNow} className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                  Réserver maintenant
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">Réservation instantanée • Confirmation immédiate</p>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      {establishment.contacts.phone.map((phone, idx) => (
                        <a key={idx} href={`tel:${phone}`} className="block text-gray-700 hover:text-amber-600 transition">
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${establishment.contacts.email}`} className="text-gray-700 hover:text-amber-600 transition break-all">
                      {establishment.contacts.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button onClick={handleViewOnMap} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-amber-500 hover:text-amber-600 transition font-medium flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Voir sur la carte
                  </button>
                  <button onClick={() => { setSelectedImageIndex(0); setShowGallery(true); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-amber-500 hover:text-amber-600 transition font-medium flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Voir toutes les photos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
