# 🐛 Guide de Débogage - Connexion

## 🔍 Comment Déboguer le Problème de Connexion

### Étape 1 : Ouvrir la Console du Navigateur

1. Appuyez sur **F12** (ou Ctrl+Shift+I)
2. Allez dans l'onglet **Console**
3. Essayez de vous connecter
4. Observez les messages

---

## 📋 Messages de Débogage à Observer

### Connexion Réussie (Attendu)

```
🔐 Tentative de connexion... { email: "admin@ruzizihotel.com" }
📡 Réponse reçue: 200 OK
📦 Données reçues: { success: true, data: {...}, message: "Login successful" }
✅ Connexion réussie, stockage des tokens...
💾 Tokens stockés: { localStorage: true, cookies: true }
👤 Utilisateur stocké: admin@ruzizihotel.com Role: root
🚀 Redirection vers /admin/dashboard...
```

### Erreurs Possibles

#### Erreur 1 : Pas de Réponse
```
🔐 Tentative de connexion...
❌ Erreur de connexion: Failed to fetch
```

**Cause** : Le serveur Next.js n'est pas démarré ou l'API n'est pas accessible

**Solution** :
```bash
# Vérifier que le serveur est démarré
npm run dev

# Vérifier l'URL
# Devrait être: http://localhost:3000
```

#### Erreur 2 : Erreur 500
```
📡 Réponse reçue: 500 Internal Server Error
❌ Erreur de connexion: Server error
```

**Cause** : Erreur côté serveur (probablement MongoDB)

**Solution** :
```bash
# Vérifier MongoDB
mongosh
# Si erreur, démarrer MongoDB
net start MongoDB  # Windows
```

#### Erreur 3 : Erreur 401
```
📡 Réponse reçue: 401 Unauthorized
❌ Erreur de connexion: Invalid email or password
```

**Cause** : Email ou mot de passe incorrect

**Solution** :
- Vérifier l'email et le mot de passe
- Recréer l'utilisateur root : `npm run init:root`

#### Erreur 4 : Timeout
```
❌ Erreur de connexion: La requête a pris trop de temps
```

**Cause** : Le serveur ne répond pas

**Solution** :
- Vérifier que MongoDB est démarré
- Vérifier que Next.js est démarré
- Vérifier la connexion réseau

---

## 🔧 Vérifications Manuelles

### 1. Vérifier MongoDB

```bash
# Se connecter à MongoDB
mongosh

# Utiliser la base de données
use ruzizi-hotel

# Vérifier l'utilisateur root
db.users.findOne({ role: "root" })

# Devrait afficher quelque chose comme:
# {
#   _id: ObjectId("..."),
#   email: "admin@ruzizihotel.com",
#   role: "root",
#   isActive: true,
#   ...
# }
```

### 2. Vérifier l'API Directement

Ouvrez un nouvel onglet de console et testez l'API :

```javascript
// Test de l'API de login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@ruzizihotel.com',
    password: 'AB12cd' // Remplacez par votre mot de passe
  })
})
.then(res => res.json())
.then(data => console.log('Réponse API:', data))
.catch(err => console.error('Erreur API:', err));
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  },
  "message": "Login successful"
}
```

### 3. Vérifier les Variables d'Environnement

```bash
# Vérifier que .env existe
dir .env

# Vérifier le contenu (sans afficher les secrets)
type .env | findstr MONGODB_URI
type .env | findstr JWT_SECRET
```

**Variables requises** :
- `MONGODB_URI` : Connexion MongoDB
- `JWT_SECRET` : Secret pour les tokens
- `JWT_REFRESH_SECRET` : Secret pour les refresh tokens

---

## 🚀 Solutions Rapides

### Solution 1 : Redémarrer Tout

```bash
# 1. Arrêter Next.js (Ctrl+C)

# 2. Vérifier/Démarrer MongoDB
net start MongoDB

# 3. Redémarrer Next.js
npm run dev

# 4. Réessayer la connexion
```

