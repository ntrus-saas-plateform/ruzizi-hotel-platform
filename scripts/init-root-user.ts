import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.model';

interface RootUserConfig {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

class RootUserInitializer {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration du transporteur email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Génère un mot de passe sécurisé
   */
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Envoie les identifiants par email
   */
  private async sendCredentialsEmail(email: string, password: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Ruzizi Hôtel - Identifiants Administrateur Root',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Identifiants Administrateur</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Ruzizi Hôtel</h1>
              <p>Système de Gestion Hôtelière</p>
            </div>
            
            <div class="content">
              <h2>Bonjour ${firstName},</h2>
              
              <p>Votre compte administrateur root a été créé avec succès pour le système de gestion Ruzizi Hôtel.</p>
              
              <div class="credentials">
                <h3>🔐 Vos identifiants de connexion :</h3>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Mot de passe :</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
              </div>
              
              <div class="warning">
                <h4>⚠️ Important - Sécurité</h4>
                <ul>
                  <li>Changez ce mot de passe lors de votre première connexion</li>
                  <li>Ne partagez jamais vos identifiants</li>
                  <li>Utilisez l'authentification à deux facteurs si disponible</li>
                  <li>Déconnectez-vous toujours après utilisation</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/backoffice/login" class="button">
                  Se connecter au système
                </a>
              </div>
              
              <h3>🎯 Fonctionnalités disponibles :</h3>
              <ul>
                <li>Gestion complète des établissements</li>
                <li>Administration des utilisateurs et rôles</li>
                <li>Suivi des réservations en temps réel</li>
                <li>Rapports et analyses détaillées</li>
                <li>Configuration système avancée</li>
              </ul>
              
              <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'équipe technique.</p>
              
              <p>Cordialement,<br>
              <strong>L'équipe Ruzizi Hôtel</strong></p>
            </div>
            
            <div class="footer">
              <p>Cet email a été généré automatiquement lors de l'initialisation du système.</p>
              <p>© ${new Date().getFullYear()} Ruzizi Hôtel - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Crée l'utilisateur root s'il n'existe pas
   */
  async createRootUser(): Promise<void> {
    try {
      console.log('🔍 Vérification de l\'existence de l\'utilisateur root...');

      // Vérifier si un utilisateur root existe déjà
      const existingRootUser = await User.findOne({ 
        $or: [
          { role: 'root' },
          { email: process.env.ROOT_USER_EMAIL }
        ]
      });

      if (existingRootUser) {
        console.log('✅ Utilisateur root déjà existant:', existingRootUser.email);
        return;
      }

      // Configuration de l'utilisateur root depuis les variables d'environnement
      const rootConfig: RootUserConfig = {
        email: process.env.ROOT_USER_EMAIL || 'admin@ruzizihotel.com',
        firstName: process.env.ROOT_USER_FIRSTNAME || 'Administrateur',
        lastName: process.env.ROOT_USER_LASTNAME || 'Root',
        phone: process.env.ROOT_USER_PHONE || '+257 69 65 75 54',
      };

      // Générer un mot de passe sécurisé
      const password = this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(password, 12);

      // Créer l'utilisateur root
      const rootUser = new User({
        firstName: rootConfig.firstName,
        lastName: rootConfig.lastName,
        email: rootConfig.email,
        phone: rootConfig.phone,
        password: hashedPassword,
        role: 'root',
        isActive: true,
        isEmailVerified: true,
        permissions: [
          'manage_users',
          'manage_establishments',
          'manage_accommodations',
          'manage_bookings',
          'manage_payments',
          'view_reports',
          'manage_system',
          'manage_settings'
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await rootUser.save();

      console.log('✅ Utilisateur root créé avec succès:', rootConfig.email);

      // Envoyer les identifiants par email
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          await this.sendCredentialsEmail(rootConfig.email, password, rootConfig.firstName);
          console.log('📧 Email avec les identifiants envoyé à:', rootConfig.email);
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
          console.log('🔑 Identifiants de connexion (à noter manuellement):');
          console.log('   Email:', rootConfig.email);
          console.log('   Mot de passe:', password);
        }
      } else {
        console.log('⚠️  Configuration SMTP manquante. Identifiants de connexion:');
        console.log('   Email:', rootConfig.email);
        console.log('   Mot de passe:', password);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'utilisateur root:', error);
      throw error;
    }
  }

  /**
   * Initialise la connexion à la base de données et crée l'utilisateur root
   */
  async initialize(): Promise<void> {
    try {
      // Connexion à MongoDB
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI non défini dans les variables d\'environnement');
      }

      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connexion à MongoDB établie');

      // Créer l'utilisateur root
      await this.createRootUser();

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    } finally {
      // Fermer la connexion
      await mongoose.disconnect();
      console.log('🔌 Connexion MongoDB fermée');
    }
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  const initializer = new RootUserInitializer();
  initializer.initialize()
    .then(() => {
      console.log('🎉 Initialisation terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de l\'initialisation:', error);
      process.exit(1);
    });
}

export default RootUserInitializer;