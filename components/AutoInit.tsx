'use client';

import { useEffect, useState } from 'react';

export default function AutoInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Appeler l'API d'initialisation
    fetch('/api/init')
      .then(() => setInitialized(true))
      .catch((error) => console.error('Init error:', error));
  }, [initialized]);

  return null; // Ce composant ne rend rien
}
