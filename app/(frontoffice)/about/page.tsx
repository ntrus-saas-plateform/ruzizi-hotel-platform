'use client';

import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">À propos de Ruzizi Hôtel</h1>
          <p className="text-xl text-blue-100">
            Découvrez notre histoire et notre engagement envers l'excellence
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Histoire</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              Ruzizi Hôtel est une chaîne hôtelière de référence au Burundi, offrant des
              hébergements de qualité et un service exceptionnel depuis de nombreuses années.
              Nos établissements sont situés dans les plus beaux endroits du Burundi à Bujumbura.
            </p>
            <p>
              Nous nous engageons à offrir à nos clients une expérience inoubliable, alliant
              confort moderne et hospitalité traditionnelle burundaise. Chaque établissement
              est conçu pour répondre aux besoins des voyageurs d'affaires et de loisirs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
            <p className="text-gray-600">
              Nous visons l'excellence dans tous les aspects de notre service
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Hospitalité</h3>
            <p className="text-gray-600">
              Un accueil chaleureux et un service personnalisé pour chaque client
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Confiance</h3>
            <p className="text-gray-600">
              Votre satisfaction et votre sécurité sont nos priorités
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Nos Valeurs</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Qualité:</strong> Nous maintenons les plus hauts standards de qualité dans tous nos services</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Innovation:</strong> Nous adoptons les dernières technologies pour améliorer votre expérience</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Durabilité:</strong> Nous nous engageons pour un tourisme responsable et durable</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Communauté:</strong> Nous contribuons au développement de nos communautés locales</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
