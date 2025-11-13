'use client';

import { useState, useEffect } from 'react';

export default function SupportPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Support Client",
      subtitle: "Nous sommes là pour vous aider 24h/24, 7j/7",
      phoneSupport: "Support Téléphonique",
      phoneSupportDesc: "Appelez-nous pour une assistance immédiate",
      available247: "Disponible 24h/24",
      emailSupport: "Support Email",
      emailSupportDesc: "Envoyez-nous un email, nous répondons sous 24h",
      responseTime: "Réponse sous 24h",
      faq: "FAQ",
      faqDesc: "Consultez nos questions fréquentes",
      instantAnswers: "Réponses instantanées",
      viewFaq: "Voir la FAQ",
      howCanWeHelp: "Comment pouvons-nous vous aider?",
      bookings: "Réservations",
      bookingsDesc: "Pour toute question concernant vos réservations, modifications ou annulations, contactez-nous par téléphone ou email.",
      technicalIssues: "Problèmes Techniques",
      technicalIssuesDesc: "Si vous rencontrez des problèmes avec notre site web ou l'application, envoyez-nous un email avec une description détaillée du problème.",
      complaints: "Réclamations",
      complaintsDesc: "Votre satisfaction est notre priorité. Pour toute réclamation, contactez-nous immédiatement afin que nous puissions résoudre le problème rapidement.",
      suggestions: "Suggestions",
      suggestionsDesc: "Nous apprécions vos commentaires et suggestions pour améliorer nos services. N'hésitez pas à nous faire part de vos idées.",
      emergency: "Urgence?",
      emergencyDesc: "Pour les urgences pendant votre séjour, contactez la réception de votre établissement ou appelez notre ligne d'assistance 24h/24.",
      emergencyAssistance: "Assistance d'urgence"
    },
    en: {
      title: "Customer Support",
      subtitle: "We're here to help you 24/7",
      phoneSupport: "Phone Support",
      phoneSupportDesc: "Call us for immediate assistance",
      available247: "Available 24/7",
      emailSupport: "Email Support",
      emailSupportDesc: "Send us an email, we respond within 24h",
      responseTime: "Response within 24h",
      faq: "FAQ",
      faqDesc: "Check our frequently asked questions",
      instantAnswers: "Instant answers",
      viewFaq: "View FAQ",
      howCanWeHelp: "How can we help you?",
      bookings: "Bookings",
      bookingsDesc: "For any questions regarding your bookings, modifications or cancellations, contact us by phone or email.",
      technicalIssues: "Technical Issues",
      technicalIssuesDesc: "If you encounter problems with our website or application, send us an email with a detailed description of the problem.",
      complaints: "Complaints",
      complaintsDesc: "Your satisfaction is our priority. For any complaints, contact us immediately so we can resolve the issue quickly.",
      suggestions: "Suggestions",
      suggestionsDesc: "We appreciate your feedback and suggestions to improve our services. Feel free to share your ideas with us.",
      emergency: "Emergency?",
      emergencyDesc: "For emergencies during your stay, contact your establishment's reception or call our 24/7 assistance line.",
      emergencyAssistance: "Emergency assistance"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <a
            href="tel:+25769657554"
            className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.phoneSupport}</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">{t.phoneSupportDesc}</p>
            <p className="text-green-700 font-bold text-lg">+257 69 65 75 54</p>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.available247}
            </p>
          </a>

          <a
            href="mailto:contact@ruzizihotel.com"
            className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.emailSupport}</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">{t.emailSupportDesc}</p>
            <p className="text-blue-700 font-bold text-lg break-all">contact@ruzizihotel.com</p>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.responseTime}
            </p>
          </a>

          <a
            href="/faq"
            className="group bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-8 hover:from-purple-100 hover:to-pink-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.faq}</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">{t.faqDesc}</p>
            <p className="text-purple-700 font-bold text-lg">{t.viewFaq}</p>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t.instantAnswers}
            </p>
          </a>
        </div>

        {/* Help Topics */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12 mb-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t.howCanWeHelp}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.bookings}</h3>
                  <p className="text-gray-700 leading-relaxed">{t.bookingsDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.technicalIssues}</h3>
                  <p className="text-gray-700 leading-relaxed">{t.technicalIssuesDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl hover:from-red-100 hover:to-pink-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.complaints}</h3>
                  <p className="text-gray-700 leading-relaxed">{t.complaintsDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.suggestions}</h3>
                  <p className="text-gray-700 leading-relaxed">{t.suggestionsDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency CTA */}
        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-red-100 border-2 border-red-200 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-4 animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.emergency}</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                {t.emergencyDesc}
              </p>
            </div>
            <a
              href="tel:+25769657554"
              className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t.emergencyAssistance}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
