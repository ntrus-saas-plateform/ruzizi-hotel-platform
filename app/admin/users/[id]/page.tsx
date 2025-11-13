'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de chargement');
      }

      setUser(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      router.push('/admin/users');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = user.isActive ? 'deactivate' : 'activate';
      const response = await fetch(`/api/users/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut');
      }

      fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
      manager: { label: 'Manager', color: 'bg-blue-100 text-blue-800' },
      receptionist: { label: 'Réceptionniste', color: 'bg-green-100 text-green-800' },
      staff: { label: 'Personnel', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error || 'Utilisateur non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 mt-2">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/users/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                user.isActive 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {user.isActive ? 'Désactiver' : 'Activer'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations personnelles</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Prénom</label>
                  <p className="text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900">{user.lastName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-gray-900">{user.phone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Établissement</label>
                <p className="text-gray-900">{user.establishmentId?.name || 'Aucun'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Dernière connexion</label>
                <p className="text-gray-900">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Créé le</label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Statut</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Rôle</div>
                {getRoleBadge(user.role)}
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Statut du compte</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {user.permissions && user.permissions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Permissions</h2>
              <div className="space-y-2">
                {user.permissions.map((permission: string) => (
                  <div key={permission} className="flex items-center space-x-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
