'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/public/establishments');
      const data = await response.json();
      if (data.success) {
        setEstablishments(data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Bienvenue à Ruzizi Hôtel</h1>
            <p className="text-xl mb-8 text-blue-100">
              Découvrez le confort et l'hospitalité au cœur du Burundi
            </p>
            <button
              onClick={() => router.push('/establishments')}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Réserver maintenant
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Histoire</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Ruzizi Hôtel est une chaîne hôtelière de référence au Burundi, offrant des
              hébergements de qualité et un service exceptionnel depuis de nombreuses années.
            </p>
          </div>
        </div>
      </section>

      {/* Establishments Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Nos Établissements
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {establishments.slice(0, 6).map((establishment) => (
                <div
                  key={establishment.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                  onClick={() => router.push(`/establishments/${establishment.id}`)}
                >
                  {establishment.images?.[0] && (
                    <img
                      src={establishment.images[0]}
                      alt={establishment.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {establishment.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {establishment.location.city}, {establishment.location.country}
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Voir les détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {establishments.length > 6 && (
            <div className="text-center mt-8">
              <button
                onClick={() => router.push('/establishments')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Voir tous les établissements
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Pourquoi choisir Ruzizi Hôtel ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Confort Premium</h3>
              <p className="text-gray-600">
                Chambres spacieuses et bien équipées pour votre confort
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Excellent</h3>
              <p className="text-gray-600">Personnel attentif et professionnel à votre service</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Emplacements Stratégiques
              </h3>
              <p className="text-gray-600">Situés dans les meilleures zones du Burundi</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à réserver votre séjour ?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Découvrez nos offres et réservez dès maintenant
          </p>
          <button
            onClick={() => router.push('/establishments')}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Voir les disponibilités
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Ruzizi Hôtel</h3>
              <p className="text-gray-400">
                Votre destination de choix pour un séjour inoubliable au Burundi
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/establishments')}
                    className="text-gray-400 hover:text-white"
                  >
                    Nos établissements
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/track-booking')}
                    className="text-gray-400 hover:text-white"
                  >
                    Suivre ma réservation
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">Email: contact@ruzizihotel.bi</p>
              <p className="text-gray-400">Tél: +257 XX XX XX XX</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Ruzizi Hôtel. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
