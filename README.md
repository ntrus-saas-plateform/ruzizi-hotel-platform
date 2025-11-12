# 🏨 Ruzizi Hôtel Platform

> Système complet de gestion hôtelière pour la chaîne Ruzizi Hôtel au Burundi

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com)

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [Déploiement](#déploiement)

## 🎯 Vue d'ensemble

Ruzizi Hôtel Platform est une application web full-stack moderne conçue pour gérer efficacement une chaîne d'hôtels. Le système offre une solution complète pour la gestion des réservations, la facturation, le suivi des dépenses, et l'analyse des performances.

### Caractéristiques principales

- ✅ **Multi-établissements**: Gestion centralisée de plusieurs hôtels
- ✅ **Réservations avancées**: En ligne, sur place, et clients de passage
- ✅ **Gestion financière**: Facturation, paiements, et suivi des dépenses
- ✅ **Analytics**: Tableaux de bord et rapports en temps réel
- ✅ **Sécurité**: Authentification JWT et contrôle d'accès basé sur les rôles
- ✅ **Responsive**: Interface adaptée mobile, tablette et desktop

## ✨ Fonctionnalités

### FrontOffice (Public)
- 🏠 Page d'accueil attractive avec présentation de la chaîne
- 🏨 Catalogue des établissements avec filtres
- 🛏️ Détails des hébergements avec galeries photos
- 📅 Système de réservation en ligne
- 🔍 Suivi de réservation par code unique

### BackOffice (Administration)
- 📊 Dashboard avec KPIs et statistiques
- 🏢 Gestion des établissements
- 🛏️ Gestion des hébergements (chambres, suites, maisons)
- 📅 Gestion des réservations (standard + walk-in)
- 💰 Facturation et paiements multiples
- 👥 Gestion des clients avec historique
- 💸 Suivi des dépenses par catégorie
- 📈 Analytics financiers et taux d'occupation
- 🔔 Système de notifications en temps réel

### Fonctionnalités avancées
- **Walk-in Management**: Réservations horaires avec gestion multi-créneaux
- **Pricing Intelligent**: Calcul automatique selon le mode (nuitée/mensuel/horaire)
- **Availability Checking**: Prévention des doubles réservations
- **Multi-Payment**: Support de plusieurs méthodes de paiement
- **Real-time Analytics**: Données financières en temps réel

## 🛠️ Technologies

### Frontend
- **Next.js 14+** - Framework React avec App Router
- **TypeScript** - Typage statique strict
- **Tailwind CSS** - Styling moderne et responsive
- **React Hooks** - Gestion d'état moderne

### Backend
- **Next.js API Routes** - API RESTful
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification sécurisée
- **Bcrypt** - Hachage des mots de passe

### Validation & Sécurité
- **Zod** - Validation de schémas
- **Rate Limiting** - Protection contre les abus
- **Input Sanitization** - Prévention XSS
- **RBAC** - Contrôle d'accès basé sur les rôles

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- MongoDB 5+
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd ruzizi-hotel-platform
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos configurations:
```env
MONGODB_URI=mongodb://localhost:27017/ruzizi-hotel
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

4. **Démarrer MongoDB**
```bash
mongod
# ou
sudo service mongod start
```

5. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `MONGODB_URI` | URI de connexion MongoDB | ✅ |
| `JWT_SECRET` | Clé secrète pour JWT | ✅ |
| `JWT_REFRESH_SECRET` | Clé pour refresh tokens | ✅ |
| `NEXT_PUBLIC_API_URL` | URL de l'API | ✅ |
| `NODE_ENV` | Environnement (development/production) | ✅ |

### Rôles utilisateurs

- **super_admin**: Accès complet à tous les établissements
- **manager**: Accès limité à son établissement
- **staff**: Accès limité selon les permissions

## 📖 Utilisation

### Première utilisation

1. **Créer un compte super admin**
   - Aller sur `/auth/register`
   - Créer un compte avec le rôle `super_admin`

2. **Créer un établissement**
   - Se connecter au BackOffice
   - Aller dans "Établissements" → "Nouveau"
   - Remplir les informations

3. **Ajouter des hébergements**
   - Aller dans "Hébergements" → "Nouveau"
   - Configurer les chambres/suites

4. **Commencer à prendre des réservations**
   - Via le FrontOffice (en ligne)
   - Via le BackOffice (sur place)
   - Via Walk-in (clients de passage)

### Workflows principaux

#### Réservation en ligne
1. Client visite le site
2. Sélectionne établissement et hébergement
3. Choisit les dates
4. Remplit ses informations
5. Reçoit un code de réservation

#### Facturation
1. Réservation confirmée
2. Facture générée automatiquement
3. Enregistrement des paiements
4. Suivi du solde

#### Gestion Walk-in
1. Client arrive sans réservation
2. Sélection de l'hébergement
3. Choix des créneaux horaires
4. Paiement du tarif journalier complet
5. Libération automatique après départ

## 📚 Documentation

Documentation complète disponible dans:
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Détails d'implémentation
- [`QUICK_START.md`](./QUICK_START.md) - Guide de démarrage rapide
- [`TEST_REPORT.md`](./TEST_REPORT.md) - Rapport de tests
- [`PROJECT_COMPLETE.md`](./PROJECT_COMPLETE.md) - Résumé complet du projet

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Client (Browser)               │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ FrontOffice  │  │  BackOffice  │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Next.js App Router               │
│  ┌────────────────────────────────┐    │
│  │      API Routes Layer           │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       Business Logic Layer               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Auth │ │Booking│ │Invoice│ │ HR   │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Data Access Layer                │
│  ┌────────────────────────────────┐    │
│  │    Mongoose Models & Schemas    │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          MongoDB Database                │
└─────────────────────────────────────────┘
```

## 🔒 Sécurité

### Mesures implémentées
- ✅ Authentification JWT avec expiration
- ✅ Hachage des mots de passe (bcrypt)
- ✅ Contrôle d'accès basé sur les rôles (RBAC)
- ✅ Validation des entrées (Zod)
- ✅ Sanitization des données
- ✅ Protection XSS
- ✅ Rate limiting
- ✅ CORS configuré

### Recommandations production
- Utiliser HTTPS/SSL
- Configurer des secrets JWT forts
- Activer le rate limiting strict
- Mettre en place un WAF
- Configurer les backups automatiques

## ✅ Tests

### Tests effectués
- ✅ Compilation TypeScript (0 erreurs)
- ✅ Tests fonctionnels manuels
- ✅ Tests d'intégration API
- ✅ Tests de sécurité
- ✅ Tests de performance

### Lancer les tests
```bash
# Tests TypeScript
npm run type-check

# Build de production
npm run build

# Linter
npm run lint
```

## 🚢 Déploiement

### Options de déploiement

#### Vercel (Recommandé)
```bash
npm install -g vercel
vercel
```

#### Docker
```bash
docker build -t ruzizi-hotel .
docker run -p 3000:3000 ruzizi-hotel
```

#### Serveur traditionnel
```bash
npm run build
npm start
```

### Checklist pré-déploiement
- [ ] Variables d'environnement configurées
- [ ] Base de données production configurée
- [ ] Secrets JWT forts définis
- [ ] HTTPS/SSL activé
- [ ] Backups configurés
- [ ] Monitoring en place

## 📊 Statistiques du projet

- **Lignes de code**: 15,000+
- **Fichiers**: 120+
- **Modèles**: 8
- **Services**: 9
- **API Routes**: 50+
- **Pages**: 18+
- **Composants**: 20+

## 🤝 Contribution

Ce projet est développé pour Ruzizi Hôtel. Pour toute question ou suggestion:
- Email: contact@ruzizihotel.bi
- Téléphone: +257 XX XX XX XX

## 📄 Licence

Propriété de Ruzizi Hôtel - Tous droits réservés

## 🎉 Remerciements

Développé avec ❤️ pour Ruzizi Hôtel

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Dernière mise à jour**: Novembre 2024
