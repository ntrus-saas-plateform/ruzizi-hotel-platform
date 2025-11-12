'use client';

import { useState, useEffect } from 'react';
import ContactForm from '@/components/frontoffice/ContactForm';
import MapSection from '@/components/frontoffice/MapSection';

export default function ContactPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const handleContactSubmit = (data: any) => {
    console.log('Contact form submitted:', data);
    // Ici vous pouvez ajouter la logique pour envoyer les données à votre API
  };

  const content = {
    fr: {
      title: "Contactez-nous",
      subtitle: "Nous sommes là pour vous accompagner",
      description: "Notre équipe dédiée est à votre disposition pour répondre à toutes vos questions et vous aider à planifier votre séjour parfait.",
      quickContact: "Contact Rapide",
      quickContactDesc: "Besoin d'une réponse immédiate ?",
      callNow: "Appelez maintenant",
      sendEmail: "Envoyer un email",
      visitUs: "Nous rendre visite",
      whyChoose: "Pourquoi nous choisir ?",
      reasons: [
        {
          title: "Réponse Rapide",
          description: "Nous répondons à vos messages dans les 2 heures",
          icon: "⚡"
        },
        {
          title: "Support 24/7",
          description: "Notre équipe est disponible jour et nuit",
          icon: "🕐"
        },
        {
          title: "Expertise Locale",
          description: "Connaissance approfondie du Burundi",
          icon: "🎯"
        },
        {
          title: "Service Personnalisé",
          description: "Solutions adaptées à vos besoins spécifiques",
          icon: "👥"
        }
      ]
    },
    en: {
      title: "Contact Us",
      subtitle: "We're here to assist you",
      description: "Our dedicated team is at your disposal to answer all your questions and help you plan your perfect stay.",
      quickContact: "Quick Contact",
      quickContactDesc: "Need an immediate response?",
      callNow: "Call now",
      sendEmail: "Send email",
      visitUs: "Visit us",
      whyChoose: "Why choose us?",
      reasons: [
        {
          title: "Quick Response",
          description: "We respond to your messages within 2 hours",
          icon: "⚡"
        },
        {
          title: "24/7 Support",
          description: "Our team is available day and night",
          icon: "🕐"
        },
        {
          title: "Local Expertise",
          description: "In-depth knowledge of Burundi",
          icon: "🎯"
        },
        {
          title: "Personalized Service",
          description: "Solutions tailored to your specific needs",
          icon: "👥"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 mb-6">{t.subtitle}</p>
          <p className="text-lg text-amber-50 max-w-2xl mx-auto">{t.description}</p>
        </div>
      </section>

      {/* Quick Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.quickContact}</h2>
            <p className="text-lg text-gray-600">{t.quickContactDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Phone */}
            <a
              href="tel:+25769657554"
              className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 text-center hover:from-green-100 hover:to-emerald-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.callNow}</h3>
              <p className="text-green-700 font-semibold">+257 69 65 75 54</p>
              <p className="text-gray-600 text-sm mt-2">Disponible 24h/24</p>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@ruzizihotel.com"
              className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.sendEmail}</h3>
              <p className="text-blue-700 font-semibold">contact@ruzizihotel.com</p>
              <p className="text-gray-600 text-sm mt-2">Réponse sous 2h</p>
            </a>

            {/* Location */}
            <div className="group bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-8 text-center hover:from-amber-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.visitUs}</h3>
              <p className="text-amber-700 font-semibold">Avenue de l'Indépendance</p>
              <p className="text-gray-600 text-sm mt-2">Bujumbura, Burundi</p>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.whyChoose}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.reasons.map((reason, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="text-4xl mb-4">{reason.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reason.title}</h3>
                  <p className="text-gray-600 text-sm">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <ContactForm onSubmit={handleContactSubmit} />

      {/* Map Section */}
      <MapSection />
    </div>
  );
}