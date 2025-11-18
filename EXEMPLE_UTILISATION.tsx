/**
 * EXEMPLE D'UTILISATION DU NOUVEAU SYSTÈME D'AUTHENTIFICATION
 * 
 * Ce fichier montre comment utiliser le nouveau système.
 * Copiez ces exemples dans vos composants.
 */

// ============================================
// EXEMPLE 1 : Page de login
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { establishmentsApi, Establishment } from '@/lib/api/establishments';
import { apiClient } from '@/lib/api/client';

export function LoginPage() {
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
      console.log('✅ Connexion réussie !');
      router.push('/dashboard');
    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Connexion</h1>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// EXEMPLE 2 : Créer un établissement
// ============================================

export function CreateEstablishmentButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);

    try {
      const etablissement = await establishmentsApi.create({
        name: 'Mon Nouvel Hôtel',
        description: 'Un bel hôtel à Bujumbura',
        address: {
          street: '123 Avenue de la Paix',
          city: 'Bujumbura',
          province: 'Bujumbura Mairie',
          country: 'Burundi',
          postalCode: '1000',
        },
        contact: {
          phone: '+257 69 65 75 54',
          email: 'contact@monhotel.com',
          website: 'https://monhotel.com',
        },
        pricingMode: 'per_night',
      });

      console.log('✅ Établissement créé avec succès:', etablissement);
      alert('Établissement créé avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      alert('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isLoading}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
    >
      {isLoading ? 'Création...' : 'Créer un établissement'}
    </button>
  );
}

// ============================================
// EXEMPLE 3 : Afficher les informations utilisateur
// ============================================

export function UserProfile() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <div>Non connecté</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Profil utilisateur</h2>
      
      <div className="space-y-2">
        <p><strong>Nom :</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>Email :</strong> {user?.email}</p>
        <p><strong>Rôle :</strong> {user?.role}</p>
        {user?.establishmentId && (
          <p><strong>Établissement :</strong> {user.establishmentId}</p>
        )}
      </div>

      <button
        onClick={logout}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Déconnexion
      </button>
    </div>
  );
}

// ============================================
// EXEMPLE 4 : Liste des établissements
// ============================================

export function EstablishmentsList() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await establishmentsApi.getAll({
        page: 1,
        limit: 10,
      });
      
      setEstablishments(data.establishments);
      console.log('✅ Établissements chargés:', data.establishments.length);
    } catch (err) {
      console.error('❌ Erreur de chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Chargement des établissements...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded">
        Erreur : {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Établissements</h2>
      
      {establishments.length === 0 ? (
        <p>Aucun établissement trouvé</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {establishments.map((establishment) => (
            <div key={establishment.id} className="p-4 bg-white rounded shadow">
              <h3 className="font-bold text-lg">{establishment.name}</h3>
              <p className="text-gray-600">{establishment.description}</p>
              <p className="text-sm mt-2">
                📍 {establishment.address.city}
              </p>
              <p className="text-sm">
                📞 {establishment.contact.phone}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLE 5 : Page protégée
// ============================================

export function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Non authentifié, redirection vers /login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Page protégée</h1>
      <p>Bienvenue {user?.firstName} !</p>
      <p>Cette page n'est accessible qu'aux utilisateurs connectés.</p>
    </div>
  );
}

// ============================================
// EXEMPLE 6 : Utilisation directe de l'API client
// ============================================

// GET
async function getEstablishments() {
  const response = await apiClient.get('/api/establishments');
  console.log('✅ Établissements:', response);
  return response;
}

// POST
async function createEstablishment(data: any) {
  const response = await apiClient.post('/api/establishments', data);
  console.log('✅ Établissement créé:', response);
  return response;
}

// PUT
async function updateEstablishment(id: string, data: any) {
  const response = await apiClient.put(`/api/establishments/${id}`, data);
  console.log('✅ Établissement mis à jour:', response);
  return response;
}

// DELETE
async function deleteEstablishment(id: string) {
  const response = await apiClient.delete(`/api/establishments/${id}`);
  console.log('✅ Établissement supprimé');
  return response;
}

// ============================================
// EXEMPLE 7 : Test du rafraîchissement automatique
// ============================================

export async function testAutoRefresh() {
  console.log('🧪 Test du rafraîchissement automatique...');
  
  // 1. Se connecter
  console.log('1️⃣ Connexion...');
  // (utilisez le composant LoginPage ci-dessus)
  
  // 2. Attendre que le token expire (15 minutes ou 30 secondes si modifié)
  console.log('2️⃣ Attente de l\'expiration du token...');
  
  // 3. Faire une requête
  console.log('3️⃣ Tentative de création d\'établissement...');
  try {
    const etablissement = await establishmentsApi.create({
      name: 'Test Auto Refresh',
      address: {
        street: 'Test',
        city: 'Bujumbura',
        province: 'Bujumbura Mairie',
        country: 'Burundi',
      },
      contact: {
        phone: '+257 69 65 75 54',
        email: 'test@test.com',
      },
      pricingMode: 'per_night',
    });
    
    console.log('✅ SUCCESS ! Le token a été rafraîchi automatiquement');
    console.log('✅ Établissement créé:', etablissement);
  } catch (error) {
    console.error('❌ ÉCHEC ! Le rafraîchissement automatique ne fonctionne pas');
    console.error('Erreur:', error);
  }
}

/**
 * INSTRUCTIONS D'UTILISATION :
 * 
 * 1. Copiez les exemples dont vous avez besoin dans vos fichiers
 * 2. Ajoutez le AuthProvider dans votre app/layout.tsx
 * 3. Testez le login
 * 4. Testez la création d'établissement
 * 5. Attendez 15 minutes et testez à nouveau (le token devrait se rafraîchir automatiquement)
 * 
 * NOTES :
 * - Tous les exemples utilisent le nouveau système
 * - Le rafraîchissement est automatique et transparent
 * - Aucune gestion manuelle des tokens nécessaire
 * - Les erreurs sont gérées automatiquement
 */
