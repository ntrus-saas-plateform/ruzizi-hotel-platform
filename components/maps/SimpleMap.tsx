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
  height?: string;
  showNearbyPlaces?: boolean;
  className?: string;
}

export default function SimpleMap({
  location,
  height = '400px',
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
    <div className={`bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Carte statique avec design attractif */}
      <div 
        className="relative bg-gradient-to-br from-blue-100 via-green-50 to-blue-50"
        style={{ height }}
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md mx-4">
            {/* Icône principale */}
            <div className="w-20 h-20 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <MapPin className="w-10 h-10" />
            </div>
            
            {/* Informations de localisation */}
            <h3 className="text-2xl font-bold text-luxury-dark mb-2">
              {location.name || 'Ruzizi Hôtel'}
            </h3>
            
            {location.address && (
              <p className="text-luxury-text mb-4 leading-relaxed">
                {location.address}
              </p>
            )}
            
            <p className="text-sm text-luxury-text mb-6 font-mono bg-gray-100 px-3 py-2 rounded-lg">
              {formatCoordinates(location.lat, location.lng)}
            </p>
            
            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={openInGoogleMaps}
                className="w-full px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center space-x-3 transform hover:scale-105"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Ouvrir dans Google Maps</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={getDirections}
                  className="px-4 py-3 border-2 border-luxury-gold text-luxury-gold rounded-xl hover:bg-luxury-gold hover:text-luxury-cream transition-all duration-300 font-medium flex items-center justify-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Itinéraire</span>
                </button>
                
                <button
                  onClick={openStreetView}
                  className="px-4 py-3 border-2 border-blue-500 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all duration-300 font-medium flex items-center justify-center space-x-2"
                >
                  <Locate className="w-4 h-4" />
                  <span>Street View</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs décoratifs */}
        <div className="absolute top-6 left-6 bg-luxury-gold/20 text-luxury-dark px-4 py-2 rounded-full text-sm font-medium">
          📍 Localisation Interactive
        </div>
        
        <div className="absolute top-6 right-6 bg-green-500/20 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
          ✅ Toujours Accessible
        </div>
      </div>

      {/* Lieux d'intérêt */}
      {showNearbyPlaces && nearbyPlaces.length > 0 && (
        <div className="p-6 bg-luxury-cream border-t">
          <h4 className="font-bold text-luxury-dark mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-luxury-gold" />
            À proximité
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyPlaces.slice(0, 4).map((place, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{place.icon}</span>
                  <span className="font-medium text-luxury-dark text-sm">{place.name}</span>
                </div>
                <span className="text-xs text-luxury-text font-medium bg-gray-100 px-2 py-1 rounded-full">
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