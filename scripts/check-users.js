const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';

async function checkUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const users = await User.find({}).lean();
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 Utilisateur ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Permissions: ${JSON.stringify(user.permissions)}`);
      console.log(`   ID: ${user._id}`);
    });

    if (users.length > 0) {
      console.log('\n❓ Voulez-vous supprimer ces utilisateurs?');
      console.log('   Exécutez: node scripts/delete-all-users.js');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

checkUsers();