### Solution 2 : Recréer l'Utilisateur Root

```bash
# Supprimer l'utilisateur existant
mongosh
use ruzizi-hotel
db.users.deleteOne({ role: "root" })
exit

# Recréer
npm run init:root

# Utiliser le nouveau mot de passe reçu par email
```

### Solution 3 : Vérifier les Logs du Serveur

Dans le terminal où `npm run dev` tourne, vous devriez voir :

```
🔐 API Login - Requête reçue
📦 Body reçu: { email: "admin@ruzizihotel.com", hasPassword: true }
✅ Validation réussie
✅ Authentification réussie: { userId: "...", email: "...", hasTokens: true }
```

Si vous ne voyez rien, l'API n'est pas appelée.

---

## 🧪 Test Complet Étape par Étape

### Test 1 : Serveur Next.js

```bash
npm run dev
```

**Attendu** : 
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

### Test 2 : MongoDB

```bash
mongosh
```

**Attendu** : Connexion réussie

### Test 3 : Utilisateur Root

```bash
mongosh
use ruzizi-hotel
db.users.findOne({ role: "root" })
```

**Attendu** : Un document utilisateur

### Test 4 : API Login (via curl ou Postman)

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@ruzizihotel.com\",\"password\":\"AB12cd\"}"
```

**Attendu** : JSON avec success: true

### Test 5 : Page de Login

1. Ouvrez `http://localhost:3000/backoffice/login`
2. Ouvrez la console (F12)
3. Entrez les identifiants
4. Cliquez sur "Se connecter"
5. Observez les logs dans la console

---

## 📊 Checklist de Diagnostic

Cochez ce qui fonctionne :

- [ ] Next.js démarre sans erreur
- [ ] MongoDB est accessible
- [ ] L'utilisateur root existe dans la DB
- [ ] L'API `/api/auth/login` répond (test curl)
- [ ] La page de login s'affiche
- [ ] Le formulaire se soumet (loading apparaît)
- [ ] La console affiche "🔐 Tentative de connexion..."
- [ ] La console affiche "📡 Réponse reçue: 200"
- [ ] La console affiche "✅ Connexion réussie"
- [ ] La console affiche "🚀 Redirection..."
- [ ] La redirection vers /admin/dashboard fonctionne

---

## 🆘 Si Rien ne Fonctionne

### Option 1 : Connexion Simplifiée

Créez un utilisateur de test directement dans MongoDB :

```javascript
// Dans mongosh
use ruzizi-hotel

db.users.insertOne({
  firstName: "Test",
  lastName: "User",
  email: "test@test.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHZvxe", // "password"
  role: "super_admin",
  isActive: true,
  isEmailVerified: true,
  permissions: ["manage_users", "manage_establishments"],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Puis connectez-vous avec :
- Email : `test@test.com`
- Mot de passe : `password`

### Option 2 : Vérifier les Logs Serveur

Dans le terminal où `npm run dev` tourne, cherchez :
- Erreurs de connexion MongoDB
- Erreurs de compilation
- Erreurs d'API

### Option 3 : Mode Debug Complet

Ajoutez dans `.env` :
```env
NODE_ENV=development
DEBUG=*
LOG_LEVEL=debug
```

Redémarrez le serveur et réessayez.

---

## 📞 Informations à Fournir pour le Support

Si le problème persiste, fournissez :

1. **Logs de la console navigateur** (F12 → Console)
2. **Logs du serveur** (terminal npm run dev)
3. **Version de Node.js** : `node --version`
4. **Version de MongoDB** : `mongosh --version`
5. **Contenu de .env** (sans les secrets) :
   ```
   MONGODB_URI=mongodb://...
   JWT_SECRET=***
   FRONTEND_URL=http://localhost:3000
   ```

---

*Document créé le: Novembre 13, 2025*
*Pour assistance: support@ruzizihotel.com*
