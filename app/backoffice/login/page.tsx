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
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-32 h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center p-4">
                            <img 
                                src="/ruzizi_black.png" 
                                alt="Ruzizi Hôtel" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-2">
                        Ruzizi Hôtel
                    </h2>
                    <p className="text-blue-100 text-lg">
                        Espace Administration
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h3>
                        <p className="text-gray-600">Accédez à votre espace de gestion</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                            ← Retour au site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
