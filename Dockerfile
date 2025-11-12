# Dockerfile multi-stage pour optimiser la taille de l'image
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat wget curl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des packages
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./

# Stage pour les dépendances
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Stage pour le build
FROM base AS builder
COPY . .
RUN npm ci
RUN npm run build

# Stage de production
FROM node:18-alpine AS runner
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le stage builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/models ./models

# Copier les dépendances de production
COPY --from=deps /app/node_modules ./node_modules

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Changer vers l'utilisateur non-root
USER nextjs

# Script de démarrage
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Commande de démarrage
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]