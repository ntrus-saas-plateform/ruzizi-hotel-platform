'use client';

import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { 
  generateGoogleMapsUrl, 
  generateDirectionsUrl, 
  formatCoordinates 
} from './LocationUtils';

interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface RobustMapProps {
  location: MapLocation;
  height?: string;
  showControls?: boolean;
  showDirections?: boolean;
  className?: string;
}

export default function RobustMap({
  location,
  height = '400px',
  showControls = true,
  showDirections = true,
  className = '',
}: RobustMapProps) {
  const openInGoogleMaps = () => {
    const url = generateGoogleMapsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = generateDirectionsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Map Container */}
      <div className="relative" style={{ height }}>
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative">
          {/* Pattern de fond */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-10 grid-rows-8 h-full">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="border border-gray-400"></div>
              ))}
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="text-center z-10 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-sm">
            <div className="w-16 h-16 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-luxury-dark mb-2">
              {location.name || 'Localisation'}
            </h3>
            
            {location.address && (
              <p className="text-sm text-luxury-text mb-4">
                {location.address}
              </p>
            )}
            
            <p className="text-xs text-luxury-text mb-6">
              Coordonnées: {formatCoordinates(location.lat, location.lng)}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={openInGoogleMaps}
                className="w-full px-4 py-3 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold/90 transition font-medium flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans Google Maps</span>
              </button>
              
              {showDirections && (
                <button
                  onClick={getDirections}
                  className="w-full px-4 py-3 border-2 border-luxury-gold text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-cream transition font-medium flex items-center justify-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Obtenir l'itinéraire</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      {(location.name || location.address) && (
        <div className="p-4 bg-luxury-cream border-t">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-luxury-gold mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {location.name && (
                <h4 className="font-semibold text-luxury-dark">{location.name}</h4>
              )}
              {location.address && (
                <p className="text-sm text-luxury-text">{location.address}</p>
              )}
              <p className="text-xs text-luxury-text mt-1">
                {formatCoordinates(location.lat, location.lng)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}