'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BackOfficeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur de connexion');
      }

      if (!data.data?.tokens) {
        throw new Error('Tokens manquants');
      }

      // Stocker les tokens
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      document.cookie = `auth-token=${data.data.tokens.accessToken}; path=/; max-age=${15 * 60}`;

      if (data.data.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      window.location.href = '/admin/dashboard';
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 group rounded-lg p-1">
          <div className="relative">
            <div className="w-14 h-14 bg-luxury-cream rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 p-2 border border-amber-100">
              <img
                src="/ruzizi_black.png"
                alt="Logo Ruzizi Hôtel"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
              Ruzizi Hôtel
            </span>
            <span className={`text-xs text-center -mt-1 font-light text-luxury-text`}>
              Excellence & Confort
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-luxury p-8">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-luxury-dark mb-2">Connexion</h3>
            <p className="text-luxury-text">Accédez à votre espace de gestion</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-luxury-dark mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre.email@ruzizihotel.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-luxury-dark mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-luxury text-luxury-cream font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-luxury"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => router.push('/')}
              className="w-full text-sm text-luxury-text hover:text-luxury-gold font-medium"
            >
              ← Retour au site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
