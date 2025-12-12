/**
 * Script pour créer des hébergements (accommodations) pour les établissements
 */

const mongoose = require('mongoose');

// Schema pour les établissements
const EstablishmentSchema = new mongoose.Schema({
  name: String,
  location: {
    city: String,
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Schema pour les accommodations
const AccommodationSchema = new mongoose.Schema({
  name: String,
  description: String,
  type: {
    type: String,
    enum: ['standard_room', 'suite', 'house', 'apartment'],
    required: true
  },
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true
  },
  capacity: {
    maxGuests: { type: Number, required: true },
    bedrooms: Number,
    bathrooms: Number
  },
  pricing: {
    basePrice: { type: Number, required: true },
    currency: { type: String, default: 'BIF' },
    seasonalPrice: Number
  },
  amenities: [String],
  images: [String],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'inactive'],
    default: 'available'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Establishment = mongoose.model('Establishment', EstablishmentSchema);
const Accommodation = mongoose.model('Accommodation', AccommodationSchema);

// Templates d'hébergements par type d'établissement
const accommodationTemplates = {
  hotel: [
    {
      type: 'standard_room',
      names: ['Chambre Standard', 'Chambre Confort', 'Chambre Classique'],
      capacity: { maxGuests: 2, bedrooms: 1, bathrooms: 1 },
      priceRange: [80000, 120000],
      amenities: ['WiFi gratuit', 'TV écran plat', 'Climatisation', 'Minibar', 'Coffre-fort', 'Salle de bain privée']
    },
    {
      type: 'suite',
      names: ['Suite Junior', 'Suite Exécutive', 'Suite Présidentielle'],
      capacity: { maxGuests: 4, bedrooms: 2, bathrooms: 2 },
      priceRange: [150000, 250000],
      amenities: ['WiFi gratuit', 'TV écran plat', 'Climatisation', 'Minibar', 'Coffre-fort', 'Salon séparé', 'Balcon', 'Service en chambre']
    }
  ],
  residence: [
    {
      type: 'apartment',
      names: ['Appartement 1 Chambre', 'Appartement 2 Chambres', 'Appartement Familial'],
      capacity: { maxGuests: 4, bedrooms: 2, bathrooms: 1 },
      priceRange: [120000, 180000],
      amenities: ['WiFi gratuit', 'Cuisine équipée', 'Salon', 'TV', 'Lave-linge', 'Balcon', 'Parking']
    },
    {
      type: 'house',
      names: ['Maison de Passage', 'Villa Familiale', 'Maison Traditionnelle'],
      capacity: { maxGuests: 6, bedrooms: 3, bathrooms: 2 },
      priceRange: [200000, 300000],
      amenities: ['WiFi gratuit', 'Cuisine complète', 'Salon spacieux', 'TV', 'Jardin privé', 'Parking', 'Terrasse']
    }
  ],
  lodge: [
    {
      type: 'standard_room',
      names: ['Chambre Nature', 'Chambre Panoramique', 'Chambre Rustique'],
      capacity: { maxGuests: 2, bedrooms: 1, bathrooms: 1 },
      priceRange: [70000, 100000],
      amenities: ['WiFi gratuit', 'Vue sur nature', 'Ventilateur', 'Moustiquaire', 'Salle de bain écologique']
    },
    {
      type: 'house',
      names: ['Bungalow Familial', 'Chalet Écologique', 'Cabane Premium'],
      capacity: { maxGuests: 4, bedrooms: 2, bathrooms: 1 },
      priceRange: [120000, 160000],
      amenities: ['WiFi gratuit', 'Terrasse privée', 'Vue panoramique', 'Cuisine simple', 'Foyer extérieur']
    }
  ]
};

function generateRoomNumber(establishmentName, type, index) {
  const cityCode = establishmentName.includes('Bujumbura') ? 'BJ' :
                   establishmentName.includes('Gitega') ? 'GT' :
                   establishmentName.includes('Ngozi') ? 'NG' :
                   establishmentName.includes('Muyinga') ? 'MY' :
                   establishmentName.includes('Bururi') ? 'BR' :
                   establishmentName.includes('Cibitoke') ? 'CB' :
                   establishmentName.includes('Kayanza') ? 'KY' :
                   establishmentName.includes('Rutana') ? 'RT' :
                   establishmentName.includes('Makamba') ? 'MK' :
                   establishmentName.includes('Ruyigi') ? 'RY' : 'RZ';
  
  const typeCode = type === 'standard_room' ? 'R' :
                   type === 'suite' ? 'S' :
                   type === 'apartment' ? 'A' :
                   type === 'house' ? 'H' : 'X';
  
  const number = (index + 1).toString().padStart(2, '0');
  return `${cityCode}${typeCode}${number}`;
}

function getEstablishmentType(name) {
  if (name.includes('Résidence') || name.includes('Apartments')) return 'residence';
  if (name.includes('Lodge')) return 'lodge';
  return 'hotel';
}

function randomPrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function createAccommodations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel');
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les établissements actifs
    const establishments = await Establishment.find({ isActive: true });
    console.log(`\n🏨 ${establishments.length} établissements trouvés`);

    if (establishments.length === 0) {
      console.log('⚠️  Aucun établissement trouvé. Créez d\'abord des établissements.');
      return;
    }

    // Vérifier les accommodations existantes
    const existingAccommodations = await Accommodation.countDocuments();
    console.log(`📊 ${existingAccommodations} hébergements existants`);

    let totalCreated = 0;
    let totalExisting = 0;

    for (const establishment of establishments) {
      console.log(`\n🏨 Traitement: ${establishment.name} (${establishment.location.city})`);
      
      const establishmentType = getEstablishmentType(establishment.name);
      const templates = accommodationTemplates[establishmentType];
      
      console.log(`   Type: ${establishmentType}`);
      
      let accommodationIndex = 0;
      
      for (const template of templates) {
        // Créer 3-5 hébergements de chaque type
        const count = Math.floor(Math.random() * 3) + 3; // 3 à 5
        
        for (let i = 0; i < count; i++) {
          const roomNumber = generateRoomNumber(establishment.name, template.type, accommodationIndex);
          const randomName = template.names[Math.floor(Math.random() * template.names.length)];
          const fullName = `${randomName} ${roomNumber}`;
          
          // Vérifier si l'hébergement existe déjà
          const existing = await Accommodation.findOne({ 
            name: fullName, 
            establishmentId: establishment._id 
          });
          
          if (existing) {
            console.log(`   ⚠️  Existe déjà: ${fullName}`);
            totalExisting++;
            accommodationIndex++;
            continue;
          }
          
          // Créer l'hébergement
          const accommodation = new Accommodation({
            name: fullName,
            description: `${randomName} confortable dans l'établissement ${establishment.name}. Parfait pour un séjour relaxant avec toutes les commodités modernes.`,
            type: template.type,
            establishmentId: establishment._id,
            capacity: {
              ...template.capacity,
              maxGuests: template.capacity.maxGuests + Math.floor(Math.random() * 2) // Variation +0 à +1
            },
            pricing: {
              basePrice: randomPrice(template.priceRange[0], template.priceRange[1]),
              currency: 'BIF',
              seasonalPrice: null
            },
            amenities: selectRandomItems(template.amenities, Math.min(template.amenities.length, 6)),
            images: [
              '/bg.jpg', // Image par défaut
              `https://images.unsplash.com/photo-${1560000000000 + Math.floor(Math.random() * 100000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`
            ],
            status: Math.random() > 0.1 ? 'available' : 'occupied', // 90% disponible
            isActive: true
          });
          
          await accommodation.save();
          console.log(`   ✅ Créé: ${fullName} - ${accommodation.pricing.basePrice.toLocaleString()} BIF`);
          totalCreated++;
          accommodationIndex++;
        }
      }
    }

    // Statistiques finales
    const finalCount = await Accommodation.countDocuments();
    const activeCount = await Accommodation.countDocuments({ isActive: true, status: 'available' });

    console.log('\n📊 Résumé Final:');
    console.log('================');
    console.log(`✅ Nouveaux hébergements créés: ${totalCreated}`);
    console.log(`⚠️  Hébergements existants: ${totalExisting}`);
    console.log(`📍 Total dans la base: ${finalCount}`);
    console.log(`🟢 Hébergements disponibles: ${activeCount}`);

    // Répartition par établissement
    console.log('\n🏨 Répartition par Établissement:');
    console.log('=================================');
    
    for (const establishment of establishments) {
      const count = await Accommodation.countDocuments({ 
        establishmentId: establishment._id,
        isActive: true 
      });
      console.log(`   ${establishment.name}: ${count} hébergement(s)`);
    }

    // Répartition par type
    const typeStats = await Accommodation.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🛏️  Répartition par Type:');
    console.log('========================');
    typeStats.forEach(stat => {
      const typeName = stat._id === 'standard_room' ? 'Chambres Standard' :
                       stat._id === 'suite' ? 'Suites' :
                       stat._id === 'apartment' ? 'Appartements' :
                       stat._id === 'house' ? 'Maisons' : stat._id;
      console.log(`   ${typeName}: ${stat.count}`);
    });

    console.log('\n🎉 Création terminée avec succès!');
    console.log('\n🚀 Testez maintenant:');
    console.log('   npm run dev');
    console.log('   http://localhost:3000 (section "Nos Chambres & Maisons de Passage")');
    console.log('   http://localhost:3000/accommodations');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la création
if (require.main === module) {
  createAccommodations();
}

module.exports = { createAccommodations };