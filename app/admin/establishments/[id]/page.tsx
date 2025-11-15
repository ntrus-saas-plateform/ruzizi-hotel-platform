'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EstablishmentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [establishment, setEstablishment] = useState<any>(null);

    useEffect(() => {
        // Don't fetch if id is "new" or "create" (these are for creation pages)
        if (id && id !== 'new' && id !== 'create') {
            fetchEstablishment();
        } else {
            // Redirect to create page if trying to access /new
            if (id === 'new' || id === 'create') {
                router.push('/admin/establishments/create');
            }
        }
    }, [id]);

    const fetchEstablishment = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/establishments/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erreur de chargement');
            }

            setEstablishment(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/establishments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            router.push('/admin/establishments');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Erreur inconnue');
        }
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

    if (error || !establishment) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error || 'Établissement non trouvé'}</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">{establishment.name}</h1>
                        <p className="text-gray-600 mt-2">
                            {establishment.location?.city}, {establishment.location?.country}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push(`/admin/establishments/${id}/edit`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifier
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
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Informations générales</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Type</label>
                                <p className="text-gray-900 capitalize">{establishment.type}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Description</label>
                                <p className="text-gray-900">{establishment.description || 'Aucune description'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Adresse complète</label>
                                <p className="text-gray-900">
                                    {establishment.location?.address}<br />
                                    {establishment.location?.city}, {establishment.location?.country}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Téléphone</label>
                                    <p className="text-gray-900">{establishment.contacts?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900">{establishment.contacts?.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {establishment.amenities && establishment.amenities.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Équipements et services</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {establishment.amenities.map((amenity: string) => (
                                    <div key={amenity} className="flex items-center space-x-2 text-gray-700">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{establishment.totalCapacity || 0}</div>
                                <div className="text-sm text-gray-600">Capacité totale</div>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600 capitalize">
                                    {establishment.pricingMode || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-600">Mode de tarification</div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className={`text-2xl font-bold ${establishment.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {establishment.isActive ? 'Actif' : 'Inactif'}
                                </div>
                                <div className="text-sm text-gray-600">Statut</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push(`/admin/accommodations?establishment=${id}`)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                </svg>
                                Voir les hébergements
                            </button>

                            <button
                                onClick={() => router.push(`/admin/bookings?establishment=${id}`)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Voir les réservations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
