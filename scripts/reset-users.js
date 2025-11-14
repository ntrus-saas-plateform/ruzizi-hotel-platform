const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';

async function resetUsers() {
  let client;

  try {
    console.log('🔄 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Compter les utilisateurs
    const count = await usersCollection.countDocuments();
    console.log(`📊 ${count} utilisateur(s) trouvé(s)`);

    if (count === 0) {
      console.log('ℹ️  Aucun utilisateur à supprimer');
      return;
    }

    // Supprimer tous les utilisateurs
    const result = await usersCollection.deleteMany({});
    console.log(`✅ ${result.deletedCount} utilisateur(s) supprimé(s)`);
    console.log('');
    console.log('💡 Redémarrez l\'application pour créer un nouvel utilisateur root');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connexion fermée');
    }
  }
}

resetUsers();
