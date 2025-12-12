'use client';

import { MapPin, ExternalLink, Navigation, Locate } from 'lucide-react';
import { 
  generateGoogleMapsUrl, 
  generateDirectionsUrl, 
  formatCoordinates,
  getNearbyPlaces 
} from './LocationUtils';

interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  city?: string;
}

interface SimpleMapProps {
  location: MapLocation;
  showNearbyPlaces?: boolean;
  className?: string;
}

export default function SimpleMap({
  location,
  showNearbyPlaces = true,
  className = '',
}: SimpleMapProps) {
  const openInGoogleMaps = () => {
    const url = generateGoogleMapsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = generateDirectionsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  const openStreetView = () => {
    const url = `https://www.google.com/maps/@${location.lat},${location.lng},3a,75y,90t/data=!3m6!1e1`;
    window.open(url, '_blank');
  };

  const nearbyPlaces = showNearbyPlaces ? getNearbyPlaces(location.city || 'bujumbura') : [];

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Carte statique avec design attractif */}
      <div 
        className="relative bg-gradient-to-br from-blue-100 via-green-50 to-blue-50 responsive-map-height"
      >
        {/* Pattern de fond géographique */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Contenu principal */}
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 lg:p-6">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-2xl max-w-[280px] sm:max-w-sm lg:max-w-md w-full">
            {/* Icône principale */}
            <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-18 lg:h-18 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-5 shadow-xl">
              <MapPin className="w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9" />
            </div>
            
            {/* Informations de localisation */}
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-luxury-dark mb-1.5 sm:mb-2 leading-tight">
              {location.name || 'Ruzizi Hôtel'}
            </h3>
            
            {location.address && (
              <p className="text-xs sm:text-sm lg:text-base text-luxury-text mb-2 sm:mb-3 leading-relaxed px-1">
                {location.address}
              </p>
            )}
            
            <p className="text-xs text-luxury-text mb-3 sm:mb-4 lg:mb-5 font-mono bg-gray-100 px-2 py-1 rounded-md">
              {formatCoordinates(location.lat, location.lng)}
            </p>
            
            {/* Boutons d'action */}
            <div className="space-y-2">
              <button
                onClick={openInGoogleMaps}
                className="w-full px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 bg-gradient-luxury text-luxury-cream rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 text-xs sm:text-sm lg:text-base"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Ouvrir dans Google Maps</span>
                <span className="sm:hidden">Google Maps</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={getDirections}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-luxury-gold text-luxury-gold rounded-md sm:rounded-lg hover:bg-luxury-gold hover:text-luxury-cream transition-all duration-300 font-medium flex items-center justify-center space-x-1 text-xs sm:text-sm"
                >
                  <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Itinéraire</span>
                </button>
                
                <button
                  onClick={openStreetView}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-blue-500 text-blue-500 rounded-md sm:rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-300 font-medium flex items-center justify-center space-x-1 text-xs sm:text-sm"
                >
                  <Locate className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Street View</span>
                  <span className="sm:hidden">Vue</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs décoratifs - Responsive */}
        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 bg-luxury-gold/20 text-luxury-dark px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
          <span className="hidden sm:inline">📍 Localisation Interactive</span>
          <span className="sm:hidden">📍 Carte</span>
        </div>
        
        <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-green-500/20 text-green-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
          <span className="hidden sm:inline">✅ Toujours Accessible</span>
          <span className="sm:hidden">✅ OK</span>
        </div>
      </div>

      {/* Lieux d'intérêt - Responsive */}
      {showNearbyPlaces && nearbyPlaces.length > 0 && (
        <div className="p-3 sm:p-4 lg:p-6 bg-luxury-cream border-t">
          <h4 className="font-bold text-luxury-dark mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-luxury-gold flex-shrink-0" />
            À proximité
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearbyPlaces.slice(0, 4).map((place, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-sm sm:text-base flex-shrink-0">{place.icon}</span>
                  <span className="font-medium text-luxury-dark text-xs sm:text-sm truncate">
                    {place.name}
                  </span>
                </div>
                <span className="text-xs text-luxury-text font-medium bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ml-1 sm:ml-2">
                  {place.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}