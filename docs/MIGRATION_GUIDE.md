# Guide de migration - Ancien système → Nouveau système

## Vue d'ensemble

Ce guide vous aide à migrer votre code existant vers le nouveau système d'authentification avec rafraîchissement automatique des tokens.

## Changements requis

### 1. Layout principal (OBLIGATOIRE)

**Fichier** : `app/layout.tsx`

**Avant** :
```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Après** :
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

### 2. Appels API (RECOMMANDÉ)

#### Option A : Utiliser apiClient directement

**Avant** :
```tsx
const token = localStorage.getItem('token');
const response = await fetch('/api/establishments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
const result = await response.json();
```

**Après** :
```tsx
import { apiClient } from '@/lib/api/client';

const result = await apiClient.post('/api/establishments', data);
```

#### Option B : Utiliser les helpers d'API

**Avant** :
```tsx
const token = localStorage.getItem('token');
const response = await fetch('/api/establishments', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const data = await response.json();
```

**Après** :
```tsx
import { establishmentsApi } from '@/lib/api/establishments';

const { establishments, total } = await establishmentsApi.getAll();
```

### 3. Gestion de l'authentification

#### Login

**Avant** :
```tsx
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.tokens.accessToken);
  // Rediriger...
}
```

**Après** :
```tsx
import { useAuthContext } from '@/components/AuthProvider';

function LoginComponent() {
  const { login } = useAuthContext();
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      // Rediriger automatiquement
    } catch (error) {
      // Gérer l'erreur
    }
  };
}
```

#### Logout

**Avant** :
```tsx
localStorage.removeItem('token');
window.location.href = '/login';
```

**Après** :
```tsx
import { useAuthContext } from '@/components/AuthProvider';

function LogoutButton() {
  const { logout } = useAuthContext();
  
  return <button onClick={logout}>Déconnexion</button>;
}
```

#### Vérifier l'authentification

**Avant** :
```tsx
const token = localStorage.getItem('token');
if (!token) {
  router.push('/login');
}
```

**Après** :
```tsx
import { useAuthContext } from '@/components/AuthProvider';

function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null;
  
  return <div>Contenu protégé</div>;
}
```

#### Accéder aux informations utilisateur

**Avant** :
```tsx
const user = JSON.parse(localStorage.getItem('user') || '{}');
```

**Après** :
```tsx
import { useAuthContext } from '@/components/AuthProvider';

function UserProfile() {
  const { user } = useAuthContext();
  
  return (
    <div>
      <p>{user?.firstName} {user?.lastName}</p>
      <p>{user?.email}</p>
      <p>Rôle: {user?.role}</p>
    </div>
  );
}
```

## Patterns de migration courants

### Pattern 1 : Composant avec fetch

**Avant** :
```tsx
'use client';

import { useState, useEffect } from 'react';

export function EstablishmentsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/establishments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      setData(result.data);
      setLoading(false);
    };
    fetchData();
  }, []);
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      {data.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

**Après** :
```tsx
'use client';

import { useState, useEffect } from 'react';
import { establishmentsApi } from '@/lib/api/establishments';

export function EstablishmentsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await establishmentsApi.getAll();
        setData(result.establishments);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      {data.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

### Pattern 2 : Formulaire de création

**Avant** :
```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/establishments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      throw new Error('Failed');
    }
    
    const result = await response.json();
    } catch (error) {
    console.error('Error:', error);
  }
};
```

**Après** :
```tsx
import { establishmentsApi } from '@/lib/api/establishments';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const result = await establishmentsApi.create(formData);
    } catch (error) {
    console.error('Error:', error);
  }
};
```

### Pattern 3 : Page protégée

**Avant** :
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, []);
  
  return <div>Contenu protégé</div>;
}
```

**Après** :
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';

export default function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null;
  
  return <div>Contenu protégé</div>;
}
```

## Créer des helpers d'API pour d'autres ressources

Suivez le modèle de `establishments.ts` pour créer des helpers pour d'autres ressources :

```tsx
// lib/api/bookings.ts
import { apiClient } from './client';

export const bookingsApi = {
  async getAll(filters?: any) {
    const params = new URLSearchParams(filters);
    return await apiClient.get(`/api/bookings?${params}`);
  },
  
  async getById(id: string) {
    return await apiClient.get(`/api/bookings/${id}`);
  },
  
  async create(data: any) {
    return await apiClient.post('/api/bookings', data);
  },
  
  async update(id: string, data: any) {
    return await apiClient.put(`/api/bookings/${id}`, data);
  },
  
  async delete(id: string) {
    return await apiClient.delete(`/api/bookings/${id}`);
  },
};
```

## Checklist de migration

### Phase 1 : Préparation
- [ ] Lire la documentation complète
- [ ] Comprendre le nouveau système
- [ ] Identifier tous les fichiers à migrer

### Phase 2 : Intégration de base
- [ ] Ajouter `AuthProvider` dans le layout
- [ ] Tester le login avec le nouveau système
- [ ] Vérifier que les tokens sont stockés

### Phase 3 : Migration du code
- [ ] Remplacer les appels `fetch` par `apiClient`
- [ ] Migrer la gestion de l'authentification
- [ ] Créer des helpers d'API pour vos ressources
- [ ] Mettre à jour les composants protégés

### Phase 4 : Tests
- [ ] Tester le login/logout
- [ ] Tester les opérations CRUD
- [ ] Tester le rafraîchissement automatique
- [ ] Tester l'expiration du refresh token

### Phase 5 : Nettoyage
- [ ] Supprimer l'ancien code d'authentification
- [ ] Supprimer les imports inutilisés
- [ ] Mettre à jour la documentation

## Compatibilité

Le nouveau système est **rétrocompatible** :
- ✅ Vous pouvez migrer progressivement
- ✅ L'ancien code continue de fonctionner
- ✅ Pas besoin de tout migrer en une fois

## Avantages après migration

✅ **Moins de code** : Plus besoin de gérer manuellement les tokens
✅ **Plus robuste** : Gestion automatique des erreurs 401
✅ **Meilleure UX** : Pas de déconnexions inattendues
✅ **Plus maintenable** : Logique centralisée
✅ **Type-safe** : Support TypeScript complet

## Besoin d'aide ?

Consultez :
- `docs/AUTHENTICATION_FIX.md` - Documentation complète
- `docs/INTEGRATION_EXAMPLE.md` - Exemples détaillés
- `docs/QUICK_START.md` - Guide de démarrage rapide
