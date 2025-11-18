const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const users = await User.find({}).lean();
    trouvé(s)`);
    
    users.forEach((user, index) => {
      }`);
      });

    if (users.length > 0) {
      }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    }
}

checkUsers();
