'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { 
  validateAndCorrectLocation, 
  generateGoogleMapsUrl, 
  generateDirectionsUrl, 
  generateEmbedUrl,
  formatCoordinates 
} from './LocationUtils';

interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface InteractiveMapProps {
  location: MapLocation;
  zoom?: number;
  height?: string;
  showControls?: boolean;
  showDirections?: boolean;
  className?: string;
}

export default function InteractiveMap({
  location,
  zoom = 15,
  height = '400px',
  showControls = true,
  showDirections = true,
  className = '',
}: InteractiveMapProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapSrc, setMapSrc] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Valider et corriger les coordonnées si nécessaire
  const validatedLocation = validateAndCorrectLocation(location);

  useEffect(() => {
    // Marquer le composant comme monté côté client
    setIsMounted(true);
    
    // Réinitialiser l'état de chargement / erreur à chaque changement de position ou zoom
    setIsLoading(true);
    setMapError(false);

    // Générer l'URL de la carte côté client pour éviter les problèmes d'hydratation
    const src = generateEmbedUrl(validatedLocation.lat, validatedLocation.lng, currentZoom);
    setMapSrc(src);
    
    // Timeout de sécurité : si après un certain temps la carte ne s'est pas chargée,
    // on considère qu'il y a un problème et on activera le fallback
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!iframeRef.current) {
        setMapError(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [validatedLocation.lat, validatedLocation.lng, currentZoom]);

  // Mettre à jour l'URL quand le zoom change
  useEffect(() => {
    if (isMounted) {
      const src = generateEmbedUrl(validatedLocation.lat, validatedLocation.lng, currentZoom);
      setMapSrc(src);
    }
  }, [currentZoom, validatedLocation.lat, validatedLocation.lng, isMounted]);

  const openInGoogleMaps = () => {
    const url = generateGoogleMapsUrl(validatedLocation.lat, validatedLocation.lng);
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = generateDirectionsUrl(validatedLocation.lat, validatedLocation.lng);
    window.open(url, '_blank');
  };

  const handleZoomIn = () => {
    if (currentZoom < 20) {
      setCurrentZoom(prev => prev + 1);
    }
  };

  const handleZoomOut = () => {
    if (currentZoom > 1) {
      setCurrentZoom(prev => prev - 1);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setMapError(false);
  };

  const handleIframeError = () => {
    // Si l'iframe est bloquée (X-Frame-Options, politique de contenu, etc.),
    // on active un fallback plus simple sans contenu externe intégré.
    setIsLoading(false);
    setMapError(true);
  };

  // Ne pas afficher la carte tant qu'elle n'est pas montée côté client
  if (!isMounted) {
    return (
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
        <div 
          className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <p className="text-luxury-text font-medium">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback statique si la carte intégrée est bloquée ou en erreur
  if (mapError) {
    return (
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
        <div
          className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50"
          style={{ height }}
        >
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <div className="w-12 h-12 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-luxury-dark mb-2">
              {validatedLocation.name || 'Localisation'}
            </h3>
            {validatedLocation.address && (
              <p className="text-sm text-luxury-text mb-3">
                {validatedLocation.address}
              </p>
            )}
            <p className="text-xs text-luxury-text mb-4 font-mono bg-gray-100 px-2 py-1 rounded-md">
              {formatCoordinates(validatedLocation.lat, validatedLocation.lng)}
            </p>
            <p className="text-xs text-red-500 mb-4">
              La carte interactive est bloquée par le navigateur. Vous pouvez néanmoins ouvrir la localisation dans Google Maps.
            </p>
            <div className="space-y-2">
              <button
                onClick={openInGoogleMaps}
                className="w-full px-4 py-2 bg-gradient-luxury text-luxury-cream rounded-lg hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center space-x-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans Google Maps</span>
              </button>
              {showDirections && (
                <button
                  onClick={getDirections}
                  className="w-full px-4 py-2 border-2 border-luxury-gold text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-cream transition-all duration-300 font-medium flex items-center justify-center space-x-2 text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Obtenir l'itinéraire</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center z-10"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <p className="text-luxury-text font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative" style={{ height }}>
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Google Maps - ${validatedLocation.name || 'Localisation'}`}
          />
        </div>

        {/* Map Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-5 h-5 text-luxury-text" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-5 h-5 text-luxury-text" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <button
            onClick={openInGoogleMaps}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md hover:bg-white transition-colors flex items-center space-x-2 text-sm font-medium text-luxury-text hover:text-luxury-gold"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ouvrir dans Maps</span>
          </button>
          
          {showDirections && (
            <button
              onClick={getDirections}
              className="bg-luxury-gold/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md hover:bg-luxury-gold transition-colors flex items-center space-x-2 text-sm font-medium text-luxury-cream"
            >
              <Navigation className="w-4 h-4" />
              <span>Itinéraire</span>
            </button>
          )}
        </div>
      </div>

      {/* Location Info */}
      {(validatedLocation.name || validatedLocation.address) && (
        <div className="p-4 bg-luxury-cream border-t">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-luxury-gold mt-0.5 flex-shrink-0" />
            <div>
              {validatedLocation.name && (
                <h4 className="font-semibold text-luxury-dark">{validatedLocation.name}</h4>
              )}
              {validatedLocation.address && (
                <p className="text-sm text-luxury-text">{validatedLocation.address}</p>
              )}
              <p className="text-xs text-luxury-text mt-1">
                Coordonnées: {formatCoordinates(validatedLocation.lat, validatedLocation.lng)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

