'use client';

import { useState, useEffect } from 'react';
import SimpleMap from './SimpleMap';
import { validateAndCorrectLocation } from './LocationUtils';

interface EstablishmentData {
  id: string;
  name: string;
  location: {
    city: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  description?: string;
  isActive?: boolean;
}

interface EstablishmentsMapProps {
  establishments?: EstablishmentData[];
  showAll?: boolean;
  maxDisplay?: number;
  height?: string;
  className?: string;
}

export default function EstablishmentsMap({
  establishments = [],
  showAll = false,
  maxDisplay = 3,
  height = '400px',
  className = '',
}: EstablishmentsMapProps) {
  const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null);
  const [validEstablishments, setValidEstablishments] = useState<EstablishmentData[]>([]);

  useEffect(() => {
    // Valider et corriger les coordonnées de tous les établissements
    const validated = establishments
      .filter(est => est.isActive !== false)
      .map(establishment => {
        const correctedLocation = validateAndCorrectLocation({
          lat: establishment.location?.coordinates?.lat || -3.3614,
          lng: establishment.location?.coordinates?.lng || 29.3599,
          name: establishment.name,
          address: establishment.location?.address
        });

        return {
          ...establishment,
          location: {
            ...establishment.location,
            coordinates: {
              lat: correctedLocation.lat,
              lng: correctedLocation.lng
            }
          }
        };
      });

    setValidEstablishments(validated);
    
    // Sélectionner le premier établissement par défaut
    if (validated.length > 0 && !selectedEstablishment) {
      setSelectedEstablishment(validated[0].id);
    }
  }, [establishments, selectedEstablishment]);

  if (validEstablishments.length === 0) {
    return (
      <div className={`bg-white rounded-2xl p-8 shadow-card-luxury ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun établissement disponible</h3>
          <p className="text-gray-500">Les établissements seront affichés ici une fois chargés.</p>
        </div>
      </div>
    );
  }

  const displayEstablishments = showAll ? validEstablishments : validEstablishments.slice(0, maxDisplay);
  const selectedEst = validEstablishments.find(est => est.id === selectedEstablishment) || validEstablishments[0];

  if (showAll) {
    // Afficher toutes les cartes
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-luxury-dark mb-4">Nos Établissements</h2>
          <p className="text-luxury-text">Découvrez tous nos emplacements à travers le Burundi</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayEstablishments.map((establishment) => (
            <div key={establishment.id} className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-luxury-dark">{establishment.name}</h3>
                <p className="text-luxury-text">{establishment.location.city}</p>
              </div>
              
              <SimpleMap
                location={{
                  lat: establishment.location.coordinates.lat,
                  lng: establishment.location.coordinates.lng,
                  name: establishment.name,
                  address: `${establishment.location.address}, ${establishment.location.city}`,
                  city: establishment.location.city.toLowerCase()
                }}
                showNearbyPlaces={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Afficher une carte avec sélecteur
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-card-luxury ${className}`}>
      {/* Sélecteur d'établissement */}
      {validEstablishments.length > 1 && (
        <div className="p-6 bg-luxury-cream border-b">
          <h3 className="text-lg font-bold text-luxury-dark mb-4">Choisir un établissement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {validEstablishments.map((establishment) => (
              <button
                key={establishment.id}
                onClick={() => setSelectedEstablishment(establishment.id)}
                className={`p-3 rounded-lg text-left transition-all duration-200 ${
                  selectedEstablishment === establishment.id
                    ? 'bg-luxury-gold text-luxury-cream shadow-md'
                    : 'bg-white text-luxury-dark hover:bg-luxury-gold/10 hover:shadow-sm'
                }`}
              >
                <div className="font-semibold text-sm">{establishment.name}</div>
                <div className="text-xs opacity-80">{establishment.location.city}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carte de l'établissement sélectionné */}
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-luxury-dark">{selectedEst.name}</h3>
          <p className="text-luxury-text">{selectedEst.location.city}</p>
          {selectedEst.description && (
            <p className="text-sm text-luxury-text mt-2 max-w-2xl mx-auto">
              {selectedEst.description}
            </p>
          )}
        </div>

        <SimpleMap
          location={{
            lat: selectedEst.location.coordinates.lat,
            lng: selectedEst.location.coordinates.lng,
            name: selectedEst.name,
            address: `${selectedEst.location.address}, ${selectedEst.location.city}`,
            city: selectedEst.location.city.toLowerCase()
          }}
          showNearbyPlaces={true}
        />
      </div>

      {/* Informations supplémentaires */}
      <div className="p-6 bg-luxury-cream border-t">
        <div className="text-center">
          <p className="text-sm text-luxury-text">
            Coordonnées validées: {selectedEst.location.coordinates.lat.toFixed(4)}, {selectedEst.location.coordinates.lng.toFixed(4)}
          </p>
          {validEstablishments.length > maxDisplay && !showAll && (
            <p className="text-xs text-luxury-text mt-2">
              {validEstablishments.length - maxDisplay} autre(s) établissement(s) disponible(s)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}