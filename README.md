# 🏨 Ruzizi Hôtel Platform

Système de gestion hôtelière moderne et complet pour la chaîne Ruzizi Hôtel au Burundi.

## ✨ Fonctionnalités

- 🏢 **Gestion multi-établissements** - Administration centralisée de plusieurs hôtels
- 🛏️ **Gestion des hébergements** - Chambres, suites, et logements variés
- 📅 **Système de réservation** - Interface moderne pour les clients
- 👥 **Gestion des utilisateurs** - Rôles et permissions granulaires
- 💳 **Gestion des paiements** - Intégration avec plusieurs moyens de paiement
- 📊 **Rapports et analyses** - Tableaux de bord détaillés
- 🌐 **Interface multilingue** - Support français/anglais
- 📱 **Design responsive** - Optimisé pour tous les appareils

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ 
- Compte MongoDB Atlas (ou MongoDB local)
- npm ou yarn
- Docker (optionnel)

### Installation Locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-org/ruzizi-hotel-platform.git
   cd ruzizi-hotel-platform
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec votre URI MongoDB Atlas
   ```

   **Configuration MongoDB Atlas :**
   1. Créez un cluster sur [MongoDB Atlas](https://cloud.mongodb.com)
   2. Créez un utilisateur de base de données
   3. Autorisez votre IP dans Network Access
   4. Copiez l'URI de connexion dans votre `.env` :
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ruzizi_hotel?retryWrites=true&w=majority
   ```

4. **Démarrage avec initialisation automatique**
   ```bash
   npm run dev:setup
   ```
   
   Cette commande va :
   - Vérifier votre configuration
   - Créer automatiquement l'utilisateur root
   - Envoyer les identifiants par email
   - Démarrer le serveur de développement

### Installation avec Docker

#### Production (MongoDB Atlas)
```bash
cp .env.example .env
# Configurer MONGODB_URI avec votre cluster Atlas
docker-compose up -d
```

#### Développement (avec MongoDB local optionnel)
```bash
cp .env.example .env
# Pour utiliser MongoDB local en développement
docker-compose -f docker-compose.dev.yml --profile local-db up -d
```

#### Vérifier les logs
```bash
docker-compose logs -f app
```

## 🔐 Utilisateur Root

L'utilisateur administrateur root est créé automatiquement au démarrage avec :

- **Email** : Configuré via `ROOT_USER_EMAIL` (défaut: admin@ruzizihotel.com)
- **Mot de passe** : Généré automatiquement et envoyé par email
- **Permissions** : Accès complet au système

### Variables d'environnement pour l'utilisateur root

```env
ROOT_USER_EMAIL=admin@ruzizihotel.com
ROOT_USER_FIRSTNAME=Administrateur
ROOT_USER_LASTNAME=Root
ROOT_USER_PHONE=+257 69 65 75 54
```

