const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
const ROOT_EMAIL = 'admin@ruzizihotel.com';
const ROOT_FIRST_NAME = 'Admin';
const ROOT_LAST_NAME = 'Ruzizi';

// Fonction pour générer un mot de passe de 6 caractères
function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Fonction principale
async function createRootUser() {
  let client;

  try {
    console.log('🔄 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur root existe déjà
    const existingUser = await usersCollection.findOne({ email: ROOT_EMAIL });

    if (existingUser) {
      console.log('⚠️  L\'utilisateur root existe déjà!');
      console.log(`📧 Email: ${ROOT_EMAIL}`);
      console.log('ℹ️  Utilisez la fonction "Mot de passe oublié" si nécessaire.');
      return;
    }

    // Générer le mot de passe
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur root
    const rootUser = {
      firstName: ROOT_FIRST_NAME,
      lastName: ROOT_LAST_NAME,
      email: ROOT_EMAIL,
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: [
        'manage_users',
        'manage_establishments',
        'manage_accommodations',
        'manage_bookings',
        'manage_finances',
        'view_analytics',
        'system_admin'
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      establishmentId: null // Super admin n'est lié à aucun établissement spécifique
    };

    // Insérer l'utilisateur
    const result = await usersCollection.insertOne(rootUser);

    if (result.insertedId) {
      console.log('✅ Utilisateur root créé avec succès!');
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 INFORMATIONS DE CONNEXION');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   📧 Email:        ${ROOT_EMAIL}`);
      console.log(`   🔑 Mot de passe: ${password}`);
      console.log(`   🆔 ID:           ${result.insertedId}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('🔐 IMPORTANT: Notez bien ce mot de passe, il ne sera plus affiché!');
      console.log('🌐 Connectez-vous sur: http://localhost:3000/backoffice/login');
      console.log('');
      console.log('💡 Conseil: Changez ce mot de passe après votre première connexion.');
      console.log('');
    } else {
      throw new Error('Échec de la création de l\'utilisateur');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connexion MongoDB fermée.');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  createRootUser();
}

module.exports = { createRootUser };
