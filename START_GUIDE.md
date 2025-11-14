# 🚀 Guide de Démarrage - Ruzizi Hôtel

## ✅ Le Build a Réussi !

Le projet a été compilé avec succès. Vous pouvez maintenant le démarrer.

## 🎯 Modes de Démarrage

### 1. Mode Développement (Recommandé pour développement)

```bash
npm run dev
```

**Caractéristiques:**
- ✅ Hot reload (rechargement automatique)
- ✅ Messages d'erreur détaillés
- ✅ Debugging facile
- ✅ Pas besoin de rebuild à chaque modification
- 🌐 URL: http://localhost:3000

**Utiliser pour:**
- Développement actif
- Tests de nouvelles fonctionnalités
- Debugging

### 2. Mode Production (Pour déploiement)

```bash
# 1. Build le projet (déjà fait ✅)
npm run build

# 2. Démarrer en mode production
npm run start
```

**Caractéristiques:**
- ✅ Optimisé pour performance
- ✅ Code minifié
- ✅ Pas de hot reload
- ✅ Prêt pour production
- 🌐 URL: http://localhost:3000

**Utiliser pour:**
- Tests de performance
- Validation avant déploiement
- Production

## 🔧 Démarrage Complet

### Première Fois

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer MongoDB
docker start mongodb
# ou
mongod

# 3. Créer l'utilisateur root
npm run create-root-user

# 4. Démarrer en mode développement
npm run dev
```

### Démarrage Rapide (après première fois)

```bash
# 1. Démarrer MongoDB (si pas déjà démarré)
docker start mongodb

# 2. Démarrer l'application
npm run dev
```

## 🌐 URLs Importantes

### Front-Office (Public)
- **Accueil:** http://localhost:3000
- **Établissements:** http://localhost:3000/establishments
- **Réservation:** http://localhost:3000/booking
- **Suivi réservation:** http://localhost:3000/track-booking

### Back-Office (Admin)
- **Connexion:** http://localhost:3000/backoffice/login
- **Dashboard:** http://localhost:3000/admin/dashboard
- **Établissements:** http://localhost:3000/admin/establishments
- **Hébergements:** http://localhost:3000/admin/accommodations
- **Réservations:** http://localhost:3000/admin/bookings

## 🔐 Identifiants par Défaut

Après avoir exécuté `npm run create-root-user`:

```
📧 Email:        admin@ruzizihotel.com
🔑 Mot de passe: [6 caractères affichés dans la console]
```

**⚠️ Important:** Changez ce mot de passe après la première connexion !

## 🐛 Dépannage

### Erreur: "Port 3000 already in use"

**Solution 1:** Arrêter le processus existant
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Solution 2:** Utiliser un autre port
```bash
PORT=3001 npm run dev
```

### Erreur: "MongoDB connection failed"

**Vérifier MongoDB:**
```bash
# Vérifier si MongoDB tourne
mongosh --eval "db.version()"

# Démarrer MongoDB
docker start mongodb
# ou
mongod
```

### Erreur: "Module not found"

**Réinstaller les dépendances:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Build failed"

**Nettoyer et rebuilder:**
```bash
# Supprimer le cache
rm -rf .next

# Rebuilder
npm run build
```

## 📊 Commandes Utiles

### Développement
```bash
npm run dev              # Démarrer en mode dev
npm run dev:setup        # Setup complet + démarrage
```

### Build & Production
```bash
npm run build            # Compiler le projet
npm run start            # Démarrer en production
```

### Scripts Utilitaires
```bash
npm run create-root-user # Créer utilisateur admin
npm run init:root        # Version avancée avec email
npm run check:mongodb    # Vérifier MongoDB
```

### Qualité du Code
```bash
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
npm run type-check       # Vérifier TypeScript
npm run format           # Formater le code
npm test                 # Lancer les tests
```

### Docker
```bash
npm run docker:build     # Build image Docker
npm run docker:run       # Démarrer avec Docker
npm run docker:dev       # Mode dev avec Docker
npm run docker:stop      # Arrêter Docker
npm run docker:logs      # Voir les logs
```

## 🔄 Workflow Recommandé

### Pour Développement

1. **Démarrer MongoDB**
   ```bash
   docker start mongodb
   ```

2. **Démarrer en mode dev**
   ```bash
   npm run dev
   ```

3. **Ouvrir le navigateur**
   - Front: http://localhost:3000
   - Admin: http://localhost:3000/backoffice/login

4. **Développer**
   - Modifier les fichiers
   - Le navigateur se recharge automatiquement

5. **Tester**
   - Vérifier les fonctionnalités
   - Consulter la console pour les erreurs

### Pour Production

1. **Tester en local**
   ```bash
   npm run build
   npm run start
   ```

2. **Vérifier**
   - Tester toutes les fonctionnalités
   - Vérifier les performances
   - Valider la sécurité

3. **Déployer**
   - Suivre le guide de déploiement
   - Configurer les variables d'environnement
   - Migrer la base de données

## 📝 Variables d'Environnement

Créer un fichier `.env.local`:

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/ruzizi-hotel

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🎯 Prochaines Étapes

1. ✅ Build réussi
2. ✅ Démarrer l'application (`npm run dev`)
3. ✅ Créer l'utilisateur root
4. ✅ Se connecter au backoffice
5. ✅ Créer un établissement avec photos
6. ✅ Créer un hébergement avec photos
7. ✅ Tester les réservations
8. ✅ Explorer toutes les fonctionnalités

## 📚 Documentation

- `README.md` - Documentation principale
- `QUICK_START.md` - Guide rapide
- `IMPLEMENTATION_STATUS.md` - État détaillé
- `VERIFICATION_CHECKLIST.md` - Tests
- `LOGO_INTEGRATION.md` - Guide logo
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Résumé final

## 🆘 Support

En cas de problème:
1. Consulter la documentation
2. Vérifier les logs d'erreur
3. Tester avec `npm run check:mongodb`
4. Contacter l'équipe de développement

---

**Status:** ✅ Prêt à démarrer  
**Build:** ✅ Réussi  
**Mode recommandé:** Development (`npm run dev`)

**Bon développement ! 🚀**
