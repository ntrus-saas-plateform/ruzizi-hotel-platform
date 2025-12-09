'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  establishmentId?: {
    establishmentId: string;
    name: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    role: '',
    isActive: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.role) params.append('role', filter.role);
      if (filter.isActive) params.append('isActive', filter.isActive);
      if (filter.search) params.append('search', filter.search);

      const response = await fetch(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const response = await fetch(`/api/users/${userId}/${endpoint}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      manager: 'Manager',
      staff: 'Staff',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800';
      case 'manager':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800';
      case 'staff':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
    }
  };

  const getStats = () => {
    return {
      total: users?.length,
      active: users?.filter((u) => u.isActive).length,
      inactive: users?.filter((u) => !u.isActive).length,
      admins: users?.filter((u) => u.role === 'super_admin').length,
      managers: users?.filter((u) => u.role === 'manager').length,
      staff: users?.filter((u) => u.role === 'staff').length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-luxury-dark ">
                Gestion des Utilisateurs
              </h1>
              <p className="text-luxury-text mt-2">
                Gérer les comptes utilisateurs et leurs permissions
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/users/create")}
              className="flex items-center justify-center px-6 py-3 bg-luxury-gold text-luxury-cream rounded-xl  transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouvel Utilisateur
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Total</p>
            <p className="text-2xl font-bold text-luxury-gold">{stats.total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Actifs</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Inactifs</p>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Admins</p>
            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Managers</p>
            <p className="text-2xl font-bold text-luxury-gold">{stats.managers}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 hover:shadow-xl transition-all duration-300">
            <p className="text-sm text-luxury-text mb-1">Staff</p>
            <p className="text-2xl font-bold text-luxury-text">{stats.staff}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-luxury-dark flex items-center">
              <svg
                className="w-6 h-6 mr-3 text-luxury-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtres
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
            >
              {showFilters ? 'Masquer' : 'Afficher'}
            </button>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}
          >
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Recherche</label>
              <div className="relative">
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Nom ou email..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-[hsl(var(--color-luxury-gold))] transition-all duration-200 bg-white shadow-sm"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Rôle</label>
              <select
                value={filter.role}
                onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-[hsl(var(--color-luxury-gold))] transition-all duration-200 bg-white shadow-sm appearance-none"
              >
                <option value="">Tous</option>
                <option value="super_admin">Super Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Statut</label>
              <select
                value={filter.isActive}
                onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-[hsl(var(--color-luxury-gold))] transition-all duration-200 bg-white shadow-sm appearance-none"
              >
                <option value="">Tous</option>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilter({ role: '', isActive: '', search: '' })}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-[hsl(var(--color-luxury-gold))] hover:text-luxury-gold transition-all duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {users?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-luxury-dark mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-luxury-text">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Établissement
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Dernière connexion
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((user) => (
                      <tr
                        key={user.userId}
                        className="hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-luxury rounded-full flex items-center justify-center text-luxury-cream font-bold mr-3">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-luxury-dark">{user.name}</div>
                              <div className="text-sm text-luxury-text">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-dark">
                          {user.establishmentId?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                            }`}
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-dark">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.userId}`)}
                            className="text-luxury-gold hover:text-indigo-900 font-medium"
                          >
                            Voir
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.userId, user.isActive)}
                            className="text-yellow-600 hover:text-yellow-900 font-medium"
                          >
                            {user.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.userId)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {users?.map((user) => (
                  <div
                    key={user.userId}
                    className="p-6 hover:bg-indigo-50 transition-colors duration-150"
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-luxury rounded-full flex items-center justify-center text-luxury-cream font-bold mr-4 flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-luxury-dark mb-1">{user.name}</h3>
                        <p className="text-sm text-luxury-text mb-2">{user.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                            }`}
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => router.push(`/admin/users/${user.userId}`)}
                        className="px-3 py-2 bg-indigo-600 text-luxury-cream rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.userId, user.isActive)}
                        className="px-3 py-2 bg-yellow-600 text-luxury-cream rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                      >
                        {user.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.userId)}
                        className="px-3 py-2 bg-red-600 text-luxury-cream rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
