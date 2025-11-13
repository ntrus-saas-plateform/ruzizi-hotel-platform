# 🔐 Guide de Configuration de l'Utilisateur Root

## 📋 Vue d'Ensemble

Ce guide explique comment créer et configurer l'utilisateur root (administrateur principal) pour la plateforme Ruzizi Hotel.

---

## 🚀 Création Automatique de l'Utilisateur Root

### Prérequis

1. **MongoDB** doit être en cours d'exécution
2. **Variables d'environnement** configurées dans `.env`
3. **Node.js** et **npm** installés

### Configuration des Variables d'Environnement

Créez ou modifiez votre fichier `.env` avec les informations suivantes :

```env
# Database
MONGODB_URI="mongodb://localhost:27017/ruzizi-hotel"

# Root User Configuration
ROOT_USER_EMAIL="admin@ruzizihotel.com"
ROOT_USER_FIRSTNAME="Administrateur"
ROOT_USER_LASTNAME="Root"
ROOT_USER_PHONE="+257 69 65 75 54"

# Email Configuration (OBLIGATOIRE pour recevoir le mot de passe)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
SMTP_FROM="noreply@ruzizihotel.com"

# Support Contact
SUPPORT_EMAIL="support@ruzizihotel.com"
SUPPORT_PHONE="+257 69 65 75 54"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

---

## 📧 Configuration Email (Gmail)

### Étape 1 : Activer l'Authentification à Deux Facteurs

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Sécurité → Validation en deux étapes
3. Activez la validation en deux étapes

### Étape 2 : Générer un Mot de Passe d'Application

1. Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sélectionnez "Autre (nom personnalisé)"
3. Entrez "Ruzizi Hotel Platform"
4. Cliquez sur "Générer"
5. Copiez le mot de passe généré (16 caractères)
6. Utilisez ce mot de passe dans `SMTP_PASS`

### Autres Fournisseurs Email

#### **Outlook/Hotmail**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

#### **Yahoo**
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

#### **SendGrid**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="votre-api-key-sendgrid"
```

---

## 🎯 Exécution du Script

### Méthode 1 : Via npm script

```bash
npm run init:root
```

### Méthode 2 : Via ts-node

```bash
npx ts-node scripts/init-root-user.ts
```

### Méthode 3 : Via Node.js (après compilation)

```bash
npm run build
node dist/scripts/init-root-user.js
```

---

## 📊 Sortie du Script

### Succès Complet

```
🔍 Vérification de l'existence de l'utilisateur root...
✅ Connexion à MongoDB établie
✅ Utilisateur root créé avec succès: admin@ruzizihotel.com
📊 Détails du compte:
   - ID: 507f1f77bcf86cd799439011
   - Nom: Administrateur Root
   - Email: admin@ruzizihotel.com
   - Rôle: Root Administrator
   - Permissions: 8 permissions accordées
📧 Email avec les identifiants envoyé à: admin@ruzizihotel.com
✅ Vérifiez votre boîte de réception
📝 Log de création enregistré dans: /path/to/logs/root-user-initialization.log
⚠️  Supprimez ce fichier après la première connexion
🔌 Connexion MongoDB fermée
🎉 Initialisation terminée avec succès
```

### Sans Configuration Email

```
⚠️  Configuration SMTP manquante - Email non envoyé
💡 Configurez les variables d'environnement SMTP pour activer l'envoi d'emails

🔑 IDENTIFIANTS DE CONNEXION:
═══════════════════════════════════════════════════
   Email: admin@ruzizihotel.com
   Mot de passe: AB12cd
═══════════════════════════════════════════════════
⚠️  Conservez ces identifiants en lieu sûr !
```

---

## 🔑 Format du Mot de Passe Généré

Le mot de passe est généré automatiquement avec **6 caractères** :
- **2 lettres majuscules** (A-Z)
- **2 chiffres** (0-9)
- **2 lettres minuscules** (a-z)

