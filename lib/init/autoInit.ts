import { connectDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

let initialized = false;

const ROOT_EMAIL = process.env.ROOT_EMAIL || 'ntrus07@outlook.fr';
const ROOT_FIRST_NAME = 'Admin';
const ROOT_LAST_NAME = 'Ruzizi';

// Configuration email
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD; // Support both variable names
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Génère un mot de passe sécurisé
 */
function generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
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
        console.log('📧 Configuration SMTP détectée, envoi de l\'email...');
        console.log(`   Host: ${SMTP_HOST}`);
        console.log(`   Port: ${SMTP_PORT}`);
        console.log(`   User: ${SMTP_USER}`);
        console.log(`   Secure: ${SMTP_SECURE || (SMTP_PORT === 465)}`);
        
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE || (SMTP_PORT === 465),
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
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Ruzizi Hôtel</h1>
            </div>
            <div class="content">
              <h2>Bienvenue, Administrateur!</h2>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mot de passe:</strong> ${password}</p>
              </div>
              <a href="${FRONTEND_URL}/backoffice/login" class="button">Se connecter</a>
              <p><strong>Important:</strong> Changez ce mot de passe après votre première connexion.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé avec succès à', email);
        console.log('   Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:');
        if (error instanceof Error) {
            console.error('   Message:', error.message);
        }
        console.error('   Détails:', error);
    }
}

/**
 * Initialise l'utilisateur root au démarrage
 */
export async function autoInitRootUser(): Promise<void> {
    if (initialized) return;

    try {
        const mongoose = await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error('Database connection not established');
        }

        const usersCollection = db.collection('users');

        // Vérifier si un utilisateur existe
        const userCount = await usersCollection.countDocuments();

        if (userCount > 0) {
            initialized = true;
            return;
        }

        console.log('');
        console.log('🔄 Aucun utilisateur trouvé - Création de l\'utilisateur root...');

        // Générer le mot de passe
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        // Créer l'utilisateur root
        const rootUser = {
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

        const result = await usersCollection.insertOne(rootUser);

        if (result.insertedId) {
            console.log('✅ Utilisateur root créé!');
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 IDENTIFIANTS DE CONNEXION');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`   📧 Email:        ${ROOT_EMAIL}`);
            console.log(`   🔑 Mot de passe: ${password}`);
            console.log('═══════════════════════════════════════════════════════');
            console.log('');
            console.log('🌐 Connexion: ' + FRONTEND_URL + '/backoffice/login');
            console.log('🔐 Changez ce mot de passe après la première connexion!');
            console.log('');

            // Envoyer l'email si configuré
            if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
                await sendCredentialsEmail(ROOT_EMAIL, password);
            }
        }

        initialized = true;
    } catch (error) {
        console.error('❌ Erreur initialisation root user:', error);
    }
}
