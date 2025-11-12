# Guide de Déploiement - Ruzizi Hôtel Platform

## Vue d'ensemble

Ce guide décrit le processus de déploiement de la plateforme Ruzizi Hôtel en production.

## Prérequis

### Infrastructure Requise

- **Node.js**: v18.x ou supérieur
- **MongoDB**: v6.0 ou supérieur (MongoDB Atlas recommandé)
- **Serveur**: VPS ou Cloud (Vercel, AWS, DigitalOcean, etc.)
- **Domaine**: Nom de domaine avec certificat SSL
- **Email**: Service SMTP pour les notifications

### Outils Nécessaires

- Git
- npm ou yarn
- PM2 (pour déploiement sur VPS)
- Docker (optionnel)

## Configuration de l'Environnement de Production

### 1. Variables d'Environnement

Créez un fichier `.env.production` avec les variables suivantes:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ruzizi-hotel?retryWrites=true&w=majority

# Authentication
JWT_SECRET=votre-secret-jwt-tres-securise-minimum-32-caracteres
JWT_REFRESH_SECRET=votre-refresh-secret-tres-securise-minimum-32-caracteres
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@ruzizihotel.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Monitoring (optionnel)
SENTRY_DSN=https://your-sentry-dsn
```

### 2. Configuration MongoDB Atlas

1. **Créer un Cluster**
   - Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un nouveau cluster (M0 gratuit pour commencer)
   - Choisissez la région la plus proche de vos utilisateurs

2. **Configuration Réseau**
   - Whitelist IP: Ajoutez l'IP de votre serveur
   - Ou autorisez toutes les IPs (0.0.0.0/0) avec authentification forte

3. **Créer un Utilisateur**
   - Créez un utilisateur avec droits de lecture/écriture
   - Notez le nom d'utilisateur et mot de passe

4. **Obtenir la Chaîne de Connexion**
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
   ```

### 3. Configuration SSL/HTTPS

#### Option A: Vercel (Automatique)
- SSL géré automatiquement par Vercel
- Aucune configuration nécessaire

#### Option B: Let's Encrypt (VPS)
```bash
# Installer Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

## Méthodes de Déploiement

### Option 1: Déploiement sur Vercel (Recommandé)

#### Avantages
- Déploiement automatique depuis Git
- SSL gratuit
- CDN global
- Scaling automatique
- Zero-downtime deployments

#### Étapes

1. **Préparer le Projet**
   ```bash
   # S'assurer que le build fonctionne
   npm run build
   ```

2. **Connecter à Vercel**
   ```bash
   # Installer Vercel CLI
   npm i -g vercel

   # Se connecter
   vercel login

   # Déployer
   vercel --prod
   ```

3. **Configurer les Variables d'Environnement**
   - Allez dans Project Settings > Environment Variables
   - Ajoutez toutes les variables du fichier `.env.production`

4. **Configurer le Domaine**
   - Allez dans Project Settings > Domains
   - Ajoutez votre domaine personnalisé

### Option 2: Déploiement sur VPS (Ubuntu)

#### Étapes

1. **Préparer le Serveur**
   ```bash
   # Mettre à jour le système
   sudo apt-get update && sudo apt-get upgrade -y

   # Installer Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Installer PM2
   sudo npm install -g pm2

   # Installer Nginx
   sudo apt-get install nginx -y
   ```

2. **Cloner le Projet**
   ```bash
   cd /var/www
   git clone https://github.com/votre-repo/ruzizi-hotel-platform.git
   cd ruzizi-hotel-platform
   ```

3. **Installer les Dépendances**
   ```bash
   npm install --production
   ```

4. **Configurer les Variables d'Environnement**
   ```bash
   cp .env.example .env.production
   nano .env.production
   # Remplir les variables
   ```

5. **Build l'Application**
   ```bash
   npm run build
   ```

6. **Configurer PM2**
   ```bash
   # Créer le fichier ecosystem.config.js
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'ruzizi-hotel',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       instances: 'max',
       exec_mode: 'cluster',
       autorestart: true,
       watch: false,
       max_memory_restart: '1G'
     }]
   }
   EOF

   # Démarrer l'application
   pm2 start ecosystem.config.js

   # Sauvegarder la configuration
   pm2 save

   # Démarrage automatique au boot
   pm2 startup
   ```

7. **Configurer Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/ruzizi-hotel
   ```

   Contenu:
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com www.votre-domaine.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Activer le site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ruzizi-hotel /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 3: Déploiement avec Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped

volumes:
  mongodb_data:
```

Déployer:
```bash
docker-compose up -d
```

## Monitoring et Logging

### 1. Configuration de Sentry (Monitoring d'Erreurs)

```bash
npm install @sentry/nextjs
```

Créer `sentry.client.config.js`:
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### 2. Logs avec PM2

```bash
# Voir les logs
pm2 logs ruzizi-hotel

# Logs en temps réel
pm2 logs ruzizi-hotel --lines 100

# Rotation des logs
pm2 install pm2-logrotate
```

### 3. Health Check Endpoint

Créer `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 500 });
  }
}
```

## Backup et Récupération

### 1. Backup MongoDB

#### Backup Automatique (Script)

```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="ruzizi-hotel"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

Automatiser avec cron:
```bash
# Éditer crontab
crontab -e

# Ajouter (backup quotidien à 2h du matin)
0 2 * * * /path/to/backup-mongodb.sh
```

### 2. Restauration

```bash
mongorestore --uri="$MONGODB_URI" --drop /path/to/backup/directory
```

## Sécurité en Production

### 1. Checklist de Sécurité

- ✅ HTTPS activé
- ✅ Variables d'environnement sécurisées
- ✅ Rate limiting configuré
- ✅ CORS configuré correctement
- ✅ Headers de sécurité (CSP, HSTS, etc.)
- ✅ Validation des entrées
- ✅ Sanitization des données
- ✅ Authentification forte
- ✅ Logs d'audit activés
- ✅ Backups automatiques

### 2. Headers de Sécurité

Dans `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Performance Optimization

### 1. Caching

- Utiliser Redis pour le cache (optionnel)
- Activer le cache Next.js
- CDN pour les assets statiques

### 2. Database Indexing

Vérifier que tous les index sont créés:
```javascript
// Dans les modèles Mongoose
schema.index({ field: 1 });
```

### 3. Compression

Nginx gzip déjà configuré, vérifier:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

## Mise à Jour en Production

### Déploiement Zero-Downtime

```bash
# 1. Pull les dernières modifications
git pull origin main

# 2. Installer les dépendances
npm install --production

# 3. Build
npm run build

# 4. Reload PM2 (zero-downtime)
pm2 reload ecosystem.config.js
```

## Troubleshooting

### Problèmes Courants

1. **Application ne démarre pas**
   - Vérifier les logs: `pm2 logs`
   - Vérifier les variables d'environnement
   - Vérifier la connexion MongoDB

2. **Erreurs 502 Bad Gateway**
   - Vérifier que l'application tourne: `pm2 status`
   - Vérifier la configuration Nginx
   - Vérifier les ports

3. **Performance lente**
   - Vérifier les logs de requêtes lentes MongoDB
   - Activer le monitoring
   - Vérifier les index de base de données

## Support

Pour toute question sur le déploiement:
- Consultez ce guide
- Vérifiez les logs
- Contactez l'équipe DevOps

---

**Dernière mise à jour**: Novembre 2025  
**Version**: 1.0
