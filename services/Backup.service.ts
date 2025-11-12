import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  collections?: string[];
}

interface BackupResult {
  success: boolean;
  filePath?: string;
  size?: number;
  duration?: number;
  error?: string;
}

class BackupService {
  private readonly defaultOutputDir = path.join(process.cwd(), 'backups');
  private readonly dbUri = process.env.MONGODB_URI || '';

  /**
   * Créer un backup de la base de données
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      // Créer le dossier de backup s'il n'existe pas
      const outputDir = options.outputDir || this.defaultOutputDir;
      await fs.mkdir(outputDir, { recursive: true });

      // Générer le nom du fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(outputDir, backupName);

      // Construire la commande mongodump
      let command = `mongodump --uri="${this.dbUri}" --out="${backupPath}"`;

      // Ajouter les collections spécifiques si demandé
      if (options.collections && options.collections.length > 0) {
        const dbName = this.extractDbName(this.dbUri);
        command = options.collections
          .map(col => `mongodump --uri="${this.dbUri}" --db="${dbName}" --collection="${col}" --out="${backupPath}"`)
          .join(' && ');
      }

      // Exécuter le backup
      await execAsync(command);

      // Compresser si demandé
      let finalPath = backupPath;
      if (options.compress) {
        const zipPath = `${backupPath}.zip`;
        await execAsync(`zip -r "${zipPath}" "${backupPath}"`);
        await fs.rm(backupPath, { recursive: true });
        finalPath = zipPath;
      }

      // Obtenir la taille du fichier
      const stats = await fs.stat(finalPath);
      const duration = Date.now() - startTime;

      return {
        success: true,
        filePath: finalPath,
        size: stats.size,
        duration,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Restaurer un backup
   */
  async restoreBackup(backupPath: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      // Vérifier que le fichier existe
      await fs.access(backupPath);

      // Si c'est un zip, le décompresser d'abord
      let actualPath = backupPath;
      if (backupPath.endsWith('.zip')) {
        const extractPath = backupPath.replace('.zip', '');
        await execAsync(`unzip -o "${backupPath}" -d "${path.dirname(backupPath)}"`);
        actualPath = extractPath;
      }

      // Construire la commande mongorestore
      const command = `mongorestore --uri="${this.dbUri}" --drop "${actualPath}"`;

      // Exécuter la restauration
      await execAsync(command);

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Lister tous les backups disponibles
   */
  async listBackups(outputDir?: string): Promise<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
  }[]> {
    try {
      const dir = outputDir || this.defaultOutputDir;
      const files = await fs.readdir(dir);
      
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup-'))
          .map(async (file) => {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            return {
              name: file,
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime,
            };
          })
      );

      // Trier par date de création (plus récent en premier)
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Erreur lors de la liste des backups:', error);
      return [];
    }
  }

  /**
   * Supprimer un backup
   */
  async deleteBackup(backupPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(backupPath);
      
      if (stats.isDirectory()) {
        await fs.rm(backupPath, { recursive: true });
      } else {
        await fs.unlink(backupPath);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du backup:', error);
      return false;
    }
  }

  /**
   * Nettoyer les anciens backups
   */
  async cleanOldBackups(daysToKeep: number = 30, outputDir?: string): Promise<number> {
    try {
      const backups = await this.listBackups(outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.createdAt < cutoffDate) {
          const deleted = await this.deleteBackup(backup.path);
          if (deleted) deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des backups:', error);
      return 0;
    }
  }

  /**
   * Créer un backup automatique quotidien
   */
  async scheduleDailyBackup(): Promise<void> {
    // Cette fonction devrait être appelée par un cron job
    console.log('Démarrage du backup quotidien...');
    
    const result = await this.createBackup({
      compress: true,
    });

    if (result.success) {
      console.log(`Backup créé avec succès: ${result.filePath}`);
      console.log(`Taille: ${(result.size! / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Durée: ${(result.duration! / 1000).toFixed(2)} secondes`);

      // Nettoyer les backups de plus de 30 jours
      const deletedCount = await this.cleanOldBackups(30);
      console.log(`${deletedCount} ancien(s) backup(s) supprimé(s)`);
    } else {
      console.error(`Erreur lors du backup: ${result.error}`);
    }
  }

  /**
   * Extraire le nom de la base de données de l'URI
   */
  private extractDbName(uri: string): string {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'ruzizi-hotel';
  }
}

export default new BackupService();
