const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
const ROOT_EMAIL = 'ntrus07@outlook.fr';
const ROOT_FIRST_NAME = 'Admin';
const ROOT_LAST_NAME = 'Ruzizi';

// Fonction pour générer un mot de passe de 6 caractères
function generatePassword() {
  return 'Test1234'; // Fixed for testing
}

// Fonction principale
async function createRootUser() {
  let client;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    const usersCollection = db.collection('users');

    // Générer le mot de passe
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Vérifier si l'utilisateur root existe déjà
    const existingUser = await usersCollection.findOne({ email: ROOT_EMAIL });

    if (existingUser) {
      await usersCollection.deleteOne({ email: ROOT_EMAIL });
    }

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
      } else {
      throw new Error('Échec de la création de l\'utilisateur');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      }
  }
}

// Exécuter le script
if (require.main === module) {
  createRootUser();
}

module.exports = { createRootUser };
