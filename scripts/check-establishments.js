/**
 * Script pour vérifier tous les établissements dans la base de données
 */

const mongoose = require('mongoose');

// Schema simplifié pour les établissements
const EstablishmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: {
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pricingMode: String,
  contacts: {
    phone: [String],
    email: String
  },
  services: [String],
  images: [String],
  managerId: mongoose.Schema.Types.ObjectId,
  staffIds: [mongoose.Schema.Types.ObjectId],
  totalCapacity: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Establishment = mongoose.model('Establishment', EstablishmentSchema);

async function checkEstablishments() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les établissements
    const allEstablishments = await Establishment.find({});
    const activeEstablishments = await Establishment.find({ isActive: true });
    const inactiveEstablishments = await Establishment.find({ isActive: false });

    console.log('\n📊 Statistiques des Établissements:');
    console.log('===================================');
    console.log(`📍 Total: ${allEstablishments.length} établissements`);
    console.log(`✅ Actifs: ${activeEstablishments.length} établissements`);
    console.log(`❌ Inactifs: ${inactiveEstablishments.length} établissements`);

    if (allEstablishments.length === 0) {
      console.log('\n⚠️  Aucun établissement dans la base de données');
      console.log('💡 Créez des établissements avec: node scripts/fix-location-data.js create-test');
      return;
    }

    console.log('\n📋 Liste Complète des Établissements:');
    console.log('====================================');

    allEstablishments.forEach((establishment, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      const status = establishment.isActive ? '✅ Actif' : '❌ Inactif';
      const name = establishment.name || 'Sans nom';
      const city = establishment.location?.city || 'Ville inconnue';
      const hasCoords = establishment.location?.coordinates ? '📍' : '❓';
      
      console.log(`${num}. ${status} ${hasCoords} ${name} (${city})`);
      
      if (establishment.description) {
        console.log(`    📝 ${establishment.description.substring(0, 80)}...`);
      }
      
      if (establishment.location?.address) {
        console.log(`    📍 ${establishment.location.address}`);
      }
      
      if (establishment.location?.coordinates) {
        const { lat, lng } = establishment.location.coordinates;
        console.log(`    🗺️  ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
      
      if (establishment.services && establishment.services.length > 0) {
        console.log(`    🏨 Services: ${establishment.services.slice(0, 3).join(', ')}${establishment.services.length > 3 ? '...' : ''}`);
      }
      
      console.log(`    📅 Créé: ${establishment.createdAt ? establishment.createdAt.toLocaleDateString() : 'Date inconnue'}`);
      console.log('');
    });

    // Vérifier les problèmes potentiels
    console.log('🔍 Analyse des Problèmes Potentiels:');
    console.log('====================================');

    const problemsFound = [];

    // Établissements sans nom
    const noName = allEstablishments.filter(est => !est.name || est.name.trim() === '');
    if (noName.length > 0) {
      problemsFound.push(`❌ ${noName.length} établissement(s) sans nom`);
    }

    // Établissements sans coordonnées
    const noCoords = allEstablishments.filter(est => !est.location?.coordinates);
    if (noCoords.length > 0) {
      problemsFound.push(`❌ ${noCoords.length} établissement(s) sans coordonnées`);
    }

    // Établissements inactifs
    if (inactiveEstablishments.length > 0) {
      problemsFound.push(`⚠️  ${inactiveEstablishments.length} établissement(s) inactif(s)`);
      inactiveEstablishments.forEach(est => {
        console.log(`   - ${est.name || 'Sans nom'} (${est.location?.city || 'Ville inconnue'})`);
      });
    }

    // Établissements sans description
    const noDescription = allEstablishments.filter(est => !est.description || est.description.trim() === '');
    if (noDescription.length > 0) {
      problemsFound.push(`⚠️  ${noDescription.length} établissement(s) sans description`);
    }

    // Établissements sans services
    const noServices = allEstablishments.filter(est => !est.services || est.services.length === 0);
    if (noServices.length > 0) {
      problemsFound.push(`⚠️  ${noServices.length} établissement(s) sans services`);
    }

    if (problemsFound.length === 0) {
      console.log('✅ Aucun problème détecté!');
    } else {
      problemsFound.forEach(problem => console.log(problem));
    }

    // Test de l'API
    console.log('\n🌐 Test de l\'API:');
    console.log('=================');
    
    try {
      // Simuler l'appel API
      const apiResult = await Establishment.find({ isActive: true }).limit(12);
      console.log(`✅ API retournerait ${apiResult.length} établissements actifs`);
      
      if (apiResult.length !== activeEstablishments.length) {
        console.log(`⚠️  Différence détectée: ${activeEstablishments.length} actifs vs ${apiResult.length} retournés`);
      }
    } catch (error) {
      console.log(`❌ Erreur API: ${error.message}`);
    }

    // Recommandations
    console.log('\n💡 Recommandations:');
    console.log('===================');
    
    if (activeEstablishments.length < 3) {
      console.log('🔧 Créer plus d\'établissements:');
      console.log('   node scripts/fix-location-data.js create-test');
    }
    
    if (inactiveEstablishments.length > 0) {
      console.log('🔧 Activer les établissements inactifs:');
      console.log('   Vérifiez pourquoi ils sont inactifs et activez-les si nécessaire');
    }
    
    if (noCoords.length > 0) {
      console.log('🔧 Corriger les coordonnées manquantes:');
      console.log('   node scripts/fix-location-data.js');
    }

    console.log('\n🚀 Tester le frontend:');
    console.log('   npm run dev');
    console.log('   Page d\'accueil: http://localhost:3000 (limite 3)');
    console.log('   Tous les établissements: http://localhost:3000/establishments');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la vérification
if (require.main === module) {
  checkEstablishments();
}

module.exports = { checkEstablishments };