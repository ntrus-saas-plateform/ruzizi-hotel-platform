/**
 * Script pour créer plus d'établissements de test
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

// Coordonnées réelles des villes du Burundi
const BURUNDI_LOCATIONS = {
  bujumbura: { lat: -3.3614, lng: 29.3599 },
  gitega: { lat: -3.4264, lng: 29.9306 },
  ngozi: { lat: -2.9077, lng: 29.8306 },
  muyinga: { lat: -2.8444, lng: 30.3444 },
  ruyigi: { lat: -3.4764, lng: 30.2506 },
  bururi: { lat: -3.9489, lng: 29.6244 },
  cibitoke: { lat: -2.8806, lng: 29.1306 },
  kayanza: { lat: -2.9222, lng: 29.6306 },
  rutana: { lat: -3.9333, lng: 29.9833 },
  makamba: { lat: -4.1333, lng: 29.8000 }
};

function addCoordinateVariation(coords, maxVariation = 0.005) {
  return {
    lat: coords.lat + (Math.random() - 0.5) * maxVariation,
    lng: coords.lng + (Math.random() - 0.5) * maxVariation
  };
}

async function createMoreEstablishments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel');
    console.log('✅ Connecté à MongoDB');

    const newEstablishments = [
      {
        name: 'Ruzizi Lodge Muyinga',
        description: 'Lodge paisible dans l\'est du Burundi, parfait pour découvrir la nature et la culture locale. Offre une expérience authentique avec un service personnalisé.',
        location: {
          city: 'Muyinga',
          address: 'Route Nationale, Muyinga',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.muyinga)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 50 12 34'],
          email: 'muyinga@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant local', 'Excursions guidées', 'Parking'],
        totalCapacity: 40,
        isActive: true
      },
      {
        name: 'Ruzizi Resort Bururi',
        description: 'Resort de montagne offrant des vues spectaculaires et un air pur. Idéal pour les retraites et les séjours de détente en famille.',
        location: {
          city: 'Bururi',
          address: 'Colline Bururi, Province Bururi',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.bururi)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 60 45 67'],
          email: 'bururi@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant panoramique', 'Spa', 'Randonnées', 'Piscine'],
        totalCapacity: 60,
        isActive: true
      },
      {
        name: 'Ruzizi Business Cibitoke',
        description: 'Hôtel d\'affaires moderne près de la frontière, équipé pour les voyageurs d\'affaires et les conférences internationales.',
        location: {
          city: 'Cibitoke',
          address: 'Avenue du Commerce, Cibitoke',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.cibitoke)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 35 78 90'],
          email: 'cibitoke@ruzizihotel.com'
        },
        services: ['WiFi haut débit', 'Salle de conférence', 'Restaurant', 'Service navette', 'Parking sécurisé'],
        totalCapacity: 80,
        isActive: true
      },
      {
        name: 'Ruzizi Garden Kayanza',
        description: 'Hôtel-jardin au cœur des plantations de thé, offrant une expérience unique dans un cadre verdoyant et apaisant.',
        location: {
          city: 'Kayanza',
          address: 'Route des Théiers, Kayanza',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.kayanza)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 45 23 56'],
          email: 'kayanza@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant bio', 'Visite des plantations', 'Spa naturel', 'Jardin botanique'],
        totalCapacity: 50,
        isActive: true
      },
      {
        name: 'Ruzizi Heritage Rutana',
        description: 'Établissement patrimonial célébrant la culture burundaise, avec architecture traditionnelle et hospitalité authentique.',
        location: {
          city: 'Rutana',
          address: 'Centre Culturel, Rutana',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.rutana)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 55 67 89'],
          email: 'rutana@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant traditionnel', 'Spectacles culturels', 'Artisanat local', 'Parking'],
        totalCapacity: 35,
        isActive: true
      },
      {
        name: 'Ruzizi Lakeside Makamba',
        description: 'Hôtel au bord du lac avec vue imprenable, parfait pour les amoureux de la nature et les activités nautiques.',
        location: {
          city: 'Makamba',
          address: 'Rive du Lac, Makamba',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.makamba)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 65 34 12'],
          email: 'makamba@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant avec terrasse', 'Sports nautiques', 'Pêche', 'Plage privée'],
        totalCapacity: 45,
        isActive: true
      },
      {
        name: 'Ruzizi Apartments Bujumbura Nord',
        description: 'Appartements meublés modernes pour séjours prolongés, idéaux pour les familles et les professionnels en mission.',
        location: {
          city: 'Bujumbura',
          address: 'Quartier Kamenge, Bujumbura',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.bujumbura, 0.01)
        },
        pricingMode: 'monthly',
        contacts: {
          phone: ['+257 79 88 77 66'],
          email: 'apartments@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Cuisine équipée', 'Ménage hebdomadaire', 'Parking', 'Sécurité 24h'],
        totalCapacity: 30,
        isActive: true
      },
      {
        name: 'Ruzizi Transit Ruyigi',
        description: 'Hôtel de transit confortable pour les voyageurs, avec services essentiels et tarifs abordables.',
        location: {
          city: 'Ruyigi',
          address: 'Carrefour Principal, Ruyigi',
          coordinates: addCoordinateVariation(BURUNDI_LOCATIONS.ruyigi)
        },
        pricingMode: 'nightly',
        contacts: {
          phone: ['+257 22 70 45 23'],
          email: 'ruyigi@ruzizihotel.com'
        },
        services: ['WiFi gratuit', 'Restaurant simple', 'Parking', 'Réception 24h'],
        totalCapacity: 25,
        isActive: true
      }
    ];

    console.log(`\n🏨 Création de ${newEstablishments.length} nouveaux établissements...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const estData of newEstablishments) {
      const existing = await Establishment.findOne({ name: estData.name });
      if (!existing) {
        const establishment = new Establishment(estData);
        await establishment.save();
        console.log(`✅ Créé: ${estData.name} à ${estData.location.city}`);
        createdCount++;
      } else {
        console.log(`⚠️  Existe déjà: ${estData.name}`);
        existingCount++;
      }
    }

    // Statistiques finales
    const totalEstablishments = await Establishment.countDocuments();
    const activeEstablishments = await Establishment.countDocuments({ isActive: true });

    console.log('\n📊 Résumé:');
    console.log('==========');
    console.log(`✅ Nouveaux établissements créés: ${createdCount}`);
    console.log(`⚠️  Établissements existants: ${existingCount}`);
    console.log(`📍 Total dans la base: ${totalEstablishments}`);
    console.log(`🟢 Établissements actifs: ${activeEstablishments}`);

    // Répartition par ville
    const cities = await Establishment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🏙️  Répartition par ville:');
    cities.forEach(city => {
      console.log(`   ${city._id}: ${city.count} établissement(s)`);
    });

    console.log('\n🎉 Création terminée avec succès!');
    console.log('\n🚀 Testez maintenant:');
    console.log('   npm run dev');
    console.log('   http://localhost:3000/establishments');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la création
if (require.main === module) {
  createMoreEstablishments();
}

module.exports = { createMoreEstablishments };