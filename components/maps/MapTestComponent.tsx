'use client';

import { useState, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import RobustMap from './RobustMap';

export default function MapTestComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-8 bg-gray-100 rounded-lg">
        <p>Chargement du test de carte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Carte Robuste - Bujumbura</h3>
        <p className="text-sm text-gray-600 mb-4">
          Cette carte détecte automatiquement les blocages et bascule vers des alternatives.
        </p>
        <RobustMap
          location={{
            lat: -3.3614,
            lng: 29.3599,
            name: 'Ruzizi Hôtel Bujumbura',
            address: "Avenue de l'Université, Bujumbura"
          }}
          height="350px"
          showControls={true}
          showDirections={true}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Carte Robuste - Gitega</h3>
        <RobustMap
          location={{
            lat: -3.4264,
            lng: 29.9306,
            name: 'Ruzizi Hôtel Gitega',
            address: "Avenue de l'Indépendance, Gitega"
          }}
          height="350px"
          showControls={false}
          showDirections={true}
        />
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Carte Interactive Classique - Ngozi</h3>
        <p className="text-sm text-gray-600 mb-4">
          Version classique pour comparaison.
        </p>
        <InteractiveMap
          location={{
            lat: -2.9077,
            lng: 29.8306,
            name: 'Ruzizi Hôtel Ngozi',
            address: "Avenue Principale, Ngozi"
          }}
          height="300px"
          showControls={true}
          showDirections={true}
        />
      </div>
    </div>
  );
}