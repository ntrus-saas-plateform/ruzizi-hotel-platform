'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Establishment {
  _id: string;
  name: string;
}

export default function EditAccommodationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    establishmentId: '',
    capacity: 2,
    pricePerNight: 0,
    description: '',
    amenities: [] as string[],
    status: 'available',
  });

  const amenitiesList = [
    'WiFi', 'TV', 'Climatisation', 'Mini-bar', 'Coffre-fort',
    'Balcon', 'Vue mer', 'Vue montagne', 'Baignoire', 'Douche'
  ];

  useEffect(() => {
    fetchEstablishments();
    fetchAccommodation();
  }, [id]);

  const fetchEstablishments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/establishments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement établissements:', err);
    }
  };

  const fetchAccommodation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/accommodations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de chargement');
      }

      const acc = data.data;
      setFormData({
        name: acc.name,
        type: acc.type,
        establishmentId: acc.establishmentId,
        capacity: acc.capacity,
        pricePerNight: acc.pricePerNight,
        description: acc.description || '',
        amenities: acc.amenities || [],
        status: acc.status || 'available',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors de la mise à jour');
      }

      router.push('/admin/accommodations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'Hébergement</h1>
        <p className="text-gray-600 mt-2">Mettre à jour les informations de l'hébergement</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Établissement *
            </label>
            <select
              value={formData.establishmentId}
              onChange={(e) => setFormData({ ...formData, establishmentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un établissement</option>
              {establishments.map((est) => (
                <option key={est._id} value={est._id}>{est.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom de l'hébergement *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="family">Familiale</option>
              <option value="presidential">Présidentielle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capacité (personnes) *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Prix par nuit (BIF) *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.pricePerNight}
              onChange={(e) => setFormData({ ...formData, pricePerNight: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Statut *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="available">Disponible</option>
              <option value="occupied">Occupé</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Réservé</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Équipements
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenitiesList.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
