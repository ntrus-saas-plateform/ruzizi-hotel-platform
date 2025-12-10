'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';
import type { CreateEmployeeInput } from '@/types/employee.types';

export default function CreateEmployeePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Personal Info
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male' as 'male' | 'female' | 'other',
        nationality: '',
        idNumber: '',
        phone: '',
        email: '',
        address: '',
        // Employment Info
        position: '',
        department: '',
        establishmentId: '',
        hireDate: '',
        contractType: 'permanent' as 'permanent' | 'temporary' | 'contract',
        salary: '',
        status: 'active' as 'active' | 'inactive' | 'terminated',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side validation for establishment
        if (!formData.establishmentId) {
            setError('Veuillez sélectionner un établissement');
            setLoading(false);
            return;
        }

        // Validate establishment permissions for non-admin users
        if (user && user.role !== 'root' && user.role !== 'super_admin') {
            if (formData.establishmentId !== user.establishmentId) {
                setError('Vous ne pouvez créer des employés que pour votre établissement assigné');
                setLoading(false);
                return;
            }
        }

        try {
            // Prepare data according to CreateEmployeeInput interface
            const submitData: CreateEmployeeInput = {
                personalInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dateOfBirth: new Date(formData.dateOfBirth),
                    gender: formData.gender,
                    nationality: formData.nationality,
                    idNumber: formData.idNumber,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                },
                employmentInfo: {
                    position: formData.position,
                    department: formData.department,
                    establishmentId: formData.establishmentId,
                    hireDate: new Date(formData.hireDate),
                    contractType: formData.contractType,
                    salary: parseFloat(formData.salary),
                    status: formData.status,
                },
            };

            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(submitData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || `Erreur HTTP ${response.status}: ${JSON.stringify(data)}`);
            }

            router.push('/admin/hr/employees');
        } catch (err) {
            console.error('Employee creation error:', err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-luxury-text hover:text-luxury-dark flex items-center gap-2 mb-4"
                >
                    ← Retour
                </button>
                <h1 className="text-3xl font-bold text-luxury-dark">Nouvel Employé</h1>
                <p className="text-luxury-text mt-2">Créer un nouveau profil d'employé</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
                {/* Personal Information Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Informations Personnelles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Prénom *
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Date de Naissance *
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Genre *
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            >
                                <option value="male">Masculin</option>
                                <option value="female">Féminin</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nationalité *
                            </label>
                            <input
                                type="text"
                                value={formData.nationality}
                                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Numéro d'Identité *
                            </label>
                            <input
                                type="text"
                                value={formData.idNumber}
                                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Téléphone *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Adresse *
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Employment Information Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Informations d'Emploi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Poste *
                            </label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Département *
                            </label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <EstablishmentSelector
                                value={formData.establishmentId}
                                onChange={(establishmentId) => setFormData({ ...formData, establishmentId })}
                                required={true}
                                userRole={user?.role}
                                userEstablishmentId={user?.establishmentId}
                                label="Établissement"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Date d'Embauche *
                            </label>
                            <input
                                type="date"
                                value={formData.hireDate}
                                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Type de Contrat *
                            </label>
                            <select
                                value={formData.contractType}
                                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as 'permanent' | 'temporary' | 'contract' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            >
                                <option value="permanent">Permanent</option>
                                <option value="temporary">Temporaire</option>
                                <option value="contract">Contrat</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Salaire *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Statut *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'terminated' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                                required
                            >
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                                <option value="terminated">Terminé</option>
                            </select>
                        </div>
                    </div>
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
                        className="px-6 py-2 bg-luxury-gold text-luxury-cream rounded-lg disabled:opacity-50"
                    >
                        {loading ? 'Création...' : 'Créer l\'employé'}
                    </button>
                </div>
            </form>
        </div>
    );
}