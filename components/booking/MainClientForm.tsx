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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 shadow-sm">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Informations du Client Principal
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Veuillez remplir tous les champs obligatoires <span className="text-red-500">*</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Prénom <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Entrez votre prénom"
            required
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Nom <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Entrez votre nom"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="email"
            value={client.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="exemple@email.com"
            required
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Téléphone <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            value={client.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="+257 XX XX XX XX"
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Genre <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={client.gender}
            onChange={(e) => updateField('gender', e.target.value as Gender)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none cursor-pointer"
            required
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date de naissance <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            value={
              client.dateOfBirth instanceof Date && !isNaN(client.dateOfBirth.getTime())
                ? client.dateOfBirth.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => updateField('dateOfBirth', e.target.value ? new Date(e.target.value) : new Date())}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            required
          />
        </div>

        {/* Nationalité */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Nationalité <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Ex: Burundaise"
            required
          />
        </div>

        {/* Type de pièce d'identité */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Type de pièce d'identité <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={client.idType}
            onChange={(e) => updateField('idType', e.target.value as IDType)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none cursor-pointer"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Numéro de pièce d'identité <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.idNumber}
            onChange={(e) => updateField('idNumber', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Numéro de la pièce"
            required
          />
        </div>

        {/* Date d'expiration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Date d'expiration de la pièce
          </label>
          <input
            type="date"
            value={
              client.idExpiryDate instanceof Date && !isNaN(client.idExpiryDate.getTime())
                ? client.idExpiryDate.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => updateField('idExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
          />
        </div>

        {/* Adresse */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Adresse complète <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Rue, numéro, quartier..."
            required
          />
        </div>

        {/* Ville */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Ville <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.city}
            onChange={(e) => updateField('city', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Ex: Bujumbura"
            required
          />
        </div>

        {/* Pays */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pays <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={client.country}
            onChange={(e) => updateField('country', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Ex: Burundi"
            required
          />
        </div>

        {/* Code postal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Code postal
          </label>
          <input
            type="text"
            value={client.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Code postal (optionnel)"
          />
        </div>

        {/* Langue préférée */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Langue préférée
          </label>
          <select
            value={client.preferredLanguage}
            onChange={(e) => updateField('preferredLanguage', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none cursor-pointer"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        {/* Type de client */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Type de client <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={client.customerType}
            onChange={(e) => updateField('customerType', e.target.value as CustomerType)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none cursor-pointer"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Nom de l'entreprise/agence <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={client.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
              placeholder="Nom de l'entreprise ou agence"
              required
            />
          </div>
        )}

        {/* Numéro de fidélité */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Numéro de carte de fidélité
          </label>
          <input
            type="text"
            value={client.loyaltyCardNumber}
            onChange={(e) => updateField('loyaltyCardNumber', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            placeholder="Si vous en avez un"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes / Informations spéciales
          </label>
          <textarea
            value={client.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm resize-none"
            placeholder="VIP, allergies, besoins spéciaux, préférences alimentaires, etc."
          />
        </div>
      </div>
    </div>
  );
}
