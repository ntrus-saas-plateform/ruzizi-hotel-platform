'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImageLoader } from '@/hooks/useImageLoader';

interface EstablishmentCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  amenities: string[];
  isAvailable?: boolean;
}

export default function EstablishmentCardOptimized({
  id,
  name,
  description,
  image,
  location,
  rating,
  reviewCount,
  priceRange,
  amenities,
  isAvailable = true
}: EstablishmentCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  // Use custom hook for better image handling
  const { imageSrc, isLoading, hasError } = useImageLoader({
    src: image,
    onError: (error) => console.error('❌ Image error:', name, error),
  });

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/booking?establishment=${id}`);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/establishments/${id}`);
  };

  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    alert('Établissement ajouté aux favoris !');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating) 
            ? 'text-amber-400 fill-current' 
            : index < rating 
            ? 'text-amber-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ));
  };

  return (
    <div 
      onClick={() => router.push(`/establishments/${id}`)}
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 cursor-pointer ${
        isHovered ? 'transform -translate-y-2' : ''
      } ${!isAvailable ? 'opacity-75' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
            <div className="text-center p-4">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">Image non disponible</p>
            </div>
          </div>
        )}
        
        <img
          src={imageSrc}
          alt={name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            !isLoading && !hasError ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Availability Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isAvailable 
              ? 'bg-green-500 text-luxury-cream' 
              : 'bg-red-500 text-luxury-cream'
          }`}>
            {isAvailable ? 'Disponible' : 'Complet'}
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-luxury-dark">{priceRange}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`absolute bottom-4 right-4 flex space-x-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            type="button"
            onClick={handleViewDetails}
            title="Voir les détails"
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleLike}
            title="Ajouter aux favoris"
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleViewOnMap}
            title="Voir sur la carte"
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-luxury-dark group-hover:text-amber-600 transition-colors">
              {name}
            </h3>
            <div className="flex items-center space-x-1">
              {renderStars(rating)}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-luxury-text mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location}</span>
          </div>

          <div className="flex items-center text-sm text-luxury-text">
            <span className="font-semibold text-amber-600">{rating}</span>
            <span className="mx-1">•</span>
            <span>{reviewCount} avis</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-luxury-text text-sm leading-relaxed mb-4 line-clamp-2">
          {description}
        </p>

        {/* Amenities */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 4).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
              >
                {amenity}
              </span>
            ))}
            {amenities.length > 4 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                +{amenities.length - 4} autres
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-amber-500 hover:text-amber-600 transition-all duration-200 font-medium text-sm"
          >
            Voir détails
          </button>
          <button
            type="button"
            onClick={handleBookNow}
            disabled={!isAvailable}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              isAvailable
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-luxury-cream hover:from-amber-700 hover:to-amber-800 shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAvailable ? 'Réserver' : 'Indisponible'}
          </button>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-amber-400 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
}
