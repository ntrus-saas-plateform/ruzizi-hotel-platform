# 🔐 Correction du Système de Connexion

## 🐛 Problème Identifié

La connexion ne fonctionnait pas car les tokens JWT n'étaient pas correctement stockés et le middleware ne pouvait pas les vérifier.

---

## 🔍 Analyse du Problème

### Problème 1 : Tokens Non Stockés
**Avant** : La page de login recevait les tokens de l'API mais ne les stockait nulle part.

```typescript
// ❌ AVANT - Pas de stockage des tokens
const data = await response.json();
if (!response.ok) {
  throw new Error(data.error?.message || 'Erreur de connexion');
}
router.push('/admin/dashboard'); // Redirection sans stocker les tokens
```

### Problème 2 : Middleware Cherche dans les Cookies
Le middleware vérifie la présence d'un token dans les cookies :

```typescript
const token = request.cookies.get('auth-token')?.value;
if (!token) {
  // Redirection vers login
}
```

Mais les tokens n'étaient jamais mis dans les cookies !

---

## ✅ Solutions Implémentées

### 1. Stockage des Tokens (Double Stockage)

**Après** : Les tokens sont maintenant stockés dans localStorage ET dans les cookies

```typescript
// ✅ APRÈS - Stockage complet
if (data.data?.tokens) {
  // LocalStorage (pour les requêtes API côté client)
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  
  // Cookies (pour le middleware Next.js)
  document.cookie = `auth-token=${data.data.tokens.accessToken}; path=/; max-age=${15 * 60}`;
  document.cookie = `refresh-token=${data.data.tokens.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
}

// Stocker les informations utilisateur
if (data.data?.user) {
  localStorage.setItem('user', JSON.stringify(data.data.user));
}
```

### 2. Durées de Validité

**Access Token (Cookie)** :
- Durée : 15 minutes
- `max-age=${15 * 60}` = 900 secondes

**Refresh Token (Cookie)** :
- Durée : 7 jours
- `max-age=${7 * 24 * 60 * 60}` = 604800 secondes

---

## 📊 Flux de Connexion Complet

### Étape 1 : Soumission du Formulaire
```
Utilisateur entre email + password
    ↓
POST /api/auth/login
    ↓
AuthService.login(credentials)
    ↓
Vérification email/password
    ↓
Génération des tokens JWT
```

### Étape 2 : Réponse de l'API
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@ruzizihotel.com",
      "role": "root",
      "firstName": "Administrateur",
      "lastName": "Root"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  },
  "message": "Login successful"
}
```

### Étape 3 : Stockage des Tokens
```
✅ localStorage.accessToken = "eyJhbGciOiJIUzI1NiIs..."
✅ localStorage.refreshToken = "eyJhbGciOiJIUzI1NiIs..."
✅ localStorage.user = "{...}"
✅ Cookie: auth-token = "eyJhbGciOiJIUzI1NiIs..."
✅ Cookie: refresh-token = "eyJhbGciOiJIUzI1NiIs..."
```

### Étape 4 : Redirection
```
router.push('/admin/dashboard')
    ↓
Middleware vérifie cookie 'auth-token'
    ↓
✅ Token trouvé → Accès autorisé
    ↓
Page /admin/dashboard chargée
```

---

## 🔒 Sécurité

### Tokens JWT

**Access Token** :
- Courte durée (15 minutes)
- Utilisé pour les requêtes API
- Stocké dans localStorage + cookie

**Refresh Token** :
- Longue durée (7 jours)
- Utilisé pour renouveler l'access token
- Stocké dans localStorage + cookie

### Cookies

**Attributs de sécurité** :
- `path=/` : Disponible sur tout le site
- `max-age` : Expiration automatique
- ⚠️ À ajouter en production :
  - `secure` : HTTPS uniquement
  - `httpOnly` : Non accessible via JavaScript (à faire côté serveur)
  - `sameSite=strict` : Protection CSRF

---

## 🧪 Test de Connexion

### 1. Créer l'Utilisateur Root

```bash
npm run init:root
```

Vous recevrez un email avec :
- Email : `admin@ruzizihotel.com`
- Mot de passe : `AB12cd` (exemple, 6 caractères)

### 2. Se Connecter

1. Allez sur `http://localhost:3000/backoffice/login`
2. Entrez l'email et le mot de passe
3. Cliquez sur "Se connecter"

