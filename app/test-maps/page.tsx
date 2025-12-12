'use client';

import { useState, useEffect } from 'react';
import InteractiveMap from '@/components/maps/InteractiveMap';
import MapTestComponent from '@/components/maps/MapTestComponent';
import EstablishmentsMap from '@/components/maps/EstablishmentsMap';
import { BURUNDI_LOCATIONS } from '@/components/maps/LocationUtils';

export default function TestMapsPage() {
  const [selectedLocation, setSelectedLocation] = useState('bujumbura');
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const locations = Object.entries(BURUNDI_LOCATIONS).map(([key, value]) => ({
    key,
    ...value
  }));

  const currentLocation = BURUNDI_LOCATIONS[selectedLocation as keyof typeof BURUNDI_LOCATIONS];

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const response = await fetch('/api/public/establishments');
        const data = await response.json();
        if (data.success) {
          setEstablishments(data.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch establishments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishments();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 bg-luxury-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-luxury-dark mb-4">
            Test des Cartes Interactives
          </h1>
          <p className="text-lg text-luxury-text">
            Testez les cartes pour différentes villes du Burundi
          </p>
        </div>

        {/* Sélecteur de ville */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-luxury-dark mb-2">
            Sélectionner une ville :
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
          >
            {locations.map((location) => (
              <option key={location.key} value={location.key}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Carte interactive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-luxury-dark mb-4">
              Carte Standard
            </h2>
            <InteractiveMap
              location={{
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                name: currentLocation.name,
                address: `Centre-ville de ${currentLocation.name}, Burundi`
              }}
              height="400px"
              showControls={true}
              showDirections={true}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-luxury-dark mb-4">
              Carte Compacte
            </h2>
            <InteractiveMap
              location={{
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                name: `Ruzizi Hôtel ${currentLocation.name}`,
                address: `Avenue Principale, ${currentLocation.name}`
              }}
              height="300px"
              showControls={false}
              showDirections={true}
              zoom={14}
            />
          </div>
        </div>

        {/* Informations sur la ville */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-card-luxury">
          <h3 className="text-xl font-bold text-luxury-dark mb-4">
            Informations sur {currentLocation.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-luxury-text mb-2">Coordonnées</h4>
              <p className="text-sm text-luxury-text">
                Latitude: {currentLocation.lat.toFixed(4)}°<br />
                Longitude: {currentLocation.lng.toFixed(4)}°
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-luxury-text mb-2">Région</h4>
              <p className="text-sm text-luxury-text">
                {currentLocation.name === 'Bujumbura' ? 'Capitale économique' :
                 currentLocation.name === 'Gitega' ? 'Capitale politique' :
                 'Province du Burundi'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-luxury-text mb-2">Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="block w-full px-3 py-2 text-sm bg-luxury-gold text-luxury-cream rounded-lg hover:bg-luxury-gold/90 transition"
                >
                  Ouvrir dans Google Maps
                </button>
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentLocation.lat},${currentLocation.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="block w-full px-3 py-2 text-sm border border-luxury-gold text-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-luxury-cream transition"
                >
                  Obtenir l'itinéraire
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test de coordonnées invalides */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-luxury-dark mb-4">
            Test de Correction Automatique
          </h2>
          <p className="text-luxury-text mb-4">
            Cette carte utilise des coordonnées invalides (Paris, France) qui seront automatiquement corrigées vers Bujumbura.
          </p>
          <InteractiveMap
            location={{
              lat: 48.8566, // Paris, France - coordonnées invalides pour le Burundi
              lng: 2.3522,
              name: 'Test de correction',
              address: 'Coordonnées invalides corrigées automatiquement'
            }}
            height="300px"
            showControls={true}
            showDirections={true}
          />
        </div>

        {/* Test composant sans hydratation */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-luxury-dark mb-4">
            Test Sans Erreur d'Hydratation
          </h2>
          <p className="text-luxury-text mb-4">
            Ces cartes sont conçues pour éviter les erreurs d'hydratation React.
          </p>
          <MapTestComponent />
        </div>

        {/* Test avec vraies données d'établissements */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-luxury-dark mb-4">
            Test avec Données Réelles des Établissements
          </h2>
          <p className="text-luxury-text mb-4">
            Ces cartes utilisent les coordonnées réelles des établissements depuis la base de données.
          </p>
          
          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-card-luxury">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
                <p className="text-luxury-text">Chargement des établissements...</p>
              </div>
            </div>
          ) : establishments.length > 0 ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Sélecteur d'Établissements</h3>
                <EstablishmentsMap
                  establishments={establishments}
                  showAll={false}
                  maxDisplay={5}
                  height="400px"
                />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Toutes les Cartes</h3>
                <EstablishmentsMap
                  establishments={establishments}
                  showAll={true}
                  height="350px"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-card-luxury text-center">
              <p className="text-luxury-text">Aucun établissement trouvé dans la base de données.</p>
              <p className="text-sm text-gray-500 mt-2">
                Exécutez: <code className="bg-gray-100 px-2 py-1 rounded">node scripts/fix-location-data.js create-test</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}