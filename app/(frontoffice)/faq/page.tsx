'use client';

import { useState, useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [language, setLanguage] = useState('fr');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Questions Fréquentes (FAQ)",
      subtitle: "Trouvez rapidement les réponses à vos questions",
      categories: {
        all: "Toutes",
        booking: "Réservation",
        payment: "Paiement",
        services: "Services",
        policies: "Politiques"
      },
      noQuestion: "Vous ne trouvez pas la réponse à votre question?",
      noQuestionDesc: "Notre équipe est disponible pour répondre à toutes vos questions.",
      contactUs: "Contactez-nous",
      callUs: "Appelez-nous",
      faqs: [
        {
          question: 'Comment puis-je effectuer une réservation?',
          answer: 'Vous pouvez effectuer une réservation directement sur notre site web en sélectionnant l\'établissement et l\'hébergement de votre choix, puis en remplissant le formulaire de réservation avec toutes les informations nécessaires.',
          category: 'booking'
        },
        {
          question: 'Quelles sont les heures d\'arrivée et de départ?',
          answer: 'L\'heure d\'arrivée est à partir de 14h00 et l\'heure de départ est avant 12h00. Si vous avez besoin d\'un départ tardif ou d\'une arrivée anticipée, veuillez nous contacter.',
          category: 'policies'
        },
        {
          question: 'Puis-je annuler ou modifier ma réservation?',
          answer: 'Oui, vous pouvez annuler ou modifier votre réservation en nous contactant au +257 69 65 75 54 ou par email à contact@ruzizihotel.com. Les conditions d\'annulation varient selon le type de réservation.',
          category: 'booking'
        },
        {
          question: 'Quels modes de paiement acceptez-vous?',
          answer: 'Nous acceptons les paiements en espèces (BIF), par carte bancaire, et par virement bancaire. Le paiement peut être effectué à l\'arrivée ou en ligne lors de la réservation.',
          category: 'payment'
        },
        {
          question: 'Proposez-vous un service de navette depuis l\'aéroport?',
          answer: 'Oui, nous proposons un service de navette depuis l\'aéroport international de Bujumbura. Veuillez nous informer de votre heure d\'arrivée lors de votre réservation.',
          category: 'services'
        },
        {
          question: 'Les animaux de compagnie sont-ils acceptés?',
          answer: 'Certains de nos établissements acceptent les animaux de compagnie. Veuillez nous contacter avant votre réservation pour vérifier la disponibilité et les conditions.',
          category: 'policies'
        },
        {
          question: 'Y a-t-il une connexion Wi-Fi gratuite?',
          answer: 'Oui, tous nos établissements offrent une connexion Wi-Fi gratuite et haut débit dans toutes les chambres et espaces communs.',
          category: 'services'
        },
        {
          question: 'Proposez-vous des services de restauration?',
          answer: 'Oui, nos établissements disposent de restaurants proposant une cuisine locale et internationale. Le petit-déjeuner peut être inclus selon le type de réservation.',
          category: 'services'
        },
        {
          question: 'Quelles pièces d\'identité sont requises lors de l\'enregistrement?',
          answer: 'Vous devez présenter une pièce d\'identité valide (passeport, carte d\'identité nationale ou permis de conduire) lors de votre arrivée. Pour les ressortissants étrangers, un passeport est requis.',
          category: 'policies'
        },
        {
          question: 'Offrez-vous des réductions pour les longs séjours?',
          answer: 'Oui, nous proposons des tarifs préférentiels pour les séjours de longue durée. Contactez-nous pour obtenir un devis personnalisé.',
          category: 'payment'
        },
      ]
    },
    en: {
      title: "Frequently Asked Questions (FAQ)",
      subtitle: "Find answers to your questions quickly",
      categories: {
        all: "All",
        booking: "Booking",
        payment: "Payment",
        services: "Services",
        policies: "Policies"
      },
      noQuestion: "Can't find the answer to your question?",
      noQuestionDesc: "Our team is available to answer all your questions.",
      contactUs: "Contact us",
      callUs: "Call us",
      faqs: [
        {
          question: 'How can I make a reservation?',
          answer: 'You can make a reservation directly on our website by selecting the establishment and accommodation of your choice, then filling out the reservation form with all necessary information.',
          category: 'booking'
        },
        {
          question: 'What are the check-in and check-out times?',
          answer: 'Check-in time is from 2:00 PM and check-out time is before 12:00 PM. If you need a late checkout or early arrival, please contact us.',
          category: 'policies'
        },
        {
          question: 'Can I cancel or modify my reservation?',
          answer: 'Yes, you can cancel or modify your reservation by contacting us at +257 69 65 75 54 or by email at contact@ruzizihotel.com. Cancellation conditions vary depending on the type of reservation.',
          category: 'booking'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept cash payments (BIF), credit cards, and bank transfers. Payment can be made upon arrival or online during booking.',
          category: 'payment'
        },
        {
          question: 'Do you offer airport shuttle service?',
          answer: 'Yes, we offer shuttle service from Bujumbura International Airport. Please inform us of your arrival time when making your reservation.',
          category: 'services'
        },
        {
          question: 'Are pets allowed?',
          answer: 'Some of our establishments accept pets. Please contact us before your reservation to check availability and conditions.',
          category: 'policies'
        },
        {
          question: 'Is there free Wi-Fi?',
          answer: 'Yes, all our establishments offer free high-speed Wi-Fi in all rooms and common areas.',
          category: 'services'
        },
        {
          question: 'Do you offer dining services?',
          answer: 'Yes, our establishments have restaurants offering local and international cuisine. Breakfast may be included depending on the type of reservation.',
          category: 'services'
        },
        {
          question: 'What identification is required during check-in?',
          answer: 'You must present valid identification (passport, national ID card, or driver\'s license) upon arrival. For foreign nationals, a passport is required.',
          category: 'policies'
        },
        {
          question: 'Do you offer discounts for long stays?',
          answer: 'Yes, we offer preferential rates for long-term stays. Contact us for a personalized quote.',
          category: 'payment'
        },
      ]
    }
  };

  const t = content[language as keyof typeof content];

  const filteredFaqs = selectedCategory === 'all' 
    ? t.faqs 
    : t.faqs.filter(faq => faq.category === selectedCategory);

  const categoryIcons: Record<string, string> = {
    booking: "📅",
    payment: "💳",
    services: "🛎️",
    policies: "📋"
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(t.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {key !== 'all' && categoryIcons[key]} {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex justify-between items-start text-left group"
                >
                  <div className="flex items-start flex-1 pr-4">
                    <span className="text-2xl mr-4 flex-shrink-0">{categoryIcons[faq.category]}</span>
                    <span className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index 
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 rotate-180' 
                      : 'bg-gray-200 group-hover:bg-amber-100'
                  }`}>
                    <svg
                      className={`w-5 h-5 transition-colors ${
                        openIndex === index ? 'text-white' : 'text-gray-600 group-hover:text-amber-600'
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
                  </div>
                </button>
                {openIndex === index && (
                  <div className="mt-4 ml-14 text-gray-700 leading-relaxed animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.noQuestion}
            </h2>
            <p className="text-gray-700 text-lg">
              {t.noQuestionDesc}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.contactUs}
            </a>
            <a
              href="tel:+25769657554"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-amber-600 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t.callUs}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
