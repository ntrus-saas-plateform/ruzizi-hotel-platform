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
   * Génère un mot de passe sécurisé de 6 caractères
   * Format: 2 lettres majuscules + 2 chiffres + 2 lettres minuscules
   */
  private generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    let password = '';
    
    // 2 lettres majuscules
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    
    // 2 chiffres
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // 2 lettres minuscules
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    
    // Mélanger les caractères pour plus de sécurité
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Génère un code de vérification à 6 chiffres
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Envoie les identifiants par email avec design amélioré
   */
  private async sendCredentialsEmail(email: string, password: string, firstName: string): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/backoffice/login`;
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@ruzizihotel.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+257 69 65 75 54';

    const mailOptions = {
      from: {
        name: 'Ruzizi Hôtel',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ruzizihotel.com'
      },
      to: email,
      subject: '🔐 Ruzizi Hôtel - Vos Identifiants Administrateur Root',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Identifiants Administrateur Root</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #1f2937; 
              background: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .header { 
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 32px; 
              font-weight: 700; 
              margin-bottom: 8px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.95;
            }
            .content { 
              padding: 40px 30px; 
            }
            .greeting { 
              font-size: 24px; 
              font-weight: 600; 
              color: #111827;
              margin-bottom: 20px;
            }
            .intro { 
              font-size: 16px; 
              color: #4b5563; 
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .credentials-box { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 30px; 
              border-radius: 12px; 
              border: 2px solid #fbbf24;
              margin: 30px 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .credentials-box h3 { 
              font-size: 20px; 
              font-weight: 700; 
              color: #92400e;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .credential-item { 
              background: white; 
              padding: 16px; 
              border-radius: 8px; 
              margin-bottom: 12px;
              border: 1px solid #fbbf24;
            }
            .credential-item:last-child { margin-bottom: 0; }
            .credential-label { 
              font-size: 12px; 
              font-weight: 600; 
              color: #92400e; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .credential-value { 
              font-size: 18px; 
              font-weight: 700; 
              color: #1f2937;
              font-family: 'Courier New', monospace;
              letter-spacing: 1px;
            }
            .password-value {
              background: #f3f4f6;
              padding: 12px 16px;
              border-radius: 6px;
              display: inline-block;
              border: 2px dashed #d97706;
            }
            .warning-box { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #f59e0b;
              padding: 24px; 
              border-radius: 12px; 
              margin: 30px 0;
            }
            .warning-box h4 { 
              font-size: 18px; 
              font-weight: 700; 
              color: #92400e;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .warning-box ul { 
              list-style: none; 
              padding: 0;
            }
            .warning-box li { 
              padding: 8px 0 8px 28px; 
              position: relative;
              color: #78350f;
              font-size: 14px;
              line-height: 1.6;
            }
            .warning-box li:before { 
              content: "⚠️"; 
              position: absolute; 
              left: 0;
            }
            .button-container { 
              text-align: center; 
              margin: 40px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 10px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.4);
            }
            .features { 
              background: #f9fafb; 
              padding: 24px; 
              border-radius: 12px; 
              margin: 30px 0;
            }
            .features h3 { 
              font-size: 18px; 
              font-weight: 700; 
              color: #111827;
              margin-bottom: 16px;
            }
            .features ul { 
              list-style: none; 
              padding: 0;
            }
            .features li { 
              padding: 10px 0 10px 32px; 
              position: relative;
              color: #4b5563;
              font-size: 14px;
            }
            .features li:before { 
              content: "✓"; 
              position: absolute; 
              left: 0; 
              color: #10b981; 
              font-weight: 700;
              font-size: 18px;
            }
            .support-box {
              background: #eff6ff;
              border: 2px solid #3b82f6;
              padding: 24px;
              border-radius: 12px;
              margin: 30px 0;
            }
            .support-box h4 {
              font-size: 16px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 12px;
            }
            .support-box p {
              color: #1e3a8a;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .support-box a {
              color: #2563eb;
              text-decoration: none;
              font-weight: 600;
            }
            .footer { 
              background: #f9fafb;
              text-align: center; 
              padding: 30px; 
              color: #6b7280; 
              font-size: 13px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p { 
              margin: 8px 0;
            }
            .footer strong {
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Ruzizi Hôtel</h1>
              <p>Système de Gestion Hôtelière</p>
            </div>
            
            <div class="content">
              <div class="greeting">Bonjour ${firstName} 👋</div>
              
              <p class="intro">
                Félicitations ! Votre compte <strong>Administrateur Root</strong> a été créé avec succès. 
                Vous disposez maintenant d'un accès complet au système de gestion Ruzizi Hôtel.
              </p>
              
              <div class="credentials-box">
                <h3>🔐 Vos Identifiants de Connexion</h3>
                
                <div class="credential-item">
                  <div class="credential-label">📧 Adresse Email</div>
                  <div class="credential-value">${email}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">🔑 Mot de Passe Temporaire</div>
                  <div class="credential-value">
                    <span class="password-value">${password}</span>
                  </div>
                </div>
              </div>
              
              <div class="warning-box">
                <h4>⚠️ Consignes de Sécurité Importantes</h4>
                <ul>
                  <li><strong>Changez immédiatement</strong> ce mot de passe lors de votre première connexion</li>
                  <li><strong>Ne partagez jamais</strong> vos identifiants avec qui que ce soit</li>
                  <li><strong>Utilisez un mot de passe fort</strong> avec au moins 8 caractères (majuscules, minuscules, chiffres, symboles)</li>
                  <li><strong>Activez l'authentification à deux facteurs</strong> dès que possible</li>
                  <li><strong>Déconnectez-vous toujours</strong> après chaque session</li>
                  <li><strong>Ne vous connectez pas</strong> depuis des réseaux publics non sécurisés</li>
                </ul>
              </div>
              
              <div class="button-container">
                <a href="${loginUrl}" class="button">
                  🚀 Se Connecter au Système
                </a>
              </div>
              
              <div class="features">
                <h3>🎯 Fonctionnalités Disponibles</h3>
                <ul>
                  <li><strong>Gestion Complète des Établissements</strong> - Créer, modifier et gérer tous les hôtels</li>
                  <li><strong>Administration des Utilisateurs</strong> - Gérer les rôles et permissions</li>
                  <li><strong>Suivi des Réservations</strong> - Monitoring en temps réel</li>
                  <li><strong>Gestion Financière</strong> - Dépenses, revenus et rapports</li>
                  <li><strong>Analytics Avancés</strong> - Tableaux de bord et statistiques</li>
                  <li><strong>Rapports Détaillés</strong> - Exports et analyses personnalisées</li>
                  <li><strong>Configuration Système</strong> - Paramètres avancés et backups</li>
                  <li><strong>Audit Trail</strong> - Historique complet des actions</li>
                </ul>
              </div>
              
              <div class="support-box">
                <h4>💬 Besoin d'Aide ?</h4>
                <p><strong>Email Support:</strong> <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                <p><strong>Téléphone:</strong> <a href="tel:${supportPhone}">${supportPhone}</a></p>
                <p>Notre équipe technique est disponible 24/7 pour vous assister.</p>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Cordialement,<br>
                <strong style="color: #111827;">L'équipe Ruzizi Hôtel</strong>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>⚡ Email généré automatiquement</strong></p>
              <p>Cet email a été envoyé lors de l'initialisation de votre compte administrateur.</p>
              <p>Pour des raisons de sécurité, ne répondez pas à cet email.</p>
              <p style="margin-top: 16px;">© ${new Date().getFullYear()} <strong>Ruzizi Hôtel</strong> - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Version texte pour les clients email qui ne supportent pas HTML
      text: `
