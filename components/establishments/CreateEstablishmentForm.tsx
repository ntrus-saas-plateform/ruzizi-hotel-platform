'use client';

import { useState } from 'react';
import { establishmentsApi, CreateEstablishmentData } from '@/lib/api/establishments';

export function CreateEstablishmentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEstablishmentData>({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      province: '',
      country: 'Burundi',
      postalCode: '',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    pricingMode: 'per_night',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await establishmentsApi.create(formData);
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        address: {
          street: '',
          city: '',
          province: '',
          country: 'Burundi',
          postalCode: '',
        },
        contact: {
          phone: '',
          email: '',
          website: '',
        },
        pricingMode: 'per_night',
      });

      // Callback de succès
      if (onSuccess) {
        onSuccess();
      }

      alert('Établissement créé avec succès !');
    } catch (err) {
      console.error('Error creating establishment:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CreateEstablishmentData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Nom de l'établissement *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="address.street" className="block text-sm font-medium mb-2">
            Rue *
          </label>
          <input
            type="text"
            id="address.street"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="address.city" className="block text-sm font-medium mb-2">
            Ville *
          </label>
          <input
            type="text"
            id="address.city"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact.phone" className="block text-sm font-medium mb-2">
            Téléphone *
          </label>
          <input
            type="tel"
            id="contact.phone"
            name="contact.phone"
            value={formData.contact.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="contact.email" className="block text-sm font-medium mb-2">
            Email *
          </label>
          <input
            type="email"
            id="contact.email"
            name="contact.email"
            value={formData.contact.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pricingMode" className="block text-sm font-medium mb-2">
          Mode de tarification *
        </label>
        <select
          id="pricingMode"
          name="pricingMode"
          value={formData.pricingMode}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="per_night">Par nuit</option>
          <option value="per_hour">Par heure</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-luxury-gold text-luxury-cream py-2 px-4 rounded-md  disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Création en cours...' : 'Créer l\'établissement'}
      </button>
    </form>
  );
}