### 3. Vérifier le Stockage

Ouvrez la console du navigateur (F12) :

```javascript
// Vérifier localStorage
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Vérifier les cookies
console.log('Cookies:', document.cookie);
```

### 4. Vérifier l'Accès

Vous devriez être redirigé vers `/admin/dashboard` et voir le tableau de bord.

---

## 🔄 Gestion du Refresh Token

### Quand l'Access Token Expire

Après 15 minutes, l'access token expire. Le système devrait :

1. Détecter l'erreur 401 (Unauthorized)
2. Utiliser le refresh token pour obtenir un nouveau access token
3. Réessayer la requête avec le nouveau token

**À implémenter** : Intercepteur HTTP pour gérer automatiquement le refresh

```typescript
// Exemple d'intercepteur (à créer)
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  // Si 401, essayer de refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      // Stocker les nouveaux tokens
      localStorage.setItem('accessToken', data.tokens.accessToken);
      document.cookie = `auth-token=${data.tokens.accessToken}; path=/; max-age=${15 * 60}`;
      
      // Réessayer la requête originale
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.tokens.accessToken}`,
        },
      });
    }
  }
  
  return response;
}
```

---

## 🚪 Déconnexion

### Fonction de Logout

Pour déconnecter l'utilisateur, il faut :

1. Supprimer les tokens du localStorage
2. Supprimer les cookies
3. Rediriger vers la page de login

```typescript
function logout() {
  // Supprimer localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Supprimer cookies
  document.cookie = 'auth-token=; path=/; max-age=0';
  document.cookie = 'refresh-token=; path=/; max-age=0';
  
  // Rediriger
  window.location.href = '/backoffice/login';
}
```

---

## 📝 Améliorations Futures

### 1. HttpOnly Cookies (Recommandé)

**Problème actuel** : Les cookies sont accessibles via JavaScript (`document.cookie`)

**Solution** : Définir les cookies côté serveur avec `httpOnly`

```typescript
// Dans l'API /api/auth/login
export async function POST(request: NextRequest) {
  // ... login logic ...
  
  const response = NextResponse.json({ success: true, data: result });
  
  // Définir les cookies côté serveur
  response.cookies.set('auth-token', result.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });
  
  response.cookies.set('refresh-token', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    path: '/',
  });
  
  return response;
}
```

### 2. Intercepteur HTTP Global

Créer un wrapper pour `fetch` qui gère automatiquement :
- Ajout du token Authorization
- Refresh automatique si 401
- Retry de la requête

### 3. Context API React

Créer un `AuthContext` pour gérer l'état d'authentification globalement :

```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ... login, logout, refresh logic ...
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4. Protection des Routes Côté Client

Créer un composant `ProtectedRoute` :

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/backoffice/login');
    }
  }, [user, loading, router]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  
  return <>{children}</>;
}
```

---

## ✅ Checklist de Vérification

- [x] Tokens générés par l'API
- [x] Tokens stockés dans localStorage
- [x] Tokens stockés dans les cookies
- [x] Middleware vérifie les cookies
- [x] Redirection après login
- [x] Informations utilisateur stockées
- [ ] Refresh token automatique (à implémenter)
- [ ] Déconnexion propre (à implémenter)
- [ ] HttpOnly cookies (recommandé)
- [ ] Context API (recommandé)

---

## 🐛 Dépannage

### Problème : "Erreur de connexion"

**Vérifications** :
1. MongoDB est-il démarré ?
2. L'utilisateur root existe-t-il ?
3. Le mot de passe est-il correct ?

```bash
# Vérifier MongoDB
mongosh
use ruzizi-hotel
db.users.findOne({ role: "root" })
```

### Problème : "Redirection vers login après connexion"

**Cause** : Le cookie n'est pas défini correctement

**Solution** : Vérifier dans la console :
```javascript
console.log(document.cookie);
// Devrait contenir: auth-token=...
```

### Problème : "Token invalide"

**Cause** : Le token a expiré ou est mal formé

**Solution** : Se reconnecter pour obtenir un nouveau token

---

## 📞 Support

Pour toute question :
- **Email** : support@ruzizihotel.com
- **Téléphone** : +257 69 65 75 54

---

*Document créé le: Novembre 13, 2025*
*Version: 1.0*
