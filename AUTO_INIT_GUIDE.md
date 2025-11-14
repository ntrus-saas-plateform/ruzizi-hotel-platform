# Guide d'Initialisation Automatique

## ✅ Fonctionnalités Implémentées

### 1. Création Automatique de l'Utilisateur Admin

L'application crée automatiquement un utilisateur administrateur au premier démarrage si aucun utilisateur n'existe dans la base de données.

#### Comment ça fonctionne ?

**Fichiers impliqués :**
- `components/AutoInit.tsx` - Composant qui déclenche l'initialisation
- `app/api/init/route.ts` - Route API d'initialisation
- `lib/init/autoInit.ts` - Logique de création de l'utilisateur
- `app/layout.tsx` - Layout racine qui inclut AutoInit

**Processus :**
1. Au chargement de l'application, le composant `AutoInit` s'exécute
2. Il appelle la route `/api/init`
3. La route vérifie si des utilisateurs existent dans la base
4. Si aucun utilisateur n'existe, il crée automatiquement l'admin root
5. Les identifiants sont affichés dans la console du serveur
6. Un email est envoyé si la configuration SMTP est présente

### 2. Affichage des Identifiants

Lors de la création, les identifiants sont affichés dans la console :

```
🔄 Aucun utilisateur trouvé - Création de l'utilisateur root...
✅ Utilisateur root créé!

═══════════════════════════════════════════════════════
📋 IDENTIFIANTS DE CONNEXION
═══════════════════════════════════════════════════════
   📧 Email:        admin@ruzizihotel.com
   🔑 Mot de passe: Abc3d5Xy
═══════════════════════════════════════════════════════

🌐 Connexion: http://localhost:3000/backoffice/login
🔐 Changez ce mot de passe après la première connexion!
```

### 3. Envoi d'Email Automatique

Si les variables d'environnement SMTP sont configurées, un email est automatiquement envoyé avec les identifiants.

#### Configuration Email

Ajoutez ces variables dans `.env.local` :

```env
# Configuration SMTP (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
FRONTEND_URL=http://localhost:3000
```

**Pour Gmail :**
1. Activez l'authentification à 2 facteurs
2. Générez un "Mot de passe d'application"
3. Utilisez ce mot de passe dans `SMTP_PASS`

## 🚀 Utilisation

### Démarrage Normal

```bash
# Démarrer MongoDB
docker-compose up -d mongodb
# ou
mongod

# Démarrer l'application
npm run dev
```

L'utilisateur admin sera créé automatiquement au premier démarrage.

### Création Manuelle

Si vous préférez créer l'utilisateur manuellement :

```bash
# Version simple (JavaScript)
npm run create-root-user

# Version avancée (TypeScript avec email)
npm run init:root
```

## 📋 Informations par Défaut

### Utilisateur Root Créé

- **Email :** `admin@ruzizihotel.com`
- **Mot de passe :** Généré aléatoirement (8 caractères)
- **Rôle :** `super_admin`
- **Permissions :** Toutes les permissions système

### Personnalisation

Pour changer l'email par défaut, ajoutez dans `.env.local` :

```env
ROOT_EMAIL=votre-email@example.com
```

## 🔐 Sécurité

### Bonnes Pratiques

1. ✅ **Changez le mot de passe** immédiatement après la première connexion
2. ✅ **Notez les identifiants** affichés dans la console
3. ✅ **Configurez SMTP** pour recevoir les identifiants par email
4. ✅ **Ne partagez jamais** les identifiants root
5. ✅ **Créez des comptes séparés** pour chaque administrateur

### Rotation des Mots de Passe

Changez le mot de passe root régulièrement :
- Tous les 90 jours minimum
- Après chaque départ d'administrateur
- En cas de suspicion de compromission

## 🔧 Dépannage

### L'utilisateur n'est pas créé

**Vérifications :**

1. **MongoDB est-il démarré ?**
   ```bash
   mongosh --eval "db.version()"
   ```

2. **La connexion MongoDB est-elle correcte ?**
   - Vérifiez `MONGODB_URI` dans `.env.local`
   - Par défaut : `mongodb://localhost:27017/ruzizi-hotel`

3. **Regardez les logs de la console**
   - Les erreurs sont affichées au démarrage
   - Cherchez les messages commençant par ❌

### L'email n'est pas envoyé

**C'est normal si :**
- Les variables SMTP ne sont pas configurées
- Le message `⚠️ Configuration SMTP manquante` apparaît

**Pour activer l'envoi d'email :**
1. Configurez les variables SMTP dans `.env.local`
2. Redémarrez l'application
3. Supprimez l'utilisateur existant et relancez

### Réinitialiser l'utilisateur root

Si vous avez perdu le mot de passe :

**Option 1 : Utiliser "Mot de passe oublié"**
- Sur la page de login
- Cliquez sur "Mot de passe oublié"
- Suivez les instructions

**Option 2 : Supprimer et recréer**
```bash
# Se connecter à MongoDB
mongosh ruzizi-hotel

# Supprimer l'utilisateur
db.users.deleteOne({ email: "admin@ruzizihotel.com" })

# Quitter
exit

# Redémarrer l'application
npm run dev
```

**Option 3 : Script manuel**
```bash
npm run create-root-user
```

## 📊 Logs et Monitoring

### Messages de Log

- 🔄 **Opération en cours**
- ✅ **Succès**
- ⚠️ **Avertissement**
- ❌ **Erreur**
- 💡 **Conseil**
- 📧 **Email**
- 🔐 **Sécurité**

### Vérifier l'initialisation

Les logs apparaissent au démarrage de l'application :

```bash
npm run dev

# Vous devriez voir :
# 🔄 Aucun utilisateur trouvé - Création de l'utilisateur root...
# ✅ Utilisateur root créé!
# ...
```

## 🔄 Workflow Complet

### Premier Démarrage

1. **Démarrer MongoDB**
   ```bash
   docker-compose up -d mongodb
   ```

2. **Démarrer l'application**
   ```bash
   npm run dev
   ```

3. **Noter les identifiants** affichés dans la console

4. **Se connecter**
   - Ouvrir http://localhost:3000/backoffice/login
   - Utiliser les identifiants affichés

5. **Changer le mot de passe**
   - Aller dans Profil > Sécurité
   - Changer le mot de passe

### Démarrages Suivants

L'utilisateur existe déjà, aucune action n'est nécessaire.
L'initialisation ne se fait qu'une seule fois.

## 📝 Variables d'Environnement

### Obligatoires

```env
MONGODB_URI=mongodb://localhost:27017/ruzizi-hotel
```

### Optionnelles

```env
# Email personnalisé pour l'admin
ROOT_EMAIL=admin@ruzizihotel.com

# Configuration SMTP pour envoi d'email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# URL du frontend
FRONTEND_URL=http://localhost:3000
```

## 🆘 Support

En cas de problème :

1. Vérifiez les logs de la console
2. Consultez cette documentation
3. Vérifiez la connexion MongoDB
4. Vérifiez les variables d'environnement
5. Utilisez les scripts manuels si nécessaire

## ✨ Avantages

- ✅ **Automatique** : Pas besoin de script manuel
- ✅ **Sécurisé** : Mot de passe généré aléatoirement
- ✅ **Pratique** : Identifiants affichés et envoyés par email
- ✅ **Fiable** : Ne crée qu'une seule fois
- ✅ **Flexible** : Configuration personnalisable

## 📚 Ressources

- [Documentation MongoDB](https://docs.mongodb.com/)
- [Documentation Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Documentation Nodemailer](https://nodemailer.com/)
- [Scripts manuels](./scripts/README.md)
