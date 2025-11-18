# Guide de démarrage rapide - Nouveau système d'authentification

## Résumé des problèmes résolus

✅ **Token qui expire sans rafraîchissement** → Rafraîchissement automatique transparent
✅ **Création d'établissement qui échoue** → Gestion automatique des erreurs 401
✅ **Expérience utilisateur non professionnelle** → Système robuste et fluide

## Installation rapide

### 1. Aucune dépendance supplémentaire requise
Tous les fichiers utilisent les dépendances existantes du projet.

### 2. Intégrer le AuthProvider

Modifiez votre `app/layout.tsx` :

```tsx
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Remplacer vos appels fetch par apiClient

**Avant** :
```tsx
const response = await fetch('/api/establishments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

**Après** :
```tsx
import { apiClient } from '@/lib/api/client';

const response = await apiClient.post('/api/establishments', data);
```

C'est tout ! Le rafraîchissement automatique fonctionne maintenant.

## Test rapide

### 1. Tester le login

```tsx
import { useAuthContext } from '@/components/AuthProvider';

function LoginButton() {
  const { login } = useAuthContext();
  
  const handleLogin = async () => {
    try {
      await login('admin@ruzizihotel.com', 'votre-mot-de-passe');
      console.log('✅ Connecté avec succès');
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };
  
  return <button onClick={handleLogin}>Se connecter</button>;
}
```

### 2. Tester la création d'établissement

```tsx
import { establishmentsApi } from '@/lib/api/establishments';

async function createEstablishment() {
  try {
    const establishment = await establishmentsApi.create({
      name: 'Test Hotel',
      address: {
        street: '123 Test Street',
        city: 'Bujumbura',
        province: 'Bujumbura Mairie',
        country: 'Burundi',
      },
      contact: {
        phone: '+257 69 65 75 54',
        email: 'test@hotel.com',
      },
      pricingMode: 'per_night',
    });
    
    console.log('✅ Établissement créé:', establishment);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}
```

### 3. Tester le rafraîchissement automatique

Pour tester que le token se rafraîchit automatiquement :

1. Modifiez temporairement la durée du token dans `lib/auth/jwt.ts` :
   ```typescript
   const ACCESS_TOKEN_EXPIRY = '30s'; // 30 secondes au lieu de 15 minutes
   ```

2. Connectez-vous à l'application

3. Attendez 30 secondes

4. Faites une action (créer un établissement, charger une liste, etc.)

5. Vérifiez dans la console du navigateur :
   ```
   🔄 Token expiré, rafraîchissement en cours...
   ✅ Token rafraîchi avec succès
   ✅ Requête réessayée avec succès
   ```

6. L'action devrait réussir sans que l'utilisateur soit déconnecté

## Vérification du bon fonctionnement

### Dans la console du navigateur

Après login, vérifiez que les tokens sont stockés :
```javascript
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
```

### Vérifier l'état d'authentification

```tsx
import { useAuthContext } from '@/components/AuthProvider';

function DebugAuth() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  return (
    <div>
      <p>Chargement: {isLoading ? 'Oui' : 'Non'}</p>
      <p>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</p>
      <p>Utilisateur: {user ? user.email : 'Aucun'}</p>
    </div>
  );
}
```

## Dépannage rapide

### Problème : "No refresh token available"
**Solution** : L'utilisateur n'est pas connecté ou les tokens ont été supprimés
```tsx
// Reconnecter l'utilisateur
await login(email, password);
```

### Problème : Redirection infinie vers /login
**Solution** : Le token est invalide ou expiré
```tsx
// Nettoyer les tokens et reconnecter
import { apiClient } from '@/lib/api/client';
apiClient.clearTokens();
// Puis reconnecter
```

### Problème : "Failed to refresh token"
**Solution** : Le refresh token a expiré (après 7 jours)
- L'utilisateur doit se reconnecter
- C'est le comportement normal pour la sécurité

### Problème : Les requêtes échouent toujours avec 401
**Solution** : Vérifiez que vous utilisez `apiClient` et non `fetch` directement
```tsx
// ❌ Mauvais
fetch('/api/establishments', { ... });

// ✅ Bon
apiClient.get('/api/establishments');
```

## Fichiers créés

```
ruzizi-hotel-platform/
├── lib/
│   └── api/
│       ├── client.ts                    # Client API avec auto-refresh
│       └── establishments.ts            # API helper pour établissements
├── hooks/
│   └── useAuth.ts                       # Hook d'authentification
├── components/
│   ├── AuthProvider.tsx                 # Provider React
│   └── establishments/
│       └── CreateEstablishmentForm.tsx  # Exemple de formulaire
└── docs/
    ├── AUTHENTICATION_FIX.md            # Documentation complète
    ├── INTEGRATION_EXAMPLE.md           # Exemples d'intégration
    └── QUICK_START.md                   # Ce fichier
```

## Fichiers modifiés

```
ruzizi-hotel-platform/
└── app/
    └── api/
        └── auth/
            └── refresh/
                └── route.ts             # Support body + cookies
```

## Prochaines étapes

1. ✅ Intégrer le `AuthProvider` dans votre layout
2. ✅ Remplacer les appels `fetch` par `apiClient`
3. ✅ Tester le login et la création d'établissement
4. ✅ Vérifier le rafraîchissement automatique
5. ✅ Déployer en production

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console navigateur
2. Vérifiez les logs du serveur Next.js
3. Consultez `docs/AUTHENTICATION_FIX.md` pour plus de détails
4. Consultez `docs/INTEGRATION_EXAMPLE.md` pour des exemples complets

## Configuration production

Avant de déployer en production, assurez-vous que :

1. ✅ `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis dans `.env`
2. ✅ Les secrets sont différents et sécurisés (minimum 32 caractères)
3. ✅ `NODE_ENV=production` est défini
4. ✅ `NEXT_PUBLIC_APP_URL` pointe vers votre domaine de production

```bash
# .env.production
JWT_SECRET="votre-secret-super-securise-de-32-caracteres-minimum"
JWT_REFRESH_SECRET="votre-autre-secret-different-et-securise"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"
```