Bonjour ${firstName},

Votre compte Administrateur Root a été créé avec succès pour le système de gestion Ruzizi Hôtel.

VOS IDENTIFIANTS DE CONNEXION:
================================
Email: ${email}
Mot de passe: ${password}

CONSIGNES DE SÉCURITÉ:
======================
- Changez ce mot de passe lors de votre première connexion
- Ne partagez jamais vos identifiants
- Utilisez l'authentification à deux facteurs
- Déconnectez-vous toujours après utilisation

CONNEXION:
==========
${loginUrl}

SUPPORT:
========
Email: ${supportEmail}
Téléphone: ${supportPhone}

Cordialement,
L'équipe Ruzizi Hôtel

© ${new Date().getFullYear()} Ruzizi Hôtel - Tous droits réservés
      `.trim()
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
      console.log('📊 Détails du compte:');
      console.log('   - ID:', rootUser._id);
      console.log('   - Nom:', `${rootConfig.firstName} ${rootConfig.lastName}`);
      console.log('   - Email:', rootConfig.email);
      console.log('   - Rôle: Root Administrator');
      console.log('   - Permissions:', rootUser.permissions.length, 'permissions accordées');

      // Envoyer les identifiants par email
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          await this.sendCredentialsEmail(rootConfig.email, password, rootConfig.firstName);
          console.log('📧 Email avec les identifiants envoyé à:', rootConfig.email);
          console.log('✅ Vérifiez votre boîte de réception');
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
          console.log('\n🔑 IDENTIFIANTS DE CONNEXION (À NOTER MANUELLEMENT):');
          console.log('═══════════════════════════════════════════════════');
          console.log('   Email:', rootConfig.email);
          console.log('   Mot de passe:', password);
          console.log('═══════════════════════════════════════════════════');
          console.log('⚠️  Conservez ces identifiants en lieu sûr !');
        }
      } else {
        console.log('\n⚠️  Configuration SMTP manquante - Email non envoyé');
        console.log('💡 Configurez les variables d\'environnement SMTP pour activer l\'envoi d\'emails');
        console.log('\n🔑 IDENTIFIANTS DE CONNEXION:');
        console.log('═══════════════════════════════════════════════════');
        console.log('   Email:', rootConfig.email);
        console.log('   Mot de passe:', password);
        console.log('═══════════════════════════════════════════════════');
        console.log('⚠️  Conservez ces identifiants en lieu sûr !');
      }

      // Créer un log de création
      await this.createInitializationLog(rootUser._id.toString(), rootConfig.email, password);

    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'utilisateur root:', error);
      throw error;
    }
  }

  /**
   * Crée un log de l'initialisation (optionnel, pour audit)
   */
  private async createInitializationLog(userId: string, email: string, password: string): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(process.cwd(), 'logs');
      
      // Créer le dossier logs s'il n'existe pas
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const logFile = path.join(logsDir, 'root-user-initialization.log');
      const logEntry = `
═══════════════════════════════════════════════════════════════
ROOT USER INITIALIZATION LOG
═══════════════════════════════════════════════════════════════
Date: ${new Date().toISOString()}
User ID: ${userId}
Email: ${email}
Temporary Password: ${password}
Status: SUCCESS
═══════════════════════════════════════════════════════════════

⚠️  IMPORTANT SECURITY NOTICE:
- This file contains sensitive information
- Delete this file after first login
- Change the password immediately after first login
- Keep this information secure

═══════════════════════════════════════════════════════════════
`;

      fs.appendFileSync(logFile, logEntry);
      console.log('📝 Log de création enregistré dans:', logFile);
      console.log('⚠️  Supprimez ce fichier après la première connexion pour des raisons de sécurité');
    } catch (error) {
      console.error('⚠️  Impossible de créer le log:', error);
      // Ne pas bloquer le processus si le log échoue
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