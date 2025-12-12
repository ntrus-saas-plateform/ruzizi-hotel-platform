/**
 * Script pour corriger les données de localisation des établissements
 * avec de vraies coordonnées du Burundi
 */

const mongoose = require('mongoose');

// Coordonnées réelles des principales villes du Burundi
const BURUNDI_LOCATIONS = {
  'bujumbura': { lat: -3.3614, lng: 29.3599 },
  'gitega': { lat: -3.4264, lng: 29.9306 },
  'ngozi': { lat: -2.9077, lng: 29.8306 },
  'muyinga': { lat: -2.8444, lng: 30.3444 },
  'ruyigi': { lat: -3.4764, lng: 30.2506 },
  'bururi': { lat: -3.9489, lng: 29.6244 },
  'cibitoke': { lat: -2.8806, lng: 29.1306 },
  'kayanza': { lat: -2.9222, lng: 29.6306 },
  'rutana': { lat: -3.9333, lng: 29.9833 },
  'makamba': { lat: -4.1333, lng: 29.8000 },
  'cankuzo': { lat: -3.2167, lng: 30.5500 },
  'karuzi': { lat: -3.1000, lng: 30.1667 },
  'kirundo': { lat: -2.5833, lng: 30.1000 },
  'bubanza': { lat: -3.0833, lng: 29.3833 },
  'muramvya': { lat: -3.2667, lng: 29.6167 },
  'mwaro': { lat: -3.5000, lng: 29.7000 },
  'rumonge': { lat: -3.9667, lng: 29.4333 },
  'bujumbura rural': { lat: -3.4000, lng: 29.2500 }
};

// Adresses réalistes pour chaque ville
const REALISTIC_ADDRESSES = {
  'bujumbura': [
    "Avenue de l'Université, Rohero",
    "Boulevard du 28 Novembre, Centre-ville",
    "Avenue de la Révolution, Ngagara",
    "Rue de la Plage, Bujumbura",
    "Avenue Patrice Lumumba, Kinindo",
    "Boulevard de l'UPRONA, Kamenge"
  ],
  'gitega': [
    "Avenue de l'Indépendance, Gitega",
    "Rue du Marché Central, Gitega",
    "Avenue des Martyrs, Gitega"
  ],
  'ngozi': [
    "Avenue Principale, Ngozi",
    "Rue du Commerce, Ngozi",
    "Place du Marché, Ngozi"
  ],
  'muyinga': [
    "Avenue Centrale, Muyinga",
    "Rue de la Paix, Muyinga"
  ],
  'default': [
    "Centre-ville",
    "Avenue Principale",
    "Rue Centrale"
  ]
};

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

// Fonction pour obtenir des coordonnées réalistes
function getRealisticCoordinates(cityName) {
  const normalizedCity = cityName.toLowerCase().trim();
  
  // Chercher une correspondance exacte
  if (BURUNDI_LOCATIONS[normalizedCity]) {
    return BURUNDI_LOCATIONS[normalizedCity];
  }
  
  // Chercher une correspondance partielle
  for (const [city, coords] of Object.entries(BURUNDI_LOCATIONS)) {
    if (normalizedCity.includes(city) || city.includes(normalizedCity)) {
      return coords;
    }
  }
  
  // Par défaut, utiliser Bujumbura
  return BURUNDI_LOCATIONS.bujumbura;
}

// Fonction pour obtenir une adresse réaliste
function getRealisticAddress(cityName) {
  const normalizedCity = cityName.toLowerCase().trim();
  
  if (REALISTIC_ADDRESSES[normalizedCity]) {
    const addresses = REALISTIC_ADDRESSES[normalizedCity];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }
  
  // Utiliser une adresse par défaut
  const defaultAddresses = REALISTIC_ADDRESSES.default;
  return defaultAddresses[Math.floor(Math.random() * defaultAddresses.length)];
}

// Fonction pour ajouter une petite variation aux coordonnées
function addCoordinateVariation(coords, maxVariation = 0.01) {
  return {
    lat: coords.lat + (Math.random() - 0.5) * maxVariation,
    lng: coords.lng + (Math.random() - 0.5) * maxVariation
  };
}

