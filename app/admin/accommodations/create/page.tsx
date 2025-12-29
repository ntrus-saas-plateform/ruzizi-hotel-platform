'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import ImageUpload from '@/components/admin/ImageUpload';
import EstablishmentSelector from '@/components/admin/EstablishmentSelector';
import { useAuth } from '@/lib/auth/AuthContext';



export default function CreateAccommodationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Debug: Log user data from context
  console.log('🔍 User from auth context:', user);
  
  // Auto-select establishment for non-admin users
  useEffect(() => {
    if (user && user.role !== 'root' && user.role !== 'super_admin' && user.role !== 'admin' && user.establishmentId) {
      console.log('🏢 Auto-selecting establishment for accommodation creation:', user.establishmentId);
      setFormData(prev => ({ ...prev, establishmentId: user.establishmentId || '' }));
    }
  }, [user]);
  
  const [formData, setFormData] = useState({
    // Basic
    establishmentId: '',
    name: '',
    type: 'standard_room',
    pricingMode: 'nightly',
    status: 'available',
    // Pricing
    basePrice: 0,
    seasonalPrice: 0,
    currency: 'BIF',
    // Capacity
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    showers: 1,
    livingRooms: 0,
    kitchens: 0,
    balconies: 0,
    // Details
    floor: 0,
    area: 0,
    view: '',
    bedType: '',
    // Amenities
    amenities: [] as string[],
    // Images
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

  const handleEstablishmentChange = (establishmentId: string) => {
    setFormData(prev => ({
      ...prev,
      establishmentId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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

      await apiClient.post('/api/accommodations', payload);
      router.push('/admin/accommodations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-luxury-text hover:text-luxury-dark flex items-center gap-2 mb-4"
        >
          ← Retour
        </button>
        <h1 className="text-3xl font-bold text-luxury-dark">Nouvel Hébergement</h1>
        <p className="text-luxury-text mt-2">Créer un nouvel hébergement</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
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
                      ? 'border-luxury-gold text-luxury-gold'
                      : 'border-transparent text-luxury-text hover:text-luxury-dark'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <EstablishmentSelector
                  value={formData.establishmentId}
                  onChange={handleEstablishmentChange}
                  required={true}
                  label="Établissement"
                />

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
                      placeholder="Ex: Chambre Deluxe 101"
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

            {/* Pricing Tab */}
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
                        value={formData.basePrice || ''}
                        onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <span className="absolute right-4 top-2 text-gray-500">BIF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Prix {formData.pricingMode === 'nightly' ? 'par nuit' : formData.pricingMode === 'monthly' ? 'par mois' : 'par heure'}
                    </p>
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
                        value={formData.seasonalPrice || ''}
                        onChange={(e) => setFormData({ ...formData, seasonalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-2 text-gray-500">BIF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pour haute saison</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Conseil:</strong> Le prix saisonnier sera appliqué automatiquement pendant les périodes de haute saison que vous définirez.
                  </p>
                </div>
              </div>
            )}

            {/* Capacity Tab */}
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
                      value={formData.maxGuests || ''}
                      onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })}
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
                      value={formData.bedrooms || ''}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
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
                      value={formData.bathrooms || ''}
                      onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
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
                      value={formData.showers || ''}
                      onChange={(e) => setFormData({ ...formData, showers: parseInt(e.target.value) || 0 })}
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
                      value={formData.livingRooms || ''}
                      onChange={(e) => setFormData({ ...formData, livingRooms: parseInt(e.target.value) || 0 })}
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
                      value={formData.kitchens || ''}
                      onChange={(e) => setFormData({ ...formData, kitchens: parseInt(e.target.value) || 0 })}
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
                      value={formData.balconies || ''}
                      onChange={(e) => setFormData({ ...formData, balconies: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Étage
                    </label>
                    <input
                      type="number"
                      value={formData.floor || ''}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Surface (m²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 35"
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
                      placeholder="Ex: Vue sur le lac"
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
                      placeholder="Ex: 1 lit king size"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Amenities Tab */}
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
                        className="w-4 h-4 text-luxury-gold border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={15}
                  label="Photos de l'hébergement"
                />
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    📸 <strong>Conseil:</strong> Ajoutez des photos de toutes les pièces, de la vue, et des équipements spéciaux. Des photos de qualité augmentent significativement les réservations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
            className="px-6 py-2 bg-luxury-gold text-luxury-cream rounded-lg  disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Création...
              </>
            ) : (
              'Créer l\'hébergement'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
