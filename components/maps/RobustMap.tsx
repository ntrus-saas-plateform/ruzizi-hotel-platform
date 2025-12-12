'use client';

import { useState, useEffect } from 'react';
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

type MapProvider = 'google' | 'openstreetmap' | 'static';

export default function RobustMap({
  location,
  height = '400px',
  showControls = true,
  showDirections = true,
  className = '',
}: RobustMapProps) {
  const [currentProvider, setCurrentProvider] = useState<MapProvider>('google');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Tester Google Maps d'abord
    const testGoogleMaps = async () => {
      try {
        const testUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}&output=embed`;
        const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
        setCurrentProvider('google');
      } catch (error) {
        console.warn('Google Maps non disponible, basculement vers OpenStreetMap');
        setCurrentProvider('openstreetmap');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    testGoogleMaps();

    return () => clearTimeout(timer);
  }, [location.lat, location.lng]);

  const openInGoogleMaps = () => {
    const url = generateGoogleMapsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = generateDirectionsUrl(location.lat, location.lng);
    window.open(url, '_blank');
  };

  const handleMapError = () => {
    console.warn(`Erreur avec ${currentProvider}, tentative de fallback`);
    if (currentProvider === 'google') {
      setCurrentProvider('openstreetmap');
    } else if (currentProvider === 'openstreetmap') {
      setCurrentProvider('static');
    }
  };

  if (!isMounted) {
    return (
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
        <div 
          className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <p className="text-luxury-text font-medium">Initialisation de la carte...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderMap = () => {
    switch (currentProvider) {
      case 'google':
        return (
          <iframe
            src={`https://www.google.com/maps?q=${location.lat},${location.lng}&hl=fr&z=15&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={handleMapError}
            title={`Google Maps - ${location.name || 'Localisation'}`}
          />
        );
      
      case 'openstreetmap':
        return (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              onError={handleMapError}
              title={`OpenStreetMap - ${location.name || 'Localisation'}`}
            />
            <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-2 rounded-lg shadow-md text-sm">
              OpenStreetMap
            </div>
          </div>
        );
      
      case 'static':
      default:
        return (
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
            
            {/* Indicateur de fallback */}
            <div className="absolute bottom-4 right-4 bg-orange-500/90 text-white px-3 py-2 rounded-lg shadow-md text-xs">
              Carte statique
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center z-20"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <p className="text-luxury-text font-medium">Chargement de la carte...</p>
            <p className="text-xs text-luxury-text mt-2">Provider: {currentProvider}</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height }}>
        {renderMap()}
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
                {formatCoordinates(location.lat, location.lng)} • Provider: {currentProvider}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}