import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ruzizi-hotel';
const ROOT_EMAIL = 'admin@ruzizihotel.com';
const ROOT_FIRST_NAME = 'Admin';
const ROOT_LAST_NAME = 'Ruzizi';

// Configuration email (optionnel)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface RootUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  establishmentId: string | null;
}

/**
 * Génère un mot de passe sécurisé de 6 caractères
 */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Envoie un email avec les identifiants
 */
async function sendCredentialsEmail(email: string, password: string): Promise<void> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('⚠️  Configuration SMTP manquante, email non envoyé');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: SMTP_USER,
      to: email,
      subject: 'Vos identifiants administrateur - Ruzizi Hôtel',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Ruzizi Hôtel</h1>
              <p>Plateforme de Gestion Hôtelière</p>
            </div>
            
            <div class="content">
              <h2>Bienvenue, Administrateur!</h2>
              <p>Votre compte administrateur a été créé avec succès. Voici vos identifiants de connexion:</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>🔑 Mot de passe:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
                <p><strong>👤 Rôle:</strong> Super Administrateur</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${FRONTEND_URL}/backoffice/login" class="button">Se connecter maintenant</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0;">
                  <li>Changez ce mot de passe après votre première connexion</li>
                  <li>Ne partagez jamais vos identifiants</li>
                  <li>Activez l'authentification à deux facteurs si disponible</li>
                </ul>
              </div>
              
              <h3>Vos permissions:</h3>
              <ul>
                <li>✅ Gestion des utilisateurs</li>
                <li>✅ Gestion des établissements</li>
                <li>✅ Gestion des hébergements</li>
                <li>✅ Gestion des réservations</li>
                <li>✅ Gestion financière</li>
                <li>✅ Accès aux analyses</li>
                <li>✅ Administration système</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Cet email a été généré automatiquement. Ne pas répondre.</p>
              <p>&copy; ${new Date().getFullYear()} Ruzizi Hôtel. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Email envoyé avec succès à', email);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
  }
}

/**
 * Crée l'utilisateur root dans la base de données
 */
async function createRootUser(): Promise<void> {
  let client: MongoClient | null = null;

  try {
    console.log('🔄 Connexion à MongoDB...');
    console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db();
    const usersCollection = db.collection<RootUser>('users');

    // Vérifier si l'utilisateur root existe déjà
    console.log('🔍 Vérification de l\'existence de l\'utilisateur root...');
    const existingUser = await usersCollection.findOne({ email: ROOT_EMAIL });

    if (existingUser) {
      console.log('');
      console.log('⚠️  L\'utilisateur root existe déjà!');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📧 Email: ${ROOT_EMAIL}`);
      console.log(`👤 Nom: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`🆔 ID: ${existingUser._id}`);
      console.log(`📅 Créé le: ${existingUser.createdAt}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('ℹ️  Options:');
      console.log('   1. Utilisez la fonction "Mot de passe oublié" sur la page de login');
      console.log('   2. Supprimez l\'utilisateur en base et relancez ce script');
      console.log('   3. Contactez un administrateur système');
      return;
    }

    // Générer le mot de passe
    console.log('🔐 Génération du mot de passe sécurisé...');
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur root
    console.log('👤 Création de l\'utilisateur root...');
    const rootUser: RootUser = {
      firstName: ROOT_FIRST_NAME,
      lastName: ROOT_LAST_NAME,
      email: ROOT_EMAIL,
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: [
        'manage_users',
        'manage_establishments',
        'manage_accommodations',
        'manage_bookings',
        'manage_finances',
        'view_analytics',
        'system_admin',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      establishmentId: null,
    };

    const result = await usersCollection.insertOne(rootUser as any);

    if (result.insertedId) {
      console.log('✅ Utilisateur root créé avec succès!');
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 INFORMATIONS DE CONNEXION');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   📧 Email:        ${ROOT_EMAIL}`);
      console.log(`   🔑 Mot de passe: ${password}`);
      console.log(`   🆔 ID:           ${result.insertedId}`);
      console.log(`   👤 Rôle:         Super Administrateur`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('🔐 IMPORTANT: Notez bien ce mot de passe, il ne sera plus affiché!');
      console.log('🌐 URL de connexion: ' + FRONTEND_URL + '/backoffice/login');
      console.log('');

      // Envoyer l'email si configuré
      if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        console.log('📧 Envoi de l\'email avec les identifiants...');
        await sendCredentialsEmail(ROOT_EMAIL, password);
      }

      console.log('💡 Conseils de sécurité:');
      console.log('   1. Changez ce mot de passe après votre première connexion');
      console.log('   2. Activez l\'authentification à deux facteurs');
      console.log('   3. Ne partagez jamais vos identifiants');
      console.log('   4. Créez des comptes séparés pour chaque administrateur');
      console.log('');
    } else {
      throw new Error('Échec de la création de l\'utilisateur');
    }
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR:');
    console.error('═══════════════════════════════════════════════════════');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('');
        console.error('💡 MongoDB n\'est pas accessible. Vérifiez que:');
        console.error('   1. MongoDB est démarré');
        console.error('   2. L\'URI de connexion est correcte');
        console.error('   3. Le port 27017 est ouvert');
      }
    } else {
      console.error('Erreur inconnue');
    }
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Connexion MongoDB fermée.');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('');
  console.log('🏨 Ruzizi Hôtel - Initialisation Utilisateur Root');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  createRootUser().catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

export { createRootUser };
