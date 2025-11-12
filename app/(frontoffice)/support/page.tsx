'use client';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Support Client</h1>
          <p className="text-xl text-blue-100">
            Nous sommes là pour vous aider 24h/24, 7j/7
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Téléphonique</h3>
            <p className="text-gray-600 mb-4">
              Appelez-nous pour une assistance immédiate
            </p>
            <a href="tel:+25769657554" className="text-blue-600 hover:text-blue-800 font-semibold">
              +257 69 65 75 54
            </a>
            <p className="text-sm text-gray-500 mt-2">Disponible 24h/24</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Email</h3>
            <p className="text-gray-600 mb-4">
              Envoyez-nous un email, nous répondons sous 24h
            </p>
            <a href="mailto:contact@ruzizihotel.com" className="text-blue-600 hover:text-blue-800 font-semibold">
              contact@ruzizihotel.com
            </a>
            <p className="text-sm text-gray-500 mt-2">Réponse sous 24h</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">FAQ</h3>
            <p className="text-gray-600 mb-4">
              Consultez nos questions fréquentes
            </p>
            <a href="/faq" className="text-blue-600 hover:text-blue-800 font-semibold">
              Voir la FAQ
            </a>
            <p className="text-sm text-gray-500 mt-2">Réponses instantanées</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comment pouvons-nous vous aider?</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Réservations</h3>
              <p className="text-gray-600">
                Pour toute question concernant vos réservations, modifications ou annulations,
                contactez-nous par téléphone ou email.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Problèmes Techniques</h3>
              <p className="text-gray-600">
                Si vous rencontrez des problèmes avec notre site web ou l'application,
                envoyez-nous un email avec une description détaillée du problème.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Réclamations</h3>
              <p className="text-gray-600">
                Votre satisfaction est notre priorité. Pour toute réclamation, contactez-nous
                immédiatement afin que nous puissions résoudre le problème rapidement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suggestions</h3>
              <p className="text-gray-600">
                Nous apprécions vos commentaires et suggestions pour améliorer nos services.
                N'hésitez pas à nous faire part de vos idées.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Urgence?</h3>
          <p className="text-blue-800 mb-4">
            Pour les urgences pendant votre séjour, contactez la réception de votre établissement
            ou appelez notre ligne d'assistance 24h/24.
          </p>
          <a
            href="tel:+25769657554"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Assistance d'urgence
          </a>
        </div>
      </div>
    </div>
  );
}
