# Correction du système d'authentification

## Problèmes résolus

### 1. Expiration du token sans rafraîchissement automatique
**Problème** : Les tokens expiraient après 15 minutes et l'utilisateur était déconnecté sans avertissement.

**Solution** : Implémentation d'un système de rafraîchissement automatique des tokens avec :
- Détection automatique des erreurs 401
- Rafraîchissement transparent du token
- Retry automatique de la requête échouée

### 2. Gestion des tokens non professionnelle
**Problème** : Les tokens n'étaient pas persistés correctement et se perdaient au rechargement de la page.

**Solution** : 
- Stockage sécurisé dans localStorage
- Gestion centralisée via un client API singleton
- Support des cookies pour compatibilité

## Nouveaux fichiers créés

### 1. `/lib/api/client.ts`
Client API centralisé avec gestion automatique du refresh token.

**Fonctionnalités** :
- Intercepte les erreurs 401
- Rafraîchit automatiquement le token
- Retry automatique des requêtes
- Gestion de la file d'attente pendant le refresh
- Méthodes raccourcies (get, post, put, patch, delete)

### 2. `/hooks/useAuth.ts`
Hook React pour la gestion de l'authentification.

**Fonctionnalités** :
- État d'authentification global
- Méthodes login/logout
- Chargement automatique de l'utilisateur
- Rafraîchissement manuel

### 3. `/components/AuthProvider.tsx`
Provider React pour partager l'état d'authentification.

### 4. `/lib/api/establishments.ts`
API client pour la gestion des établissements avec gestion automatique des tokens.

### 5. `/components/establishments/CreateEstablishmentForm.tsx`
Exemple de formulaire utilisant le nouveau système.

## Modifications apportées

### `/app/api/auth/refresh/route.ts`
- Support du refresh token dans le body ET les cookies
- Génération de nouveaux access ET refresh tokens
- Réponses standardisées avec codes d'erreur
- Validation de l'utilisateur avant refresh

## Comment utiliser

### 1. Intégrer le AuthProvider dans votre application

```tsx
// app/layout.tsx
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

### 2. Utiliser le hook useAuth dans vos composants

```tsx
'use client';

import { useAuthContext } from '@/components/AuthProvider';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthContext();

  if (!isAuthenticated) {
    return <div>Non connecté</div>;
  }

  return (
    <div>
      <p>Bonjour {user?.firstName}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### 3. Faire des requêtes API avec gestion automatique des tokens

```tsx
import { apiClient } from '@/lib/api/client';

// GET
const data = await apiClient.get('/api/establishments');

// POST
const result = await apiClient.post('/api/establishments', {
  name: 'Mon Hôtel',
  // ...
});

// PUT
await apiClient.put('/api/establishments/123', { name: 'Nouveau nom' });

// DELETE
await apiClient.delete('/api/establishments/123');
```

### 4. Utiliser les API helpers spécifiques

```tsx
import { establishmentsApi } from '@/lib/api/establishments';

// Créer un établissement
const establishment = await establishmentsApi.create({
  name: 'Mon Hôtel',
  address: {
    street: '123 Rue Example',
    city: 'Bujumbura',
    province: 'Bujumbura Mairie',
    country: 'Burundi',
  },
  contact: {
    phone: '+257 69 65 75 54',
    email: 'contact@hotel.com',
  },
  pricingMode: 'per_night',
});

// Obtenir tous les établissements
const { establishments, total } = await establishmentsApi.getAll({
  city: 'Bujumbura',
  page: 1,
  limit: 10,
});
```

## Flux d'authentification

1. **Login** : L'utilisateur se connecte
   - Réception de l'access token (15 min) et refresh token (7 jours)
   - Stockage dans localStorage
   - Mise à jour de l'état d'authentification

2. **Requêtes API** : Chaque requête inclut l'access token
   - Si le token est valide → Requête réussie
   - Si le token est expiré (401) → Rafraîchissement automatique

3. **Rafraîchissement automatique** :
   - Détection de l'erreur 401
   - Appel à `/api/auth/refresh` avec le refresh token
   - Réception de nouveaux tokens
   - Retry de la requête originale
   - Transparent pour l'utilisateur

4. **Expiration du refresh token** :
   - Si le refresh token est expiré → Déconnexion automatique
   - Redirection vers la page de login

## Avantages

✅ **Expérience utilisateur fluide** : Plus de déconnexions inattendues
✅ **Sécurité renforcée** : Tokens courte durée avec rafraîchissement
✅ **Code maintenable** : Logique centralisée dans le client API
✅ **Gestion d'erreurs robuste** : Retry automatique et gestion de la file d'attente
✅ **Type-safe** : Support TypeScript complet
✅ **Réutilisable** : Facile à étendre pour d'autres ressources

## Configuration

Les durées de validité des tokens sont configurables dans `/lib/auth/jwt.ts` :

```typescript
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 jours
```

## Tests

Pour tester le rafraîchissement automatique :

1. Connectez-vous à l'application
2. Attendez 15 minutes (ou modifiez `ACCESS_TOKEN_EXPIRY` à '1m' pour tester)
3. Faites une action (créer un établissement, etc.)
4. Le token devrait se rafraîchir automatiquement sans déconnexion

## Dépannage

### Le token ne se rafraîchit pas
- Vérifiez que le refresh token est bien stocké dans localStorage
- Vérifiez les logs de la console pour les erreurs
- Vérifiez que l'API `/api/auth/refresh` fonctionne

### Déconnexion inattendue
- Le refresh token a peut-être expiré (7 jours)
- Vérifiez les variables d'environnement JWT_SECRET et JWT_REFRESH_SECRET

### Erreurs CORS
- Assurez-vous que `NEXT_PUBLIC_APP_URL` est correctement configuré
- Vérifiez les headers CORS dans le middleware

## Migration depuis l'ancien système

Si vous avez du code existant utilisant l'ancien système :

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

Le nouveau système gère automatiquement :
- L'ajout du header Authorization
- Le Content-Type
- Le rafraîchissement du token
- Les erreurs et retry
