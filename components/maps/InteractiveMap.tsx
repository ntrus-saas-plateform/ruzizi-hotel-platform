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
    
    // Générer l'URL de la carte côté client pour éviter les problèmes d'hydratation
    const src = generateEmbedUrl(validatedLocation.lat, validatedLocation.lng, currentZoom);
    setMapSrc(src);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

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
        {!mapError ? (
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
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.warn('Erreur de chargement Google Maps, tentative avec OpenStreetMap');
                setMapError(true);
                setIsLoading(false);
              }}
              title={`Carte de ${validatedLocation.name || 'l\'établissement'}`}
            />
            
            {/* Overlay pour détecter les erreurs de contenu bloqué */}
            <div 
              className="absolute inset-0 pointer-events-none"
              onError={() => {
                console.warn('Contenu bloqué détecté');
                setMapError(true);
              }}
            />
          </div>
        ) : (
          // Fallback avec OpenStreetMap
          <div className="w-full h-full relative">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${validatedLocation.lng-0.01},${validatedLocation.lat-0.01},${validatedLocation.lng+0.01},${validatedLocation.lat+0.01}&layer=mapnik&marker=${validatedLocation.lat},${validatedLocation.lng}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              title={`Carte OpenStreetMap de ${validatedLocation.name || 'l\'établissement'}`}
              onError={() => {
                // Si même OpenStreetMap échoue, afficher la carte statique
                console.warn('OpenStreetMap également indisponible, affichage de la carte statique');
              }}
            />
            
            {/* Message d'information */}
            <div className="absolute top-4 left-4 bg-blue-500/90 text-white px-3 py-2 rounded-lg shadow-md text-sm">
              <p>Carte alternative (OpenStreetMap)</p>
            </div>
            
            {/* Fallback ultime si même OSM ne fonctionne pas */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-luxury text-luxury-cream rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-luxury-dark mb-2">
                  {validatedLocation.name || 'Ruzizi Hôtel'}
                </h3>
                <p className="text-sm text-luxury-text mb-4">
                  {validatedLocation.address}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={openInGoogleMaps}
                    className="block w-full px-4 py-2 bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold/90 transition text-sm"
                  >
                    Ouvrir dans Google Maps
                  </button>
                  {showDirections && (
                    <button
                      onClick={getDirections}
                      className="block w-full px-4 py-2 border border-luxury-gold text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-cream transition text-sm"
                    >
                      Obtenir l'itinéraire
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

