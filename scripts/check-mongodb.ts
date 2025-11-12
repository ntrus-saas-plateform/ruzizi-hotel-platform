#!/usr/bin/env ts-node

import mongoose from 'mongoose';

/**
 * Script pour vérifier la connectivité MongoDB Atlas
 */
class MongoDBChecker {
  async checkConnection(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI non défini dans les variables d\'environnement');
      process.exit(1);
    }

    console.log('🔍 Vérification de la connectivité MongoDB...');
    
    // Masquer les informations sensibles dans l'affichage
    const displayUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('🔗 URI:', displayUri);

    try {
      // Tentative de connexion
      console.log('⏳ Connexion en cours...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000, // 10 secondes timeout
      });

      console.log('✅ Connexion MongoDB réussie!');

      // Vérifier les informations du serveur
      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      
      console.log('📊 Informations du serveur:');
      console.log(`   Version: ${serverStatus.version}`);
      console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)}h ${Math.floor((serverStatus.uptime % 3600) / 60)}m`);
      
      // Vérifier les bases de données
      const databases = await admin.listDatabases();
      console.log('🗄️  Bases de données disponibles:');
      databases.databases.forEach((db: any) => {
        console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });

      // Test d'écriture simple
      console.log('✍️  Test d\'écriture...');
      const testCollection = mongoose.connection.db.collection('connection_test');
      const testDoc = {
        timestamp: new Date(),
        test: 'MongoDB Atlas connection test',
        from: 'ruzizi-hotel-platform'
      };
      
      await testCollection.insertOne(testDoc);
      console.log('✅ Test d\'écriture réussi!');
      
      // Nettoyer le document de test
      await testCollection.deleteOne({ _id: testDoc._id });
      console.log('🧹 Nettoyage effectué');

    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:');
      
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
        
        // Messages d'aide spécifiques
        if (error.message.includes('authentication failed')) {
          console.error('💡 Vérifiez vos identifiants MongoDB Atlas');
        } else if (error.message.includes('network')) {
          console.error('💡 Vérifiez votre connexion internet et les paramètres de firewall');
        } else if (error.message.includes('timeout')) {
          console.error('💡 Vérifiez que votre IP est autorisée dans MongoDB Atlas Network Access');
        }
      }
      
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Connexion fermée');
    }
  }

  async checkAtlasSpecific(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) return;

    if (mongoUri.includes('mongodb+srv://')) {
      console.log('🌐 Configuration MongoDB Atlas détectée');
      
      // Extraire les informations du cluster
      const match = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)/);
      if (match) {
        const [, username, , cluster] = match;
        console.log(`👤 Utilisateur: ${username}`);
        console.log(`🏢 Cluster: ${cluster}`);
      }
      
      console.log('📋 Checklist MongoDB Atlas:');
      console.log('   ✓ URI au format mongodb+srv://');
      console.log('   ? Utilisateur de base de données créé');
      console.log('   ? IP autorisée dans Network Access');
      console.log('   ? Cluster actif et accessible');
      
    } else if (mongoUri.includes('mongodb://')) {
      console.log('🏠 Configuration MongoDB locale détectée');
    } else {
      console.log('⚠️  Format d\'URI MongoDB non reconnu');
    }
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  const checker = new MongoDBChecker();
  
  console.log('🏨 Ruzizi Hôtel - Vérification MongoDB\n');
  
  checker.checkAtlasSpecific()
    .then(() => checker.checkConnection())
    .then(() => {
      console.log('\n🎉 Vérification terminée avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Échec de la vérification:', error);
      process.exit(1);
    });
}

export default MongoDBChecker;