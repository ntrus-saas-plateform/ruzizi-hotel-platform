# Scripts Ruzizi Hôtel

Ce dossier contient les scripts utilitaires pour la gestion de la plateforme Ruzizi Hôtel.

## 📋 Scripts Disponibles

### 1. Création de l'Utilisateur Root

Deux versions du script sont disponibles pour créer l'utilisateur administrateur principal.

#### Version Simple (JavaScript)

```bash
npm run create-root-user
```

**Caractéristiques:**
- ✅ Script JavaScript simple
- ✅ Pas de dépendances TypeScript
- ✅ Génération de mot de passe sécurisé (6 caractères)
- ✅ Affichage des identifiants dans la console
- ✅ Vérification si l'utilisateur existe déjà

**Utilisation:**
```bash
# Démarrer MongoDB
# Puis exécuter:
npm run create-root-user
```

#### Version Avancée (TypeScript)

```bash
npm run init:root
```

**Caractéristiques:**
- ✅ Script TypeScript avec types
- ✅ Génération de mot de passe sécurisé
- ✅ Envoi d'email automatique (optionnel)
- ✅ Logging détaillé
- ✅ Gestion d'erreurs avancée
- ✅ Messages d'aide contextuels

**Configuration email (optionnel):**

Créez un fichier `.env.local` avec:

```env
MONGODB_URI=mongodb://localhost:27017/ruzizi-hotel
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

**Utilisation:**
```bash
# Démarrer MongoDB
# Puis exécuter:
npm run init:root
```

### 2. Vérification MongoDB

```bash
npm run check:mongodb
```

Vérifie la connexion à MongoDB et affiche les informations de la base de données.

## 🔐 Utilisateur Root Créé

### Informations par défaut

- **Email:** `admin@ruzizihotel.com`
- **Mot de passe:** Généré automatiquement (6 caractères)
- **Rôle:** Super Administrateur
- **Permissions:** Toutes les permissions système

### Permissions incluses

- ✅ `manage_users` - Gestion des utilisateurs
- ✅ `manage_establishments` - Gestion des établissements
- ✅ `manage_accommodations` - Gestion des hébergements
- ✅ `manage_bookings` - Gestion des réservations
- ✅ `manage_finances` - Gestion financière
- ✅ `view_analytics` - Accès aux analyses
- ✅ `system_admin` - Administration système

## 🚀 Démarrage Rapide

### Première Installation

1. **Démarrer MongoDB:**
   ```bash
   # Avec Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Ou avec MongoDB local
   mongod
   ```

2. **Créer l'utilisateur root:**
   ```bash
   npm run create-root-user
   ```

3. **Noter les identifiants affichés:**
   ```
   📧 Email:        admin@ruzizihotel.com
   🔑 Mot de passe: Abc3d5
   ```

4. **Se connecter:**
   - Ouvrir http://localhost:3000/backoffice/login
   - Utiliser les identifiants affichés
   - Changer le mot de passe après la première connexion

## 🔧 Dépannage

### Erreur: "MongoDB connection failed"

**Cause:** MongoDB n'est pas démarré ou inaccessible

**Solution:**
```bash
# Vérifier si MongoDB tourne
mongosh --eval "db.version()"

# Ou avec Docker
docker ps | grep mongo

# Démarrer MongoDB si nécessaire
docker start mongodb
# ou
mongod
```

### Erreur: "User already exists"

**Cause:** L'utilisateur `admin@ruzizihotel.com` existe déjà

**Solutions:**

1. **Utiliser "Mot de passe oublié":**
   - Aller sur http://localhost:3000/backoffice/login
   - Cliquer sur "Mot de passe oublié"
   - Suivre les instructions

2. **Supprimer l'utilisateur existant:**
   ```bash
   mongosh ruzizi-hotel
   db.users.deleteOne({ email: "admin@ruzizihotel.com" })
   exit
   npm run create-root-user
   ```

3. **Modifier l'email dans le script:**
   - Éditer `scripts/create-root-user.js`
   - Changer `ROOT_EMAIL`

### Erreur: "ts-node command not found"

**Cause:** TypeScript ou ts-node non installé

**Solution:**
```bash
# Installer les dépendances
npm install

# Ou utiliser la version JavaScript
npm run create-root-user
```

### Erreur: "Email sending failed"

**Cause:** Configuration SMTP incorrecte ou manquante

**Solution:**
1. Vérifier les variables d'environnement SMTP
2. Utiliser un mot de passe d'application Gmail
3. Le script JavaScript n'envoie pas d'email (normal)

## 📝 Personnalisation

### Modifier les informations par défaut

Éditez le fichier `scripts/create-root-user.js`:

```javascript
const ROOT_EMAIL = 'votre-email@example.com';
const ROOT_FIRST_NAME = 'Prénom';
const ROOT_LAST_NAME = 'Nom';
```

### Modifier la longueur du mot de passe

Dans la fonction `generatePassword()`:

```javascript
function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) { // Changer 6 en 8 pour 8 caractères
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Changez le mot de passe immédiatement** après la première connexion
2. **Ne partagez jamais** les identifiants root
3. **Créez des comptes séparés** pour chaque administrateur
4. **Utilisez des mots de passe forts** (minimum 12 caractères)
5. **Activez l'authentification à deux facteurs** si disponible
6. **Limitez l'accès** au compte root aux opérations critiques
7. **Auditez régulièrement** les actions du compte root

### Rotation des Mots de Passe

Il est recommandé de changer le mot de passe root:
- Tous les 90 jours
- Après chaque départ d'un administrateur
- En cas de suspicion de compromission

## 📊 Logs et Monitoring

Les scripts affichent des logs détaillés:

- 🔄 Opérations en cours
- ✅ Succès
- ⚠️ Avertissements
- ❌ Erreurs
- 💡 Conseils

## 🆘 Support

En cas de problème:

1. Vérifier les logs d'erreur
2. Consulter la section Dépannage
3. Vérifier la connexion MongoDB
4. Vérifier les variables d'environnement
5. Contacter l'équipe de développement

## 📚 Ressources

- [Documentation MongoDB](https://docs.mongodb.com/)
- [Documentation Node.js](https://nodejs.org/docs/)
- [Documentation bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Documentation Nodemailer](https://nodemailer.com/)

## 🔄 Mises à Jour

### Version 1.0.0 (Actuelle)
- ✅ Script JavaScript simple
- ✅ Script TypeScript avancé
- ✅ Génération de mot de passe sécurisé
- ✅ Envoi d'email (optionnel)
- ✅ Documentation complète

### Prochaines Versions
- [ ] Interface web pour création d'utilisateurs
- [ ] Authentification à deux facteurs
- [ ] Rotation automatique des mots de passe
- [ ] Audit trail des créations
