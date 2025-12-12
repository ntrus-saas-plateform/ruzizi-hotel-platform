/**
 * Utilitaires pour la gestion des localisations au Burundi
 */

// Coordonnées réelles des principales villes du Burundi
export const BURUNDI_LOCATIONS = {
  bujumbura: { lat: -3.3614, lng: 29.3599, name: 'Bujumbura' },
  gitega: { lat: -3.4264, lng: 29.9306, name: 'Gitega' },
  ngozi: { lat: -2.9077, lng: 29.8306, name: 'Ngozi' },
  muyinga: { lat: -2.8444, lng: 30.3444, name: 'Muyinga' },
  ruyigi: { lat: -3.4764, lng: 30.2506, name: 'Ruyigi' },
  bururi: { lat: -3.9489, lng: 29.6244, name: 'Bururi' },
  cibitoke: { lat: -2.8806, lng: 29.1306, name: 'Cibitoke' },
  kayanza: { lat: -2.9222, lng: 29.6306, name: 'Kayanza' },
  rutana: { lat: -3.9333, lng: 29.9833, name: 'Rutana' },
  makamba: { lat: -4.1333, lng: 29.8000, name: 'Makamba' },
  cankuzo: { lat: -3.2167, lng: 30.5500, name: 'Cankuzo' },
  karuzi: { lat: -3.1000, lng: 30.1667, name: 'Karuzi' },
  kirundo: { lat: -2.5833, lng: 30.1000, name: 'Kirundo' },
  bubanza: { lat: -3.0833, lng: 29.3833, name: 'Bubanza' },
  muramvya: { lat: -3.2667, lng: 29.6167, name: 'Muramvya' },
  mwaro: { lat: -3.5000, lng: 29.7000, name: 'Mwaro' },
  rumonge: { lat: -3.9667, lng: 29.4333, name: 'Rumonge' },
  'bujumbura rural': { lat: -3.4000, lng: 29.2500, name: 'Bujumbura Rural' }
} as const;

export interface Location {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

/**
 * Vérifie si les coordonnées sont valides pour le Burundi
 */
export function isValidBurundiCoordinates(lat: number, lng: number): boolean {
  // Burundi bounds approximatifs
  return lat >= -4.5 && lat <= -2.3 && lng >= 28.9 && lng <= 30.9;
}

/**
 * Trouve la ville la plus proche des coordonnées données
 */
export function findNearestCity(lat: number, lng: number): { lat: number; lng: number; name: string } | null {
  let nearestCity: { lat: number; lng: number; name: string } | null = null;
  let minDistance = Infinity;

  Object.values(BURUNDI_LOCATIONS).forEach(city => {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  });

  return nearestCity;
}

/**
 * Valide et corrige les coordonnées si nécessaire
 */
export function validateAndCorrectLocation(location: Location): Location {
  // Si les coordonnées ne sont pas valides pour le Burundi, utiliser Bujumbura par défaut
  if (!isValidBurundiCoordinates(location.lat, location.lng)) {
    console.warn('Coordonnées invalides pour le Burundi, utilisation de Bujumbura par défaut:', {
      provided: { lat: location.lat, lng: location.lng },
      corrected: BURUNDI_LOCATIONS.bujumbura
    });
    
    return {
      ...location,
      ...BURUNDI_LOCATIONS.bujumbura,
      name: location.name || 'Bujumbura (corrigé)',
    };
  }

  // Essayer de détecter la ville la plus proche
  const nearestCity = findNearestCity(location.lat, location.lng);
  
  return {
    ...location,
    name: location.name || nearestCity?.name || 'Établissement',
  };
}

/**
 * Génère une URL Google Maps pour les coordonnées données
 */
export function generateGoogleMapsUrl(lat: number, lng: number, zoom: number = 15): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&zoom=${zoom}`;
}

/**
 * Génère une URL Google Maps pour les directions
 */
export function generateDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Génère une URL d'embed Google Maps simple et fonctionnelle
 */
export function generateEmbedUrl(lat: number, lng: number, zoom: number = 15): string {
  // URL simple et directe qui fonctionne mieux
  return `https://www.google.com/maps?q=${lat},${lng}&hl=fr&z=${zoom}&output=embed`;
}

/**
 * Calcule la distance entre deux points en kilomètres
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Formate les coordonnées pour l'affichage
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Obtient des lieux d'intérêt proches pour une ville donnée
 */
export function getNearbyPlaces(cityName: string) {
  const city = cityName.toLowerCase();
  
  const places: Record<string, Array<{ name: string; distance: string; icon: string }>> = {
    bujumbura: [
      { name: 'Aéroport de Bujumbura', distance: '12 km', icon: '✈️' },
      { name: 'Centre-ville', distance: '2 km', icon: '🏢' },
      { name: 'Lac Tanganyika', distance: '5 km', icon: '🏖️' },
      { name: 'Marché central', distance: '3 km', icon: '🛒' },
      { name: 'Université du Burundi', distance: '4 km', icon: '🎓' },
      { name: 'Stade Prince Louis Rwagasore', distance: '6 km', icon: '⚽' },
    ],
    gitega: [
      { name: 'Palais présidentiel', distance: '1 km', icon: '🏛️' },
      { name: 'Musée national', distance: '2 km', icon: '🏛️' },
      { name: 'Marché central', distance: '1.5 km', icon: '🛒' },
      { name: 'Cathédrale', distance: '1 km', icon: '⛪' },
    ],
    ngozi: [
      { name: 'Marché de Ngozi', distance: '1 km', icon: '🛒' },
      { name: 'Centre administratif', distance: '2 km', icon: '🏢' },
      { name: 'Hôpital de Ngozi', distance: '3 km', icon: '🏥' },
    ],
    default: [
      { name: 'Centre-ville', distance: '2 km', icon: '🏢' },
      { name: 'Marché local', distance: '1 km', icon: '🛒' },
      { name: 'Administration', distance: '1.5 km', icon: '🏛️' },
    ]
  };

  return places[city] || places.default;
}