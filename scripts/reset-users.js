const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';

async function resetUsers() {
  let client;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Compter les utilisateurs
    const count = await usersCollection.countDocuments();
    trouvé(s)`);

    if (count === 0) {
      return;
    }

    // Supprimer tous les utilisateurs
    const result = await usersCollection.deleteMany({});
    supprimé(s)`);
    } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      }
  }
}

resetUsers();
