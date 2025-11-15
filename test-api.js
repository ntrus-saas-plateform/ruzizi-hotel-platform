// Script de test pour vérifier l'API des hébergements
// Usage: node test-api.js

const BASE_URL = 'http://localhost:3000';

async function testAccommodationsAPI() {
  console.log('🔍 Test de l\'API des hébergements...\n');

  try {
    // Test 1: Récupérer tous les hébergements
    console.log('📋 Test 1: GET /api/public/accommodations');
    const response = await fetch(`${BASE_URL}/api/public/accommodations`);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      const accommodations = data.data?.data || data.data || [];
      console.log('Nombre d\'hébergements:', accommodations.length);
      
      if (accommodations.length > 0) {
        const firstAccom = accommodations[0];
        console.log('\n📦 Premier hébergement:');
        console.log('  - ID:', firstAccom.id || firstAccom._id);
        console.log('  - Nom:', firstAccom.name);
        console.log('  - Type:', firstAccom.type);
        console.log('  - Disponible:', firstAccom.isAvailable || firstAccom.status === 'available');
        console.log('  - establishmentId (type):', typeof firstAccom.establishmentId);
        
        if (typeof firstAccom.establishmentId === 'object' && firstAccom.establishmentId !== null) {
          console.log('  - establishmentId._id:', firstAccom.establishmentId._id);
          console.log('  - establishmentId.id:', firstAccom.establishmentId.id);
          console.log('  - establishmentId.name:', firstAccom.establishmentId.name);
        } else {
          console.log('  - establishmentId (valeur):', firstAccom.establishmentId);
        }
        
        console.log('\n🔗 URL de réservation qui serait générée:');
        const estId = typeof firstAccom.establishmentId === 'object' 
          ? (firstAccom.establishmentId?._id || firstAccom.establishmentId?.id)
          : firstAccom.establishmentId;
        const accomId = firstAccom.id || firstAccom._id;
        console.log(`  ${BASE_URL}/booking?establishment=${estId}&accommodation=${accomId}`);
        
        // Test 2: Récupérer les détails d'un hébergement
        console.log('\n📋 Test 2: GET /api/public/accommodations/[id]');
        const detailResponse = await fetch(`${BASE_URL}/api/public/accommodations/${accomId}`);
        const detailData = await detailResponse.json();
        
        console.log('Status:', detailResponse.status);
        console.log('Success:', detailData.success);
        
        if (detailData.success) {
          console.log('Détails récupérés avec succès');
          console.log('  - establishmentId:', detailData.data.establishmentId);
        }
      } else {
        console.log('⚠️  Aucun hébergement trouvé dans la base de données');
      }
    } else {
      console.log('❌ Erreur:', data.error);
    }

    // Test 3: Récupérer les établissements
    console.log('\n📋 Test 3: GET /api/public/establishments');
    const estabResponse = await fetch(`${BASE_URL}/api/public/establishments`);
    const estabData = await estabResponse.json();
    
    console.log('Status:', estabResponse.status);
    console.log('Success:', estabData.success);
    
    if (estabData.success) {
      const establishments = estabData.data?.data || estabData.data || [];
      console.log('Nombre d\'établissements:', establishments.length);
      
      if (establishments.length > 0) {
        console.log('\n📍 Premier établissement:');
        const firstEstab = establishments[0];
        console.log('  - ID:', firstEstab.id || firstEstab._id);
        console.log('  - Nom:', firstEstab.name);
        console.log('  - Ville:', firstEstab.location?.city);
      }
    }

    console.log('\n✅ Tests terminés');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('Assurez-vous que le serveur de développement est en cours d\'exécution (npm run dev)');
  }
}

// Exécuter les tests
testAccommodationsAPI();
