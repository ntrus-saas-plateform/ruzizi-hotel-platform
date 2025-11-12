#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import RootUserInitializer from './init-root-user';

/**
 * Script de configuration pour le développement
 * Initialise l'utilisateur root et démarre l'application
 */
class DevSetup {
  private async checkEnvironment(): Promise<void> {
    console.log('🔍 Vérification de l\'environnement de développement...');
    
    // Vérifier si .env existe
    const envPath = join(process.cwd(), '.env');
    if (!existsSync(envPath)) {
      console.log('⚠️  Fichier .env non trouvé');
      console.log('📋 Copiez .env.example vers .env et configurez vos variables');
      process.exit(1);
    }
    
    // Vérifier les variables essentielles
    const requiredVars = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Variables d\'environnement manquantes:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      process.exit(1);
    }
    
    console.log('✅ Environnement configuré correctement');
  }

  private async initializeRootUser(): Promise<void> {
    console.log('🔐 Initialisation de l\'utilisateur root...');
    
    try {
      const initializer = new RootUserInitializer();
      await initializer.initialize();
      console.log('✅ Utilisateur root initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      // Ne pas arrêter le processus en développement
      console.log('⚠️  Continuons sans l\'utilisateur root...');
    }
  }

  private async startDevelopmentServer(): Promise<void> {
    console.log('🚀 Démarrage du serveur de développement...');
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    devProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage:', error);
      process.exit(1);
    });

    devProcess.on('close', (code) => {
      console.log(`🛑 Serveur arrêté avec le code: ${code}`);
      process.exit(code || 0);
    });

    // Gestion des signaux pour un arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du serveur...');
      devProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du serveur...');
      devProcess.kill('SIGTERM');
    });
  }

  async run(): Promise<void> {
    try {
      console.log('🏨 Ruzizi Hôtel - Configuration de Développement\n');
      
      await this.checkEnvironment();
      await this.initializeRootUser();
      await this.startDevelopmentServer();
      
    } catch (error) {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    }
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  const setup = new DevSetup();
  setup.run().catch((error) => {
    console.error('💥 Échec de la configuration:', error);
    process.exit(1);
  });
}

export default DevSetup;