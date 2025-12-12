/**
 * Script pour vérifier les coordonnées des établissements
 */

const mongoose = require('mongoose');

// Schema simplifié pour les établissements
const EstablishmentSchema = new mongoose.Schema({
  name: String,
  location: {
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Establishment = mongoose.model('Establishment', EstablishmentSchema);

// Limites géographiques du Burundi
const BURUNDI_BOUNDS = {
  minLat: -4.5,
  maxLat: -2.3,
  minLng: 28.9,
  maxLng: 30.9
};

function isValidBurundiCoordinates(lat, lng) {
  return lat >= BURUNDI_BOUNDS.minLat && 
         lat <= BURUNDI_BOUNDS.maxLat && 
         lng >= BURUNDI_BOUNDS.minLng && 
         lng <= BURUNDI_BOUNDS.maxLng;
}

function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

async function verifyCoordinates() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les établissements
    const establishments = await Establishment.find({});
    console.log(`\n📍 ${establishments.length} établissements trouvés`);

    if (establishments.length === 0) {
      console.log('\n⚠️  Aucun établissement dans la base de données');
      console.log('💡 Exécutez: node scripts/fix-location-data.js create-test');
      return;
    }

    console.log('\n🔍 Vérification des Coordonnées:');
    console.log('================================');

    let validCount = 0;
    let invalidCount = 0;
    let missingCount = 0;

    establishments.forEach((establishment, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      const name = establishment.name || 'Sans nom';
      const city = establishment.location?.city || 'Ville inconnue';
      
      console.log(`\n${num}. ${name} (${city})`);
      
      if (!establishment.location?.coordinates) {
        console.log('   ❌ Coordonnées manquantes');
        missingCount++;
        return;
      }

      const { lat, lng } = establishment.location.coordinates;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.log('   ❌ Coordonnées invalides (type)');
        invalidCount++;
        return;
      }

      const isValid = isValidBurundiCoordinates(lat, lng);
      const formatted = formatCoordinates(lat, lng);
      
      if (isValid) {
        console.log(`   ✅ ${formatted} - Valide pour le Burundi`);
        validCount++;
      } else {
        console.log(`   ❌ ${formatted} - Hors limites du Burundi`);
        console.log(`      Limites: ${BURUNDI_BOUNDS.minLat}° à ${BURUNDI_BOUNDS.maxLat}°N, ${BURUNDI_BOUNDS.minLng}° à ${BURUNDI_BOUNDS.maxLng}°E`);
        invalidCount++;
      }

      // Afficher l'adresse si disponible
      if (establishment.location?.address) {
        console.log(`      📍 ${establishment.location.address}`);
      }
    });

    // Résumé
    console.log('\n📊 Résumé:');
    console.log('==========');
    console.log(`✅ Coordonnées valides: ${validCount}`);
    console.log(`❌ Coordonnées invalides: ${invalidCount}`);
    console.log(`⚠️  Coordonnées manquantes: ${missingCount}`);
    console.log(`📍 Total: ${establishments.length}`);

    const successRate = ((validCount / establishments.length) * 100).toFixed(1);
    console.log(`📈 Taux de validité: ${successRate}%`);

    // Recommandations
    console.log('\n💡 Recommandations:');
    console.log('===================');
    
    if (invalidCount > 0 || missingCount > 0) {
      console.log('🔧 Exécuter la correction des données:');
      console.log('   node scripts/fix-location-data.js');
      console.log('');
    }
    
    if (validCount > 0) {
      console.log('🗺️  Tester les cartes:');
      console.log('   npm run dev');
      console.log('   Visiter: http://localhost:3000/test-maps');
      console.log('');
    }

    // Vérifications spécifiques
    console.log('🔍 Vérifications Spécifiques:');
    console.log('=============================');

    // Vérifier les doublons de coordonnées
    const coordsMap = new Map();
    establishments.forEach(est => {
      if (est.location?.coordinates) {
        const key = `${est.location.coordinates.lat},${est.location.coordinates.lng}`;
        if (coordsMap.has(key)) {
          coordsMap.get(key).push(est.name);
        } else {
          coordsMap.set(key, [est.name]);
        }
      }
    });

    const duplicates = Array.from(coordsMap.entries()).filter(([_, names]) => names.length > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  Coordonnées dupliquées détectées:');
      duplicates.forEach(([coords, names]) => {
        console.log(`   ${coords}: ${names.join(', ')}`);
      });
    } else {
      console.log('✅ Aucune coordonnée dupliquée');
    }

    // Vérifier la répartition géographique
    const cities = establishments.reduce((acc, est) => {
      const city = est.location?.city || 'Inconnue';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🏙️  Répartition par ville:');
    Object.entries(cities)
      .sort(([,a], [,b]) => b - a)
      .forEach(([city, count]) => {
        console.log(`   ${city}: ${count} établissement(s)`);
      });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la vérification
if (require.main === module) {
  verifyCoordinates();
}

module.exports = { verifyCoordinates };