'use client';

import { useState, useEffect } from 'react';
import ContactForm from '@/components/frontoffice/ContactForm';

export default function ContactPage() {
  const [language, setLanguage] = useState('fr');
  const savedLanguage = localStorage.getItem('language') || 'fr';

  useEffect(() => {
    setLanguage(savedLanguage);
  }, [savedLanguage]);

  const content = {
    fr: {
      title: 'Contactez-nous',
      subtitle: 'Nous sommes là pour vous aider',
      description:
        "Notre équipe est disponible pour répondre à toutes vos questions concernant vos réservations, nos services ou toute autre demande. N'hésitez pas à nous contacter par téléphone, email ou via le formulaire ci-dessous.",
      contactInfo: 'Informations de contact',
      phone: 'Téléphone',
      email: 'Email',
      address: 'Adresse',
      businessHours: "Heures d'ouverture",
      mondayFriday: 'Lundi - Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
      emergency: 'Urgences 24/7',
      responseTime: 'Nous répondons généralement sous 24h',
      location: 'Bujumbura, Burundi',
    },
    en: {
      title: 'Contact Us',
      subtitle: "We're here to help you",
      description:
        'Our team is available to answer all your questions about reservations, our services, or any other request. Feel free to contact us by phone, email, or through the form below.',
      contactInfo: 'Contact Information',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      businessHours: 'Business Hours',
      mondayFriday: 'Monday - Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      emergency: '24/7 Emergency',
      responseTime: 'We usually respond within 24 hours',
      location: 'Bujumbura, Burundi',
    },
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen pt-48">
      {/* Hero Section */}
      {/* <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-xl text-luxury-text">{t.subtitle}</p>
      </div> */}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-4xl font-bold text-luxury-dark mb-4">{t.contactInfo}</h2>
              <p className="text-lg text-luxury-text leading-relaxed lg:px-20">{t.description}</p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Phone */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-200 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-luxury-dark mb-1">{t.phone}</h3>
                    <a
                      href="tel:+25769657554"
                      className="text-lg text-green-700 hover:text-green-800 font-semibold transition-colors"
                    >
                      +257 69 65 75 54
                    </a>
                    <p className="text-sm text-luxury-text mt-1">{t.emergency}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-blue-200 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-luxury-dark mb-1">{t.email}</h3>
                    <a
                      href="mailto:contact@ruzizihotel.com"
                      className="text-lg text-blue-700  font-semibold transition-colors"
                    >
                      contact@ruzizihotel.com
                    </a>
                    <p className="text-sm text-luxury-text mt-1">{t.responseTime}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-200 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
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
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-luxury-dark mb-1">{t.address}</h3>
                    <p className="text-lg text-purple-700 font-semibold">{t.location}</p>
                    <p className="text-sm text-luxury-text mt-1 m-0">Centre-ville, Bujumbura</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-luxury-cream  rounded-2xl p-6 border border-luxury-gold-light">
              <h3 className="text-xl font-bold text-luxury-dark mb-4 flex items-center">
                <svg
                  className="w-5 h-5 text-luxury-gold0 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t.businessHours}
              </h3>
              <div className="space-y-2 text-luxury-text">
                <div className="flex justify-between">
                  <span>{t.mondayFriday}:</span>
                  <span className="font-semibold">8h00 - 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.saturday}:</span>
                  <span className="font-semibold">9h00 - 16h00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.sunday}:</span>
                  <span className="font-semibold">{t.emergency.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContactForm title={''} subtitle={''} />
    </div>
  );
}
