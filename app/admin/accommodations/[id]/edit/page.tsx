'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ImageUpload from '@/components/admin/ImageUpload';

interface Establishment {
  _id: string;
  name: string;
  pricingMode: string;
}

export default function EditAccommodationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    establishmentId: '',
    name: '',
    type: 'standard_room',
    pricingMode: 'nightly',
    status: 'available',
    basePrice: 0,
    seasonalPrice: 0,
    currency: 'BIF',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    showers: 1,
    livingRooms: 0,
    kitchens: 0,
    balconies: 0,
    floor: 0,
    area: 0,
    view: '',
    bedType: '',
    amenities: [] as string[],
    images: [] as string[],
  });

  const amenitiesList = [
    'WiFi', 'TV', 'Climatisation', 'Chauffage', 'Mini-bar', 'Coffre-fort',
    'Balcon', 'Terrasse', 'Vue mer', 'Vue montagne', 'Vue jardin', 'Vue ville',
    'Baignoire', 'Douche', 'Sèche-cheveux', 'Peignoir', 'Chaussons',
    'Bureau', 'Canapé', 'Coin salon', 'Kitchenette', 'Machine à café',
    'Bouilloire', 'Réfrigérateur', 'Micro-ondes', 'Ustensiles de cuisine',
    'Fer à repasser', 'Planche à repasser', 'Téléphone', 'Radio réveil',
    'Insonorisation', 'Moustiquaire', 'Ventilateur', 'Détecteur de fumée'
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
        establishmentId: acc.establishmentId,
        name: acc.name,
        type: acc.type,
        pricingMode: acc.pricingMode,
        status: acc.status || 'available',
        basePrice: acc.pricing?.basePrice || 0,
        seasonalPrice: acc.pricing?.seasonalPrice || 0,
        currency: acc.pricing?.currency || 'BIF',
        maxGuests: acc.capacity?.maxGuests || 2,
        bedrooms: acc.capacity?.bedrooms || 1,
        bathrooms: acc.capacity?.bathrooms || 1,
        showers: acc.capacity?.showers || 1,
        livingRooms: acc.capacity?.livingRooms || 0,
        kitchens: acc.capacity?.kitchens || 0,
        balconies: acc.capacity?.balconies || 0,
        floor: acc.details?.floor || 0,
        area: acc.details?.area || 0,
        view: acc.details?.view || '',
        bedType: acc.details?.bedType || '',
        amenities: acc.amenities || [],
        images: acc.images || [],
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
      
      const payload = {
        establishmentId: formData.establishmentId,
        name: formData.name,
        type: formData.type,
        pricingMode: formData.pricingMode,
        pricing: {
          basePrice: formData.basePrice,
          seasonalPrice: formData.seasonalPrice || undefined,
          currency: formData.currency,
        },
        capacity: {
          maxGuests: formData.maxGuests,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          showers: formData.showers,
          livingRooms: formData.livingRooms,
          kitchens: formData.kitchens,
          balconies: formData.balconies,
        },
        details: {
          floor: formData.floor || undefined,
          area: formData.area || undefined,
          view: formData.view || undefined,
          bedType: formData.bedType || undefined,
        },
        amenities: formData.amenities,
        status: formData.status,
        images: formData.images,
      };

      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const tabs = [
    { id: 'basic', label: 'Informations de base', icon: '📋' },
    { id: 'pricing', label: 'Tarification', icon: '💰' },
    { id: 'capacity', label: 'Capacité & Composition', icon: '🏠' },
    { id: 'details', label: 'Détails', icon: '📝' },
    { id: 'amenities', label: 'Équipements', icon: '⭐' },
    { id: 'images', label: 'Photos', icon: '📸' },
  ];

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
    <div className="p-6 max-w-6xl mx-auto">
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

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option value="standard_room">Chambre Standard</option>
                      <option value="suite">Suite</option>
                      <option value="house">Maison</option>
                      <option value="apartment">Appartement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mode de tarification *
                    </label>
                    <select
                      value={formData.pricingMode}
                      onChange={(e) => setFormData({ ...formData, pricingMode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="nightly">Par nuit</option>
                      <option value="monthly">Par mois</option>
                      <option value="hourly">Par heure</option>
                    </select>
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
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prix de base *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <span className="absolute right-4 top-2 text-gray-500">BIF</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prix saisonnier (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.seasonalPrice}
                        onChange={(e) => setFormData({ ...formData, seasonalPrice: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-2 text-gray-500">BIF</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'capacity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de personnes max *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxGuests}
                      onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chambres *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Salles de bain *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Douches *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.showers}
                      onChange={(e) => setFormData({ ...formData, showers: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Salons *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.livingRooms}
                      onChange={(e) => setFormData({ ...formData, livingRooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cuisines *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kitchens}
                      onChange={(e) => setFormData({ ...formData, kitchens: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Balcons *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.balconies}
                      onChange={(e) => setFormData({ ...formData, balconies: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Étage
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Surface (m²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vue
                    </label>
                    <input
                      type="text"
                      value={formData.view}
                      onChange={(e) => setFormData({ ...formData, view: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type de lit
                    </label>
                    <input
                      type="text"
                      value={formData.bedType}
                      onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Équipements disponibles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenitiesList.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
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
            )}

            {activeTab === 'images' && (
              <div>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={15}
                  label="Photos de l'hébergement"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
