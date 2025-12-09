'use client';

import { useState, useEffect } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [language, setLanguage] = useState('fr');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const content = {
    fr: {
      title: 'Questions Fréquemment Posées',
      subtitle: 'Trouvez rapidement les réponses à vos questions',
      description:
        'Consultez notre FAQ pour obtenir des réponses aux questions les plus courantes concernant nos services, réservations et politiques.',
      categories: {
        booking: 'Réservations',
        payment: 'Paiement',
        stay: 'Séjour',
        policies: 'Politiques',
      },
      faqs: {
        booking: [
          {
            id: 'booking-1',
            question: 'Comment effectuer une réservation?',
            answer:
              "Vous pouvez effectuer une réservation directement sur notre site web en sélectionnant vos dates, le nombre de voyageurs et l'hébergement souhaité. Le processus est simple et sécurisé.",
          },
          {
            id: 'booking-2',
            question: 'Puis-je modifier ou annuler ma réservation?',
            answer:
              "Oui, vous pouvez modifier ou annuler votre réservation jusqu'à 24h avant la date d'arrivée. Contactez-nous par téléphone ou email pour effectuer ces changements.",
          },
          {
            id: 'booking-3',
            question: 'Y a-t-il une caution requise?',
            answer:
              "Une caution peut être demandée selon le type d'hébergement et la durée du séjour. Cette information vous sera communiquée lors de la réservation.",
          },
          {
            id: 'booking-4',
            question: 'Quels documents dois-je apporter?',
            answer:
              "Veuillez apporter une pièce d'identité valide (passeport ou carte d'identité nationale) et votre confirmation de réservation. Pour les mineurs, des documents supplémentaires peuvent être requis.",
          },
        ],
        payment: [
          {
            id: 'payment-1',
            question: 'Quels modes de paiement acceptez-vous?',
            answer:
              "Nous acceptons les cartes de crédit (Visa, MasterCard), les virements bancaires et le paiement en espèces à l'arrivée. Les paiements en ligne sont sécurisés.",
          },
          {
            id: 'payment-2',
            question: 'Quand suis-je débité?',
            answer:
              "Pour les réservations en ligne, un acompte peut être demandé à la confirmation. Le solde est généralement payé à l'arrivée à l'établissement.",
          },
          {
            id: 'payment-3',
            question: 'Proposez-vous des tarifs préférentiels?',
            answer:
              'Oui, nous proposons des tarifs préférentiels pour les séjours prolongés, les groupes et nos clients fidèles. Contactez-nous pour obtenir un devis personnalisé.',
          },
        ],
        stay: [
          {
            id: 'stay-1',
            question: "Quelles sont les heures d'arrivée et de départ?",
            answer:
              "L'arrivée se fait généralement à partir de 14h00 et le départ avant 12h00. Cependant, nous pouvons arranger des horaires flexibles selon vos besoins.",
          },
          {
            id: 'stay-2',
            question: 'Le petit-déjeuner est-il inclus?',
            answer:
              "Le petit-déjeuner est inclus dans la plupart de nos tarifs. Les détails sont précisés lors de la réservation selon l'établissement choisi.",
          },
          {
            id: 'stay-3',
            question: 'Y a-t-il un parking disponible?',
            answer:
              "La plupart de nos établissements disposent d'un parking sécurisé. Cette information est disponible sur la page de chaque établissement.",
          },
          {
            id: 'stay-4',
            question: 'Puis-je amener des animaux de compagnie?',
            answer:
              "Les animaux de compagnie sont acceptés dans certains de nos établissements. Veuillez nous contacter à l'avance pour confirmer la disponibilité.",
          },
        ],
        policies: [
          {
            id: 'policies-1',
            question: 'Quelle est votre politique de confidentialité?',
            answer:
              'Nous respectons votre vie privée et protégeons vos données personnelles. Consultez notre politique de confidentialité pour plus de détails.',
          },
          {
            id: 'policies-2',
            question: 'Acceptez-vous les enfants?',
            answer:
              "Oui, nous accueillons les enfants. Des lits supplémentaires peuvent être disponibles selon l'hébergement choisi.",
          },
          {
            id: 'policies-3',
            question: "Y a-t-il des restrictions d'âge?",
            answer:
              "Il n'y a pas de restrictions d'âge générales, mais certains établissements peuvent avoir des politiques spécifiques pour les mineurs non accompagnés.",
          },
          {
            id: 'policies-4',
            question: "Que faire en cas d'urgence?",
            answer:
              "En cas d'urgence pendant votre séjour, contactez immédiatement la réception de votre établissement ou appelez notre ligne d'urgence 24h/24.",
          },
        ],
      },
      contactUs: "Vous n'avez pas trouvé la réponse à votre question?",
      contactDesc: 'Notre équipe est là pour vous aider. Contactez-nous directement.',
      contactButton: 'Nous contacter',
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to your questions quickly',
      description:
        'Check our FAQ to get answers to the most common questions about our services, bookings, and policies.',
      categories: {
        booking: 'Bookings',
        payment: 'Payment',
        stay: 'Stay',
        policies: 'Policies',
      },
      faqs: {
        booking: [
          {
            id: 'booking-1',
            question: 'How do I make a reservation?',
            answer:
              'You can make a reservation directly on our website by selecting your dates, number of travelers, and desired accommodation. The process is simple and secure.',
          },
          {
            id: 'booking-2',
            question: 'Can I modify or cancel my reservation?',
            answer:
              'Yes, you can modify or cancel your reservation up to 24 hours before the arrival date. Contact us by phone or email to make these changes.',
          },
          {
            id: 'booking-3',
            question: 'Is a deposit required?',
            answer:
              'A deposit may be required depending on the type of accommodation and length of stay. This information will be communicated to you during the booking process.',
          },
          {
            id: 'booking-4',
            question: 'What documents should I bring?',
            answer:
              'Please bring a valid ID (passport or national ID card) and your booking confirmation. Additional documents may be required for minors.',
          },
        ],
        payment: [
          {
            id: 'payment-1',
            question: 'What payment methods do you accept?',
            answer:
              'We accept credit cards (Visa, MasterCard), bank transfers, and cash payment upon arrival. Online payments are secure.',
          },
          {
            id: 'payment-2',
            question: 'When am I charged?',
            answer:
              'For online reservations, a deposit may be requested upon confirmation. The balance is usually paid upon arrival at the establishment.',
          },
          {
            id: 'payment-3',
            question: 'Do you offer preferential rates?',
            answer:
              'Yes, we offer preferential rates for extended stays, groups, and loyal customers. Contact us for a personalized quote.',
          },
        ],
        stay: [
          {
            id: 'stay-1',
            question: 'What are the check-in and check-out times?',
            answer:
              'Check-in is generally from 2:00 PM and check-out before 12:00 PM. However, we can arrange flexible schedules according to your needs.',
          },
          {
            id: 'stay-2',
            question: 'Is breakfast included?',
            answer:
              'Breakfast is included in most of our rates. Details are specified during booking according to the chosen establishment.',
          },
          {
            id: 'stay-3',
            question: 'Is parking available?',
            answer:
              "Most of our establishments have secure parking. This information is available on each establishment's page.",
          },
          {
            id: 'stay-4',
            question: 'Can I bring pets?',
            answer:
              'Pets are accepted in some of our establishments. Please contact us in advance to confirm availability.',
          },
        ],
        policies: [
          {
            id: 'policies-1',
            question: 'What is your privacy policy?',
            answer:
              'We respect your privacy and protect your personal data. Check our privacy policy for more details.',
          },
          {
            id: 'policies-2',
            question: 'Do you accept children?',
            answer:
              'Yes, we welcome children. Extra beds may be available depending on the chosen accommodation.',
          },
          {
            id: 'policies-3',
            question: 'Are there age restrictions?',
            answer:
              'There are no general age restrictions, but some establishments may have specific policies for unaccompanied minors.',
          },
          {
            id: 'policies-4',
            question: 'What to do in case of emergency?',
            answer:
              "In case of emergency during your stay, immediately contact your establishment's reception or call our 24/7 emergency line.",
          },
        ],
      },
      contactUs: "Didn't find the answer to your question?",
      contactDesc: 'Our team is here to help you. Contact us directly.',
      contactButton: 'Contact Us',
    },
  };

  const t = content[language as keyof typeof content];

  const categories = [
    { key: 'booking', label: t.categories.booking, icon: '📅' },
    { key: 'payment', label: t.categories.payment, icon: '💳' },
    { key: 'stay', label: t.categories.stay, icon: '🏨' },
    { key: 'policies', label: t.categories.policies, icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle pt-32">
      {/* Hero Section */}
      <section className="pt-14 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-luxury-dark">{t.title}</h1>
          <p className="text-xl text-luxury-text max-w-2xl mx-auto">{t.subtitle}</p>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-luxury-cream rounded-full mt-6">
            <svg
              className="w-8 h-8 text-luxury-text"
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
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center mb-12">
            <p className="text-lg text-luxury-text max-w-2xl mx-auto">{t.description}</p>
          </div>

          {/* FAQ Categories */}
          {categories.map((category) => (
            <div key={category.key} className="mb-12">
              <div className="flex items-center justify-center mb-6">
                {/* <span className="text-3xl mr-3">{category.icon}</span> */}
                <h2 className="text-3xl font-bold text-luxury-dark">{category.label}</h2>
              </div>

              <div className="space-y-4">
                {t.faqs[category.key as keyof typeof t.faqs].map((faq: FAQItem) => (
                  <div key={faq.id} className="bg-luxury-cream rounded-xl overflow-hidden border border-[hsl(var(--color-luxury-text))]/4">
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between  transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-luxury-dark pr-4">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-luxury-gold transform transition-transform flex-shrink-0 ${
                          openItems.has(faq.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {openItems.has(faq.id) && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-[hsl(var(--color-luxury-text))]/10 pt-4">
                          <p className="text-luxury-text leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Contact Section */}
        <div className="mt-16 bg-luxury-text rounded-2xl p-8 shadow-luxury text-center">
          <div className="w-16 h-16 bg-[hsl(var(--color-luxury-cream))]/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-luxury-cream"
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
          </div>
          <h3 className="text-2xl font-bold text-luxury-cream mb-4">{t.contactUs}</h3>
          <p className="text-luxury-cream mb-6 max-w-md mx-auto">{t.contactDesc}</p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {t.contactButton}
          </a>
        </div>
      </div>
    </div>
  );
}