**Exemple** : `AB12cd`, `XY89pq`, `MN45wx`

Les caractères sont mélangés aléatoirement pour plus de sécurité.

---

## 📧 Email Reçu

L'utilisateur root recevra un email professionnel contenant :

### Contenu de l'Email

1. **En-tête** avec logo et branding Ruzizi Hôtel
2. **Identifiants de connexion** :
   - Email
   - Mot de passe temporaire (6 caractères)
3. **Consignes de sécurité** :
   - Changer le mot de passe immédiatement
   - Ne jamais partager les identifiants
   - Utiliser un mot de passe fort
   - Activer l'authentification à deux facteurs
   - Se déconnecter après chaque session
4. **Bouton de connexion** direct vers le système
5. **Liste des fonctionnalités** disponibles
6. **Informations de support** (email et téléphone)

### Aperçu de l'Email

```
🏨 Ruzizi Hôtel
Système de Gestion Hôtelière

Bonjour Administrateur 👋

Félicitations ! Votre compte Administrateur Root a été créé avec succès.

🔐 Vos Identifiants de Connexion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Adresse Email
admin@ruzizihotel.com

🔑 Mot de Passe Temporaire
AB12cd

⚠️ Consignes de Sécurité Importantes
• Changez immédiatement ce mot de passe
• Ne partagez jamais vos identifiants
• Utilisez un mot de passe fort
• Activez l'authentification à deux facteurs
• Déconnectez-vous toujours après chaque session

[🚀 Se Connecter au Système]

🎯 Fonctionnalités Disponibles
✓ Gestion Complète des Établissements
✓ Administration des Utilisateurs
✓ Suivi des Réservations
✓ Gestion Financière
✓ Analytics Avancés
✓ Rapports Détaillés
✓ Configuration Système
✓ Audit Trail

💬 Besoin d'Aide ?
Email Support: support@ruzizihotel.com
Téléphone: +257 69 65 75 54
```

---

## 📝 Fichier Log Créé

Un fichier log est automatiquement créé dans `logs/root-user-initialization.log` :

```
═══════════════════════════════════════════════════════════════
ROOT USER INITIALIZATION LOG
═══════════════════════════════════════════════════════════════
Date: 2025-11-13T10:30:00.000Z
User ID: 507f1f77bcf86cd799439011
Email: admin@ruzizihotel.com
Temporary Password: AB12cd
Status: SUCCESS
═══════════════════════════════════════════════════════════════

⚠️  IMPORTANT SECURITY NOTICE:
- This file contains sensitive information
- Delete this file after first login
- Change the password immediately after first login
- Keep this information secure

═══════════════════════════════════════════════════════════════
```

**⚠️ IMPORTANT** : Supprimez ce fichier après la première connexion !

---

## 🔒 Permissions de l'Utilisateur Root

L'utilisateur root dispose de **toutes les permissions** :

- ✅ `manage_users` - Gestion des utilisateurs
- ✅ `manage_establishments` - Gestion des établissements
- ✅ `manage_accommodations` - Gestion des hébergements
- ✅ `manage_bookings` - Gestion des réservations
- ✅ `manage_payments` - Gestion des paiements
- ✅ `view_reports` - Consultation des rapports
- ✅ `manage_system` - Configuration système
- ✅ `manage_settings` - Paramètres avancés

---

## 🚨 Première Connexion

### Étape 1 : Se Connecter

1. Allez sur `http://localhost:3000/backoffice/login`
2. Entrez l'email : `admin@ruzizihotel.com`
3. Entrez le mot de passe reçu par email (6 caractères)
4. Cliquez sur "Se connecter"

### Étape 2 : Changer le Mot de Passe

**OBLIGATOIRE** pour la sécurité :

