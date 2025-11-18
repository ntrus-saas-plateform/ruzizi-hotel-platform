# Exemple d'intégration complète

## 1. Configuration du layout principal

```tsx
// app/layout.tsx
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 2. Page de login

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Connexion</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 3. Page protégée avec création d'établissement

```tsx
// app/dashboard/establishments/new/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { CreateEstablishmentForm } from '@/components/establishments/CreateEstablishmentForm';

export default function NewEstablishmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Vérifier les permissions
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          Vous n'avez pas les permissions nécessaires
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Nouvel établissement</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <CreateEstablishmentForm
            onSuccess={() => {
              router.push('/dashboard/establishments');
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

## 4. Liste des établissements avec rafraîchissement automatique

```tsx
// app/dashboard/establishments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { establishmentsApi, Establishment } from '@/lib/api/establishments';

export default function EstablishmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEstablishments();
    }
  }, [isAuthenticated]);

  const loadEstablishments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await establishmentsApi.getAll();
      setEstablishments(data.establishments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Établissements</h1>
          <button
            onClick={() => router.push('/dashboard/establishments/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Nouvel établissement
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {establishments.map((establishment) => (
            <div
              key={establishment.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{establishment.name}</h3>
              <p className="text-gray-600 mb-4">{establishment.description}</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Ville:</span> {establishment.address.city}
                </p>
                <p>
                  <span className="font-medium">Téléphone:</span> {establishment.contact.phone}
                </p>
                <p>
                  <span className="font-medium">Mode:</span>{' '}
                  {establishment.pricingMode === 'per_night' ? 'Par nuit' : 'Par heure'}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/establishments/${establishment.id}`)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
                >
                  Voir
                </button>
                <button
                  onClick={() => router.push(`/dashboard/establishments/${establishment.id}/edit`)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>

        {establishments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun établissement trouvé
          </div>
        )}
      </div>
    </div>
  );
}
```

## 5. Composant de navigation avec déconnexion

```tsx
// components/Navbar.tsx
'use client';

import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">Ruzizi Hotel</h1>
            <div className="flex space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Tableau de bord
              </a>
              <a href="/dashboard/establishments" className="text-gray-700 hover:text-gray-900">
                Établissements
              </a>
              <a href="/dashboard/bookings" className="text-gray-700 hover:text-gray-900">
                Réservations
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

## 6. Middleware de protection des routes (optionnel)

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Routes publiques
  const publicPaths = ['/login', '/register', '/forgot-password'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Vérifier si l'utilisateur a un token
  const token = request.cookies.get('auth-token')?.value;

  // Rediriger vers login si pas de token et route protégée
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rediriger vers dashboard si token et route publique
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Notes importantes

1. **Toutes les requêtes API passent par `apiClient`** : Cela garantit le rafraîchissement automatique des tokens

2. **Le AuthProvider doit envelopper toute l'application** : Placez-le dans le layout racine

3. **Les tokens sont automatiquement gérés** : Pas besoin de les manipuler manuellement

4. **Le rafraîchissement est transparent** : L'utilisateur ne voit jamais les erreurs 401

5. **La déconnexion est automatique** : Si le refresh token expire, l'utilisateur est redirigé vers login
