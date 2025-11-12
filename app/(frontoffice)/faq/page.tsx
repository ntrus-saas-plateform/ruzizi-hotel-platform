'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'Comment puis-je effectuer une réservation?',
      answer: 'Vous pouvez effectuer une réservation directement sur notre site web en sélectionnant l\'établissement et l\'hébergement de votre choix, puis en remplissant le formulaire de réservation avec toutes les informations nécessaires.',
    },
    {
      question: 'Quelles sont les heures d\'arrivée et de départ?',
      answer: 'L\'heure d\'arrivée est à partir de 14h00 et l\'heure de départ est avant 12h00. Si vous avez besoin d\'un départ tardif ou d\'une arrivée anticipée, veuillez nous contacter.',
    },
    {
      question: 'Puis-je annuler ou modifier ma réservation?',
      answer: 'Oui, vous pouvez annuler ou modifier votre réservation en nous contactant au +257 69 65 75 54 ou par email à contact@ruzizihotel.com. Les conditions d\'annulation varient selon le type de réservation.',
    },
    {
      question: 'Quels modes de paiement acceptez-vous?',
      answer: 'Nous acceptons les paiements en espèces (BIF), par carte bancaire, et par virement bancaire. Le paiement peut être effectué à l\'arrivée ou en ligne lors de la réservation.',
    },
    {
      question: 'Proposez-vous un service de navette depuis l\'aéroport?',
      answer: 'Oui, nous proposons un service de navette depuis l\'aéroport international de Bujumbura. Veuillez nous informer de votre heure d\'arrivée lors de votre réservation.',
    },
    {
      question: 'Les animaux de compagnie sont-ils acceptés?',
      answer: 'Certains de nos établissements acceptent les animaux de compagnie. Veuillez nous contacter avant votre réservation pour vérifier la disponibilité et les conditions.',
    },
    {
      question: 'Y a-t-il une connexion Wi-Fi gratuite?',
      answer: 'Oui, tous nos établissements offrent une connexion Wi-Fi gratuite et haut débit dans toutes les chambres et espaces communs.',
    },
    {
      question: 'Proposez-vous des services de restauration?',
      answer: 'Oui, nos établissements disposent de restaurants proposant une cuisine locale et internationale. Le petit-déjeuner peut être inclus selon le type de réservation.',
    },
    {
      question: 'Quelles pièces d\'identité sont requises lors de l\'enregistrement?',
      answer: 'Vous devez présenter une pièce d\'identité valide (passeport, carte d\'identité nationale ou permis de conduire) lors de votre arrivée. Pour les ressortissants étrangers, un passeport est requis.',
    },
    {
      question: 'Offrez-vous des réductions pour les longs séjours?',
      answer: 'Oui, nous proposons des tarifs préférentiels pour les séjours de longue durée. Contactez-nous pour obtenir un devis personnalisé.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Questions Fréquentes (FAQ)</h1>
          <p className="text-xl text-blue-100">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex justify-between items-start text-left"
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
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
                {openIndex === index && (
                  <div className="mt-4 text-gray-600">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Vous ne trouvez pas la réponse à votre question?
          </h2>
          <p className="text-blue-800 mb-4">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 text-center"
            >
              Contactez-nous
            </a>
            <a
              href="tel:+25769657554"
              className="inline-block px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-md hover:bg-blue-50 text-center"
            >
              Appelez-nous
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