### Configuration SMTP pour l'envoi d'emails

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@ruzizihotel.com
```

## 📋 Scripts Disponibles

### Développement
```bash
npm run dev              # Démarrer le serveur de développement
npm run dev:setup        # Démarrage avec initialisation complète
npm run init:root        # Créer/recréer l'utilisateur root
```

### Build et Production
```bash
npm run build           # Build de production
npm run start           # Démarrer en mode production
npm run type-check      # Vérification TypeScript
```

### Tests et Qualité
```bash
npm run test            # Exécuter les tests
npm run test:watch      # Tests en mode watch
npm run test:coverage   # Tests avec couverture
npm run lint            # Linting du code
npm run format          # Formatage du code
```

### Docker
```bash
npm run docker:build    # Build de l'image Docker
npm run docker:run      # Démarrer avec Docker Compose
npm run docker:stop     # Arrêter les conteneurs
npm run docker:logs     # Voir les logs
npm run docker:clean    # Nettoyer complètement
```

## 🏗️ Architecture

```
ruzizi-hotel-platform/
├── app/                    # Pages Next.js App Router
│   ├── (frontoffice)/     # Interface client
│   ├── api/               # API Routes
│   └── backoffice/        # Interface administration
├── components/            # Composants React
│   ├── frontoffice/       # Composants client
│   └── backoffice/        # Composants admin
├── models/               # Modèles MongoDB
├── services/             # Services métier
├── types/                # Types TypeScript
├── scripts/              # Scripts d'initialisation
├── docker/               # Configuration Docker
└── .github/              # GitHub Actions
```

## 🗄️ Configuration MongoDB Atlas

### Étapes de configuration

1. **Créer un compte MongoDB Atlas**
   - Rendez-vous sur [MongoDB Atlas](https://cloud.mongodb.com)
   - Créez un compte gratuit

2. **Créer un cluster**
   - Choisissez le plan gratuit (M0)
   - Sélectionnez une région proche (Europe recommandée)
   - Nommez votre cluster (ex: `ruzizi-cluster`)

3. **Configurer l'accès**
   ```bash
   # Créer un utilisateur de base de données
   Username: ruzizi_admin
   Password: [générer un mot de passe sécurisé]
   
   # Autoriser l'accès réseau
   IP Address: 0.0.0.0/0 (pour développement)
   # En production, limitez aux IPs spécifiques
   ```

4. **Obtenir l'URI de connexion**
   ```env
   # Format de l'URI
   MONGODB_URI=mongodb+srv://ruzizi_admin:PASSWORD@ruzizi-cluster.xxxxx.mongodb.net/ruzizi_hotel?retryWrites=true&w=majority
   ```

### Sécurité MongoDB Atlas

- ✅ **Chiffrement** automatique des données
- 🔐 **Authentification** obligatoire
- 🛡️ **Firewall** intégré avec whitelist IP
- 📊 **Monitoring** et alertes inclus
- 🔄 **Backups** automatiques

## 🔧 Configuration

### Variables d'environnement essentielles

```env
# Base de données MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ruzizi_hotel?retryWrites=true&w=majority

# Authentification
NEXTAUTH_SECRET=votre-secret-tres-securise
JWT_SECRET=votre-jwt-secret

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Utilisateur root (créé automatiquement)
ROOT_USER_EMAIL=admin@ruzizihotel.com
ROOT_USER_FIRSTNAME=Administrateur
ROOT_USER_LASTNAME=Root

# Email (recommandé pour recevoir les identifiants)
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@ruzizihotel.com
```

## 🚀 Déploiement

### Avec Docker (Recommandé)

1. **Configuration de production**
   ```bash
   cp .env.example .env.production
   # Configurer pour la production
   ```

2. **Déploiement**
   ```bash
   docker-compose -f docker-compose.yml --env-file .env.production up -d
   ```

### Déploiement manuel

1. **Build de production**
   ```bash
   npm run build
   ```

2. **Démarrage**
   ```bash
   npm start
   ```

## 🔄 CI/CD avec GitHub Actions

Le projet inclut des workflows GitHub Actions pour :

- ✅ **Tests automatiques** sur chaque push/PR
- 🔒 **Analyse de sécurité** avec Trivy
- 🏗️ **Build et push** des images Docker
- 🚀 **Déploiement automatique** sur la branche main
- 📧 **Notifications** Slack

### Secrets GitHub requis

```
MONGODB_URI              # URI de la base de données
ROOT_USER_EMAIL          # Email de l'admin root
SMTP_HOST               # Serveur SMTP
SMTP_USER               # Utilisateur SMTP
SMTP_PASS               # Mot de passe SMTP
DEPLOY_HOST             # Serveur de déploiement
DEPLOY_USER             # Utilisateur SSH
DEPLOY_SSH_KEY          # Clé SSH privée
SLACK_WEBHOOK           # Webhook Slack (optionnel)
```

## 🛡️ Sécurité

- 🔐 **Authentification JWT** avec refresh tokens
- 🔒 **Hashage bcrypt** pour les mots de passe
- 👤 **Système de rôles** granulaire
- 🛡️ **Validation Zod** sur toutes les entrées
- 🔍 **Audit logs** pour traçabilité
- 🚫 **Rate limiting** sur les API

## 📊 Monitoring

- 📈 **Métriques de performance** intégrées
- 🚨 **Alertes automatiques** en cas d'erreur
- 📋 **Logs structurés** avec rotation
- 🔍 **Tracing distribué** pour debug

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- 📧 **Email** : support@ruzizihotel.com
- 📱 **Téléphone** : +257 69 65 75 54
- 🌐 **Site web** : https://ruzizihotel.com

## 🙏 Remerciements

- L'équipe Ruzizi Hôtel pour leur confiance
- La communauté open source pour les outils utilisés
- Tous les contributeurs du projet

---

**Développé avec ❤️ pour Ruzizi Hôtel**