1. Allez dans **Profil** → **Sécurité**
2. Cliquez sur "Changer le mot de passe"
3. Entrez l'ancien mot de passe (6 caractères)
4. Créez un nouveau mot de passe fort :
   - Minimum 8 caractères
   - Au moins 1 majuscule
   - Au moins 1 minuscule
   - Au moins 1 chiffre
   - Au moins 1 caractère spécial (@, #, $, etc.)
5. Confirmez le nouveau mot de passe
6. Cliquez sur "Enregistrer"

### Étape 3 : Activer l'Authentification à Deux Facteurs (Recommandé)

1. Allez dans **Profil** → **Sécurité**
2. Section "Authentification à deux facteurs"
3. Cliquez sur "Activer"
4. Scannez le QR code avec Google Authenticator ou Authy
5. Entrez le code de vérification
6. Sauvegardez les codes de récupération

---

## 🔄 Réinitialisation de l'Utilisateur Root

Si vous devez recréer l'utilisateur root :

### Option 1 : Supprimer et Recréer

```bash
# Se connecter à MongoDB
mongosh

# Utiliser la base de données
use ruzizi-hotel

# Supprimer l'utilisateur root
db.users.deleteOne({ role: "root" })

# Quitter MongoDB
exit

# Relancer le script
npm run init:root
```

### Option 2 : Réinitialiser le Mot de Passe

Créez un script `scripts/reset-root-password.ts` pour réinitialiser uniquement le mot de passe.

---

## ⚠️ Sécurité et Bonnes Pratiques

### ✅ À FAIRE

- ✅ Changer le mot de passe immédiatement après la première connexion
- ✅ Utiliser un mot de passe fort (8+ caractères, mixte)
- ✅ Activer l'authentification à deux facteurs
- ✅ Supprimer le fichier log après la première connexion
- ✅ Ne jamais partager les identifiants root
- ✅ Utiliser des connexions HTTPS en production
- ✅ Créer des utilisateurs avec des rôles limités pour les opérations quotidiennes
- ✅ Auditer régulièrement les accès root

### ❌ À NE PAS FAIRE

- ❌ Ne jamais utiliser le compte root pour les opérations quotidiennes
- ❌ Ne jamais partager le mot de passe root
- ❌ Ne jamais stocker le mot de passe en clair
- ❌ Ne jamais se connecter depuis un réseau public non sécurisé
- ❌ Ne jamais laisser le fichier log accessible
- ❌ Ne jamais désactiver l'authentification à deux facteurs

---

## 🐛 Dépannage

### Problème : "MONGODB_URI non défini"

**Solution** : Vérifiez que `.env` contient `MONGODB_URI`

```bash
# Vérifier le fichier .env
cat .env | grep MONGODB_URI
```

### Problème : "Utilisateur root déjà existant"

**Solution** : L'utilisateur existe déjà. Pour le recréer, supprimez-le d'abord :

```bash
mongosh
use ruzizi-hotel
db.users.deleteOne({ role: "root" })
exit
```

### Problème : "Erreur lors de l'envoi de l'email"

**Solutions** :

1. Vérifiez les variables SMTP dans `.env`
2. Vérifiez que le mot de passe d'application Gmail est correct
3. Vérifiez que la validation en deux étapes est activée
4. Essayez avec un autre fournisseur email

### Problème : "Connection refused to MongoDB"

**Solution** : Démarrez MongoDB :

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

---

## 📞 Support

Pour toute assistance :

- **Email** : support@ruzizihotel.com
- **Téléphone** : +257 69 65 75 54
- **Documentation** : Consultez les autres guides dans `/docs`

---

## 📚 Ressources Supplémentaires

- [Guide de Sécurité](./SECURITY_GUIDE.md)
- [Documentation API](./API_DOCUMENTATION.md)
- [Guide d'Administration](./ADMIN_GUIDE.md)
- [FAQ](./FAQ.md)

---

*Document créé le: Novembre 13, 2025*
*Dernière mise à jour: Novembre 13, 2025*
*Version: 2.0*
