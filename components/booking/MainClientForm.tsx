'use client';

import type { CompleteClientInfo, Gender, IDType, CustomerType } from '@/types/guest.types';

interface MainClientFormProps {
  client: CompleteClientInfo;
  onChange: (client: CompleteClientInfo) => void;
}

export default function MainClientForm({ client, onChange }: MainClientFormProps) {
  const updateField = (field: keyof CompleteClientInfo, value: any) => {
    onChange({ ...client, [field]: value });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Informations du Client Principal <span className="text-red-500">*</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={client.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={client.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre <span className="text-red-500">*</span>
          </label>
          <select
            value={client.gender}
            onChange={(e) => updateField('gender', e.target.value as Gender)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={client.dateOfBirth instanceof Date ? client.dateOfBirth.toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('dateOfBirth', new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Nationalité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nationalité <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Type de pièce d'identité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de pièce d'identité <span className="text-red-500">*</span>
          </label>
          <select
            value={client.idType}
            onChange={(e) => updateField('idType', e.target.value as IDType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="passport">Passeport</option>
            <option value="id_card">Carte d'identité</option>
            <option value="driver_license">Permis de conduire</option>
            <option value="birth_certificate">Acte de naissance</option>
          </select>
        </div>

        {/* Numéro de pièce d'identité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de pièce d'identité <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.idNumber}
            onChange={(e) => updateField('idNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Date d'expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d'expiration de la pièce
          </label>
          <input
            type="date"
            value={client.idExpiryDate instanceof Date ? client.idExpiryDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('idExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Adresse */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse complète <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Ville */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.city}
            onChange={(e) => updateField('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Pays */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pays <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={client.country}
            onChange={(e) => updateField('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Code postal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code postal
          </label>
          <input
            type="text"
            value={client.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Langue préférée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Langue préférée
          </label>
          <select
            value={client.preferredLanguage}
            onChange={(e) => updateField('preferredLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        {/* Type de client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de client <span className="text-red-500">*</span>
          </label>
          <select
            value={client.customerType}
            onChange={(e) => updateField('customerType', e.target.value as CustomerType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="individual">Individuel</option>
            <option value="corporate">Entreprise</option>
            <option value="agency">Agence</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Nom de l'entreprise (si applicable) */}
        {(client.customerType === 'corporate' || client.customerType === 'agency') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise/agence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={client.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}

        {/* Numéro de fidélité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de carte de fidélité
          </label>
          <input
            type="text"
            value={client.loyaltyCardNumber}
            onChange={(e) => updateField('loyaltyCardNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Si vous en avez un"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes / Informations spéciales
          </label>
          <textarea
            value={client.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="VIP, allergies, besoins spéciaux, etc."
          />
        </div>
      </div>
    </div>
  );
}
