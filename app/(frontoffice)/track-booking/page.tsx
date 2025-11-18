'use client';

import { useState, useEffect } from 'react';
import BookingTracker from '@/components/frontoffice/BookingTracker';

export default function TrackBookingPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const handleBookingSearch = (code: string) => {
    // Ici vous pouvez ajouter la logique pour rechercher la réservation
  };

  const content = {
    fr: {
      title: "Suivre ma Réservation",
      subtitle: "Vérifiez le statut de votre réservation en temps réel",
      description: "Entrez votre code de réservation pour accéder aux détails complets de votre séjour et suivre son évolution.",
      helpTitle: "Comment trouver mon code de réservation ?",
      helpItems: [
        "Consultez l'email de confirmation que vous avez reçu après votre réservation",
        "Le code commence généralement par 'RZ-' suivi de l'année et d'un numéro",
        "Vérifiez vos SMS si vous avez fourni votre numéro de téléphone",
        "Contactez notre service client si vous ne trouvez pas votre code"
      ],
      faqTitle: "Questions Fréquentes",
      faqs: [
        {
          question: "Combien de temps avant mon arrivée puis-je modifier ma réservation ?",
          answer: "Vous pouvez modifier votre réservation jusqu'à 24h avant votre date d'arrivée, sous réserve de disponibilité."
        },
        {
          question: "Que faire si mon code de réservation ne fonctionne pas ?",
          answer: "Vérifiez que vous avez saisi le code correctement. Si le problème persiste, contactez notre service client."
        },
        {
          question: "Puis-je annuler ma réservation en ligne ?",
          answer: "Les annulations doivent être effectuées en contactant directement notre service client pour garantir le traitement approprié."
        }
      ]
    },
    en: {
      title: "Track My Booking",
      subtitle: "Check your reservation status in real time",
      description: "Enter your booking code to access complete details of your stay and track its progress.",
      helpTitle: "How to find my booking code?",
      helpItems: [
        "Check the confirmation email you received after your booking",
        "The code usually starts with 'RZ-' followed by the year and a number",
        "Check your SMS if you provided your phone number",
        "Contact our customer service if you cannot find your code"
      ],
      faqTitle: "Frequently Asked Questions",
      faqs: [
        {
          question: "How long before my arrival can I modify my reservation?",
          answer: "You can modify your reservation up to 24 hours before your arrival date, subject to availability."
        },
        {
          question: "What to do if my booking code doesn't work?",
          answer: "Check that you entered the code correctly. If the problem persists, contact our customer service."
        },
        {
          question: "Can I cancel my reservation online?",
          answer: "Cancellations must be made by contacting our customer service directly to ensure proper processing."
        }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-32">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 mb-6">{t.subtitle}</p>
          <p className="text-lg text-amber-50 max-w-2xl mx-auto">{t.description}</p>
        </div>
      </section>

      {/* Booking Tracker Component */}
      <section className="py-16">
        <BookingTracker onSearch={handleBookingSearch} />
      </section>

      {/* Help Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Help Guide */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.helpTitle}</h2>
              <div className="space-y-4">
                {t.helpItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              {/* Contact Support */}
              <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Besoin d'aide supplémentaire ?</h3>
                <p className="text-gray-600 mb-4">
                  Notre équipe de support est disponible 24h/24 pour vous aider avec votre réservation.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <a
                    href="tel:+25769657554"
                    className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Appeler maintenant
                  </a>
                  <a
                    href="mailto:contact@ruzizihotel.com"
                    className="flex items-center justify-center px-6 py-3 border-2 border-amber-600 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-colors font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Envoyer un email
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.faqTitle}</h2>
              <div className="space-y-6">
                {t.faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                      <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 leading-relaxed ml-7">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Autres Actions</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Découvrez nos autres services pour améliorer votre expérience
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <a
              href="/booking"
              className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Nouvelle Réservation</h3>
              <p className="text-gray-300">Réservez votre prochain séjour</p>
            </a>

            <a
              href="/establishments"
              className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Nos Établissements</h3>
              <p className="text-gray-300">Découvrez tous nos hôtels</p>
            </a>

            <a
              href="/contact"
              className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Support Client</h3>
              <p className="text-gray-300">Contactez notre équipe</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}