async function fixLocationData() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les établissements
    const establishments = await Establishment.find({});
    console.log(`📍 ${establishments.length} établissements trouvés`);

    let updatedCount = 0;

    for (const establishment of establishments) {
      const currentCoords = establishment.location?.coordinates;
      const cityName = establishment.location?.city || 'bujumbura';
      
      // Vérifier si les coordonnées sont valides pour le Burundi
      const isValidBurundiCoords = currentCoords && 
        currentCoords.lat >= -4.5 && currentCoords.lat <= -2.3 &&
        currentCoords.lng >= 28.9 && currentCoords.lng <= 30.9;

      if (!isValidBurundiCoords) {
        // Obtenir de nouvelles coordonnées réalistes
        const baseCoords = getRealisticCoordinates(cityName);
        const newCoords = addCoordinateVariation(baseCoords, 0.005); // Variation de ~500m
        const newAddress = getRealisticAddress(cityName);

        // Mettre à jour l'établissement
        await Establishment.findByIdAndUpdate(establishment._id, {
          $set: {
            'location.coordinates': newCoords,
            'location.address': newAddress
          }
        });

        console.log(`🔧 Mis à jour: ${establishment.name}`);
        console.log(`   Ville: ${cityName}`);
        console.log(`   Anciennes coordonnées: ${currentCoords?.lat || 'N/A'}, ${currentCoords?.lng || 'N/A'}`);
        console.log(`   Nouvelles coordonnées: ${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`);
        console.log(`   Nouvelle adresse: ${newAddress}`);
        console.log('');

        updatedCount++;
      } else {
        console.log(`✅ Coordonnées valides pour: ${establishment.name} (${cityName})`);
      }
    }

    console.log(`\n🎉 Correction terminée!`);
    console.log(`📊 ${updatedCount} établissements mis à jour`);
    console.log(`✅ ${establishments.length - updatedCount} établissements déjà corrects`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction des données:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Fonction pour créer des établissements de test avec de bonnes coordonnées
async function createTestEstablishments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel');
    console.log('✅ Connecté à MongoDB pour créer des établissements de test');

    const testEstablishments = [
      {
        name: 'Ruzizi Hôtel Bujumbura Centre',
        description: 'Hôtel moderne situé au cœur de Bujumbura, offrant un accès facile aux principales attractions de la capitale burundaise.',
        location: {
          city: 'Bujumbura',
          address: "Avenue de l'Université, Rohero",
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.bujumbura, 0.003)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 24 56 78', '+257 79 12 34 56'],
          email: 'bujumbura@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant', 'Piscine', 'Spa', 'Parking gratuit', 'Service en chambre 24h/24'],
        totalCapacity: 120,
        isActive: true
      },
      {
        name: 'Ruzizi Hôtel Gitega',
        description: 'Établissement élégant dans la capitale politique du Burundi, parfait pour les voyages d\'affaires et le tourisme culturel.',
        location: {
          city: 'Gitega',
          address: "Avenue de l'Indépendance, Gitega",
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.gitega, 0.003)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 40 12 34'],
          email: 'gitega@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant', 'Salle de conférence', 'Parking'],
        totalCapacity: 80,
        isActive: true
      },
      {
        name: 'Ruzizi Résidence Ngozi',
        description: 'Résidence confortable dans le nord du pays, idéale pour les séjours prolongés et les familles.',
        location: {
          city: 'Ngozi',
          address: "Avenue Principale, Ngozi",
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.ngozi, 0.003)
        },
        pricingMode: 'monthly',
        contacts: {
          phone: ['+257 22 30 45 67'],
          email: 'ngozi@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Cuisine équipée', 'Parking', 'Jardin'],
        totalCapacity: 60,
        isActive: true
      }
    ];

    for (const estData of testEstablishments) {
      const existing = await Establishment.findOne({ name: estData.name });
      if (!existing) {
        const establishment = new Establishment(estData);
        await establishment.save();
        console.log(`✅ Créé: ${estData.name} à ${estData.location.city}`);
      } else {
        console.log(`⚠️  Existe déjà: ${estData.name}`);
      }
    }

    console.log('\n🎉 Établissements de test créés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des établissements de test:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'create-test') {
    createTestEstablishments();
  } else {
    fixLocationData();
  }
}

module.exports = {
  fixLocationData,
  createTestEstablishments,
  BURUNDI_LOCATIONS,
  getRealisticCoordinates,
  getRealisticAddress
};