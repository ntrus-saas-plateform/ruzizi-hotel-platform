'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserResponse } from '@/types/user.types';

interface Establishment {
    id: string;
    name: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [establishments, setEstablishments] = useState<Establishment[]>([]);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'staff',
        establishmentId: '',
        isActive: true,
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchEstablishments();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Token d\'authentification manquant');
                return;
            }

            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.user) {
                setCurrentUser(data.user);
                // Pre-select establishment for non-admin users
                if (data.user.role !== 'super_admin' && data.user.establishmentId) {
                    setFormData(prev => ({ ...prev, establishmentId: data.user.establishmentId }));
                }
            }
        } catch (err) {
            console.error('Erreur chargement utilisateur:', err);
            setError(`Erreur lors du chargement de l'utilisateur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
    };

    const fetchEstablishments = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Token d\'authentification manquant');
                return;
            }

            const response = await fetch('/api/establishments?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('Establishments data:', data); // Debug log

            if (data.success && data.data) {
                // Handle both paginated and non-paginated responses
                const establishmentsList = data.data.data || data.data || [];
                console.log('Establishments list:', establishmentsList); // Debug log

                // Ensure establishments have valid _id and name
                const validEstablishments = establishmentsList.filter((est: any) =>
                    est.id && typeof est.id === 'string' && est.name && typeof est.name === 'string'
                );
                console.log('Valid establishments:', validEstablishments); // Debug log
                setEstablishments(validEstablishments);
            } else {
                console.error('Unexpected API response:', data);
                setError('Format de réponse API inattendu');
            }
        } catch (err) {
            console.error('Erreur chargement établissements:', err);
            setError(`Erreur lors du chargement des établissements: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Prepare data - ensure establishmentId is properly handled
            const submitData = {
                ...formData,
                establishmentId: formData.establishmentId || undefined, // Convert empty string to undefined
            };

            console.log('Submitting user data:', submitData); // Debug log

            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(submitData),
            });

            const data = await response.json();
            console.log('API response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.error?.message || `Erreur HTTP ${response.status}: ${JSON.stringify(data)}`);
            }

            router.push('/admin/users');
        } catch (err) {
            console.error('User creation error:', err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-luxury-text hover:text-luxury-dark flex items-center gap-2 mb-4"
                >
                    ← Retour
                </button>
                <h1 className="text-3xl font-bold text-luxury-dark">Nouvel Utilisateur</h1>
                <p className="text-luxury-text mt-2">Créer un nouveau compte utilisateur</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Prénom *
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nom *
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mot de passe *
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Rôle *
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="staff">Personnel</option>
                            <option value="receptionist">Réceptionniste</option>
                            <option value="manager">Manager</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Établissement
                        </label>
                        <select
                            value={formData.establishmentId}
                            onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={currentUser?.role !== 'super_admin'}
                        >
                            {currentUser?.role === 'super_admin' ? (
                                <>
                                    <option value="">Aucun (Super Admin)</option>
                                    {establishments.map((est) => (
                                        <option key={est.id} value={est.id}>{est.name}</option>
                                    ))}
                                </>
                            ) : (
                                establishments
                                    .filter(est => est.id === currentUser?.establishmentId)
                                    .map((est) => (
                                        <option key={est.id} value={est.id}>{est.name}</option>
                                    ))
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {currentUser?.role === 'super_admin'
                                ? 'Requis pour les managers et le personnel'
                                : 'Votre établissement est automatiquement sélectionné'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-luxury-gold border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Compte actif
                    </label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-luxury-gold text-luxury-cream rounded-lg  disabled:opacity-50"
                    >
                        {loading ? 'Création...' : 'Créer l\'utilisateur'}
                    </button>
                </div>
            </form>
        </div>
    );
}
