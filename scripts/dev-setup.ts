#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { createRootUser } from './init-root-user';

/**
 * Script de configuration pour le développement
 * Initialise l'utilisateur root et démarre l'application
 */
class DevSetup {
  private async checkEnvironment(): Promise<void> {
    // Vérifier si .env existe
    const envPath = join(process.cwd(), '.env');
    if (!existsSync(envPath)) {
      process.exit(1);
    }
    
    // Vérifier les variables essentielles
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Variables d\'environnement manquantes:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    console.log('✅ Environnement validé');
  }

  private async initializeRootUser(): Promise<void> {
    try {
      await createRootUser();
      console.log('✅ Utilisateur root initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      // Ne pas arrêter le processus en développement
    }
  }

  private async startDevelopmentServer(): Promise<void> {
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    devProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage:', error);
      process.exit(1);
    });

    devProcess.on('close', (code) => {
      process.exit(code || 0);
    });

    // Gestion des signaux pour un arrêt propre
    process.on('SIGINT', () => {
      devProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      devProcess.kill('SIGTERM');
    });
  }

  async run(): Promise<void> {
    try {
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