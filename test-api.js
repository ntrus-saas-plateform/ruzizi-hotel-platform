// Script de test pour vérifier l'API des hébergements
// Usage: node test-api.js

const BASE_URL = 'http://localhost:3000';

async function testAccommodationsAPI() {
  try {
    // Test 1: Récupérer tous les hébergements
    const response = await fetch(`${BASE_URL}/api/public/accommodations`);
    const data = await response.json();

    if (data.success) {
      const accommodations = data.data?.data || data.data || [];
      if (accommodations.length > 0) {
        const firstAccom = accommodations[0];
        :', typeof firstAccom.establishmentId);
        
        if (typeof firstAccom.establishmentId === 'object' && firstAccom.establishmentId !== null) {
          } else {
          :', firstAccom.establishmentId);
        }
        
        const estId = typeof firstAccom.establishmentId === 'object' 
          ? (firstAccom.establishmentId?._id || firstAccom.establishmentId?.id)
          : firstAccom.establishmentId;
        const accomId = firstAccom.id || firstAccom._id;
        // Test 2: Récupérer les détails d'un hébergement
        const detailResponse = await fetch(`${BASE_URL}/api/public/accommodations/${accomId}`);
        const detailData = await detailResponse.json();
        
        if (detailData.success) {
          }
      } else {
        }
    } else {
      }

    // Test 3: Récupérer les établissements
    const estabResponse = await fetch(`${BASE_URL}/api/public/establishments`);
    const estabData = await estabResponse.json();
    
    if (estabData.success) {
      const establishments = estabData.data?.data || estabData.data || [];
      if (establishments.length > 0) {
        const firstEstab = establishments[0];
        }
    }

    } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('Assurez-vous que le serveur de développement est en cours d\'exécution (npm run dev)');
  }
}

// Exécuter les tests
testAccommodationsAPI();
