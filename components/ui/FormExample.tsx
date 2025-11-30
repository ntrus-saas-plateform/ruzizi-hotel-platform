'use client';

import React, { useState } from 'react';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';

/**
 * Composant d'exemple montrant l'utilisation des nouveaux composants de formulaire
 * Ce composant peut être utilisé comme référence pour créer des formulaires
 */
export default function FormExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-luxury-dark mb-6">
          Exemple de Formulaire Amélioré
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input avec label et icône */}
          <Input
            label="Nom complet"
            type="text"
            placeholder="Entrez votre nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
            helperText="Votre nom tel qu'il apparaîtra sur les documents"
          />

          {/* Input email avec validation */}
          <Input
            label="Adresse email"
            type="email"
            placeholder="exemple@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            error={errors.email}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          {/* Input téléphone */}
          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="+257 XX XX XX XX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            }
          />

          {/* Select avec options */}
          <Select
            label="Pays"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
            options={[
              { value: '', label: 'Sélectionnez un pays' },
              { value: 'BI', label: 'Burundi' },
              { value: 'RW', label: 'Rwanda' },
              { value: 'CD', label: 'RD Congo' },
              { value: 'TZ', label: 'Tanzanie' },
              { value: 'UG', label: 'Ouganda' },
              { value: 'KE', label: 'Kenya' },
            ]}
          />

          {/* Textarea */}
          <Textarea
            label="Message"
            placeholder="Écrivez votre message ici..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={5}
            helperText="Minimum 10 caractères"
          />

          {/* Variantes d'inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-luxury-dark">Variantes disponibles</h3>

            <Input
              label="Variante Default"
              type="text"
              placeholder="Style par défaut"
              variant="default"
            />

            <Input
              label="Variante Filled"
              type="text"
              placeholder="Style rempli"
              variant="filled"
            />

            <Input
              label="Variante Outlined"
              type="text"
              placeholder="Style contour"
              variant="outlined"
            />
          </div>

          {/* Tailles d'inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-luxury-dark">Tailles disponibles</h3>

            <Input
              label="Petite taille (sm)"
              type="text"
              placeholder="Input petit"
              inputSize="sm"
            />

            <Input
              label="Taille moyenne (md)"
              type="text"
              placeholder="Input moyen"
              inputSize="md"
            />

            <Input
              label="Grande taille (lg)"
              type="text"
              placeholder="Input grand"
              inputSize="lg"
            />
          </div>

          {/* États spéciaux */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-luxury-dark">États spéciaux</h3>

            <Input
              label="Input avec erreur"
              type="text"
              placeholder="Cet input a une erreur"
              error="Ce champ est requis"
            />

            <Input
              label="Input désactivé"
              type="text"
              placeholder="Cet input est désactivé"
              disabled
              value="Valeur désactivée"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-amber-500 text-luxury-cream font-semibold py-3 px-6 rounded-lg hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-amber-500/20"
            >
              Soumettre
            </button>
            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      {/* Guide d'utilisation */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">
          📚 Guide d'utilisation
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Import:</strong>{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              import {'{ Input, Textarea, Select }'} from '@/components/ui';
            </code>
          </p>
          <p>
            <strong>Props disponibles:</strong> label, error, helperText, leftIcon, rightIcon,
            variant, inputSize/textareaSize/selectSize
          </p>
          <p>
            <strong>Variantes:</strong> default, filled, outlined
          </p>
          <p>
            <strong>Tailles:</strong> sm, md, lg
          </p>
        </div>
      </div>
    </div>
  );
}
