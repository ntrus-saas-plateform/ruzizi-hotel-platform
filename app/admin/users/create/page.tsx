'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';
import type { UserResponse } from '@/types/user.types';

export default function CreateUserPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side validation for establishment (required for non-admin users)
        if (!formData.establishmentId && formData.role !== 'super_admin' && formData.role !== 'root') {
            setError('Veuillez sélectionner un établissement pour ce rôle');
            setLoading(false);
            return;
        }

        // Validate establishment permissions for non-admin users
        if (user && user.role !== 'root' && user.role !== 'super_admin') {
            if (formData.establishmentId !== user.establishmentId) {
                setError('Vous ne pouvez créer des utilisateurs que pour votre établissement assigné');
                setLoading(false);
                return;
            }
        }

        try {
            // Prepare data - ensure establishmentId is properly handled
            const submitData = {
                ...formData,
                establishmentId: formData.establishmentId || undefined, // Convert empty string to undefined
            };

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
                        <EstablishmentSelector
                            value={formData.establishmentId}
                            onChange={(establishmentId) => setFormData({ ...formData, establishmentId })}
                            required={formData.role !== 'super_admin' && formData.role !== 'root'}
                            label="Établissement"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Requis pour les managers et le personnel. Les super admins peuvent ne pas avoir d'établissement assigné.
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
