'use client';

import type { GuestInfo, Gender, IDType, RelationshipType } from '@/types/guest.types';

interface GuestFormProps {
  guest: GuestInfo;
  index: number;
  onChange: (guest: GuestInfo) => void;
  onRemove?: () => void;
}

export default function GuestForm({ guest, index, onChange, onRemove }: GuestFormProps) {
  const updateField = (field: keyof GuestInfo, value: any) => {
    const updated = { ...guest, [field]: value };
    
    // Auto-calculate isMinor based on dateOfBirth
    if (field === 'dateOfBirth') {
      const age = calculateAge(value);
      updated.isMinor = age < 18;
    }
    
    onChange(updated);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-luxury-dark">
          Invité {index + 1} {guest.isMinor && <span className="text-sm text-orange-600">(Mineur)</span>}
        </h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Prénom<span className="text-red-500">*</span>
          </label>
          <input
            id={`firstName-${index}`}
            type="text"
            value={guest.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Nom */}
        <div>
          <label htmlFor={`lastName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Nom<span className="text-red-500">*</span>
          </label>
          <input
            id={`lastName-${index}`}
            type="text"
            value={guest.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label htmlFor={`gender-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Genre<span className="text-red-500">*</span>
          </label>
          <select
            id={`gender-${index}`}
            value={guest.gender}
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
          <label htmlFor={`dateOfBirth-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance<span className="text-red-500">*</span>
          </label>
          <input
            id={`dateOfBirth-${index}`}
            type="date"
            value={guest.dateOfBirth instanceof Date ? guest.dateOfBirth.toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('dateOfBirth', new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Nationalité */}
        <div>
          <label htmlFor={`nationality-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Nationalité<span className="text-red-500">*</span>
          </label>
          <input
            id={`nationality-${index}`}
            type="text"
            value={guest.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Type de pièce d'identité */}
        <div>
          <label htmlFor={`idType-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Type de pièce d'identité<span className="text-red-500">*</span>
          </label>
          <select
            id={`idType-${index}`}
            value={guest.idType}
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
          <label htmlFor={`idNumber-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de pièce d'identité<span className="text-red-500">*</span>
          </label>
          <input
            id={`idNumber-${index}`}
            type="text"
            value={guest.idNumber}
            onChange={(e) => updateField('idNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Date d'expiration */}
        <div>
          <label htmlFor={`idExpiryDate-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Date d'expiration de la pièce
          </label>
          <input
            id={`idExpiryDate-${index}`}
            type="date"
            value={guest.idExpiryDate instanceof Date ? guest.idExpiryDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('idExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Lien avec le client principal */}
        <div>
          <label htmlFor={`relationship-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Lien avec le client principal<span className="text-red-500">*</span>
          </label>
          <select
            id={`relationship-${index}`}
            value={guest.relationshipToMainClient}
            onChange={(e) => updateField('relationshipToMainClient', e.target.value as RelationshipType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Sélectionner...</option>
            <option value="spouse">Époux/Épouse</option>
            <option value="child">Enfant</option>
            <option value="parent">Parent</option>
            <option value="sibling">Frère/Sœur</option>
            <option value="friend">Ami(e)</option>
            <option value="colleague">Collègue</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Détails de la relation (si autre) */}
        {guest.relationshipToMainClient === 'other' && (
          <div>
            <label htmlFor={`relationshipDetails-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              Précisez la relation
            </label>
            <input
              id={`relationshipDetails-${index}`}
              type="text"
              value={guest.relationshipDetails || ''}
              onChange={(e) => updateField('relationshipDetails', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Notes */}
        <div className="md:col-span-2">
          <label htmlFor={`notes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Allergies, préférences, besoins spéciaux)
          </label>
          <textarea
            id={`notes-${index}`}
            value={guest.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Allergies alimentaires, besoins d'accessibilité, etc."
          />
        </div>
      </div>
    </div>
  );
}
