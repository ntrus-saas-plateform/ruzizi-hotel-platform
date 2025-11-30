'use client';

import { Bell, Settings, Settings2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState({
    siteName: 'Ruzizi Hôtel',
    siteEmail: 'contact@ruzizihotel.com',
    sitePhone: '+257 69 65 75 54',
    currency: 'BIF',
    timezone: 'Africa/Bujumbura',
    language: 'fr',
    bookingConfirmation: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Paramètres enregistrés avec succès');
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'advanced', label: 'Avancé', icon: Settings2 },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-luxury-dark">Paramètres</h1>
        <p className="text-luxury-text mt-2">Gérer les paramètres de l'application</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card-luxury border border-amber-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-luxury-text hover:text-luxury-dark'
                }`}
              >
                <tab.icon className="size-4"/>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du site
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={settings.siteEmail}
                    onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={settings.sitePhone}
                    onChange={(e) => setSettings({ ...settings, sitePhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Devise
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BIF">Franc Burundais (BIF)</option>
                    <option value="USD">Dollar US (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fuseau horaire
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Africa/Bujumbura">Bujumbura (CAT)</option>
                    <option value="Africa/Nairobi">Nairobi (EAT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-luxury-cream rounded-lg">
                <div>
                  <h3 className="font-semibold text-luxury-dark">Confirmation de réservation</h3>
                  <p className="text-sm text-luxury-text">Envoyer un email de confirmation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bookingConfirmation}
                    onChange={(e) => setSettings({ ...settings, bookingConfirmation: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luxury-gold"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-luxury-cream rounded-lg">
                <div>
                  <h3 className="font-semibold text-luxury-dark">Notifications par email</h3>
                  <p className="text-sm text-luxury-text">Recevoir les notifications importantes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luxury-gold"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-luxury-cream rounded-lg">
                <div>
                  <h3 className="font-semibold text-luxury-dark">Notifications SMS</h3>
                  <p className="text-sm text-luxury-text">Recevoir des SMS pour les alertes urgentes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luxury-gold"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-4 bg-luxury-cream border border-amber-100 rounded-lg">
                <h3 className="font-semibold text-luxury-gold mb-2 flex items-center"><Lock className="size-4 mr-2"/> Sécurité du compte</h3>
                <p className="text-sm text-luxury-text">
                  Configurez les paramètres de sécurité pour protéger votre compte
                </p>
              </div>

              <div>
                <button className="w-full md:w-auto px-6 py-3 bg-[hsl(var(--color-luxury-text))]/20 text-luxury-dark rounded-lg hover:bg-[hsl(var(--color-luxury-text))]/40 font-medium">
                  Changer le mot de passe
                </button>
              </div>

              <div>
                <button className="w-full md:w-auto px-6 py-3 bg-[hsl(var(--color-luxury-text))]/20 text-luxury-dark rounded-lg hover:bg-[hsl(var(--color-luxury-text))]/40 font-medium">
                  Activer l'authentification à deux facteurs
                </button>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-luxury-cream border border-amber-100 rounded-lg">
                <div>
                  <h3 className="font-semibold text-luxury-gold">Mode maintenance</h3>
                  <p className="text-sm text-luxury-text">Désactiver temporairement le site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>

              <div className="p-4 bg-luxury-cream rounded-lg">
                <h3 className="font-semibold text-luxury-dark mb-2">Sauvegarde des données</h3>
                <p className="text-sm text-luxury-text mb-4">Dernière sauvegarde: Il y a 2 heures</p>
                <button className="px-6 py-2 bg-luxury-gold text-luxury-cream rounded-lg ">
                  Créer une sauvegarde
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-luxury-gold text-luxury-cream rounded-lg  disabled:opacity-50 font-medium"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
