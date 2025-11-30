'use client';

import { useState, useEffect } from 'react';
import BookingTracker from '@/components/frontoffice/BookingTracker';
import Link from 'next/link';

export default function TrackBookingPage() {
  const [language, setLanguage] = useState('fr');
  const savedLanguage = localStorage.getItem('language') || 'fr';

  useEffect(() => {
    setLanguage(savedLanguage);
  }, [savedLanguage]);

  const handleBookingSearch = (code: string) => {
    // Ici vous pouvez ajouter la logique pour rechercher la réservation
  };

  const content = {
    fr: {
      title: 'Suivre ma Réservation',
      subtitle: 'Vérifiez le statut de votre réservation en temps réel',
      description:
        'Entrez votre code de réservation pour accéder aux détails complets de votre séjour et suivre son évolution.',
      helpTitle: 'Comment trouver mon code de réservation ?',
      helpItems: [
        "Consultez l'email de confirmation que vous avez reçu après votre réservation",
        "Le code commence généralement par 'RZ-' suivi de l'année et d'un numéro",
        'Vérifiez vos SMS si vous avez fourni votre numéro de téléphone',
        'Contactez notre service client si vous ne trouvez pas votre code',
      ],
      faqTitle: 'Questions Fréquentes',
      faqs: [
        {
          question: 'Combien de temps avant mon arrivée puis-je modifier ma réservation ?',
          answer:
            "Vous pouvez modifier votre réservation jusqu'à 24h avant votre date d'arrivée, sous réserve de disponibilité.",
        },
        {
          question: 'Que faire si mon code de réservation ne fonctionne pas ?',
          answer:
            'Vérifiez que vous avez saisi le code correctement. Si le problème persiste, contactez notre service client.',
        },
        {
          question: 'Puis-je annuler ma réservation en ligne ?',
          answer:
            'Les annulations doivent être effectuées en contactant directement notre service client pour garantir le traitement approprié.',
        },
      ],
    },
    en: {
      title: 'Track My Booking',
      subtitle: 'Check your reservation status in real time',
      description:
        'Enter your booking code to access complete details of your stay and track its progress.',
      helpTitle: 'How to find my booking code?',
      helpItems: [
        'Check the confirmation email you received after your booking',
        "The code usually starts with 'RZ-' followed by the year and a number",
        'Check your SMS if you provided your phone number',
        'Contact our customer service if you cannot find your code',
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        {
          question: 'How long before my arrival can I modify my reservation?',
          answer:
            'You can modify your reservation up to 24 hours before your arrival date, subject to availability.',
        },
        {
          question: "What to do if my booking code doesn't work?",
          answer:
            'Check that you entered the code correctly. If the problem persists, contact our customer service.',
        },
        {
          question: 'Can I cancel my reservation online?',
          answer:
            'Cancellations must be made by contacting our customer service directly to ensure proper processing.',
        },
      ],
    },
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen pt-36 bg-gradient-subtle">
      {/* Booking Tracker Component */}
      <BookingTracker onSearch={handleBookingSearch} />

      {/* Help Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
            {/* Help Guide */}
            <div>
              <h2 className="text-3xl font-bold text-luxury-dark mb-8 text-center">
                {t.helpTitle}
              </h2>
              <div className="space-y-4">
                {t.helpItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-luxury rounded-full flex items-center justify-center text-luxury-cream font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-luxury-text leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              {/* Contact Support */}
              <div className="flex flex-col items-center mt-8 p-6 bg-luxury-cream rounded-xl border border-luxury-gold-light">
                <h3 className="text-lg font-bold text-luxury-dark mb-4">
                  Besoin d'aide supplémentaire ?
                </h3>
                <p className="text-luxury-text mb-4">
                  Notre équipe de support est disponible 24h/24 pour vous aider avec votre
                  réservation.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <a
                    href="tel:+25769657554"
                    className="flex items-center justify-center px-6 py-3 bg-luxury-gold text-luxury-cream rounded-2xl transition-colors font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Appeler maintenant
                  </a>
                  <a
                    href="mailto:contact@ruzizihotel.com"
                    className="flex items-center justify-center px-6 py-3 border-2 border-luxury-gold text-luxury-gold rounded-2xl transition-colors font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Envoyer un email
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-3xl font-bold text-luxury-dark mb-8 text-center">{t.faqTitle}</h2>
              <div className="space-y-4">
                {t.faqs.map((faq, index) => (
                  <div key={index} className="bg-luxury-cream rounded-xl p-6 transition-colors">
                    <h3 className="text-lg font-semibold text-luxury-dark mb-3 flex items-start">
                      <svg
                        className="w-5 h-5 text-luxury-gold mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {faq.question}
                    </h3>
                    <p className="text-luxury-text leading-relaxed ml-7">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-luxury-text text-luxury-cream ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Autres Actions</h2>
          <p className="text-luxury-cream  mb-8 max-w-2xl mx-auto">
            Découvrez nos autres services pour améliorer votre expérience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              href="/booking"
              className="group bg-[hsl(var(--color-luxury-dark))]/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-luxury-text rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-luxury-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-luxury-gold">Nouvelle Réservation</h3>
              <p className="text-luxury-cream ">Réservez votre prochain séjour</p>
            </Link>

            <Link
              href="/establishments"
              className="group bg-[hsl(var(--color-luxury-dark))]/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-luxury-text rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-luxury-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-luxury-gold">Nos Établissements</h3>
              <p className="text-luxury-cream ">Découvrez tous nos hôtels</p>
            </Link>

            <Link
              href="/contact"
              className="group bg-[hsl(var(--color-luxury-dark))]/20 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-luxury-text rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-luxury-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-luxury-gold">Support Client</h3>
              <p className="text-luxury-cream ">Contactez notre équipe</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
