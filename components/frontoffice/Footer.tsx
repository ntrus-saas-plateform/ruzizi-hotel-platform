'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      contact: 'Contact',
      quickLinks: 'Liens Rapides',
      services: 'Nos Services',
      followUs: 'Suivez-nous',
      newsletter: 'Newsletter',
      newsletterText: 'Restez informé de nos offres spéciales',
      subscribe: 'S\'abonner',
      address: 'Avenue de l\'Université, Bujumbura, Burundi',
      rights: 'Tous droits réservés',
      privacy: 'Politique de confidentialité',
      terms: 'Conditions d\'utilisation',
      home: 'Accueil',
      establishments: 'Établissements',
      booking: 'Réservation',
      about: 'À propos',
      faq: 'FAQ',
      support: 'Support',
      accommodation: 'Hébergement',
      restaurant: 'Restaurant',
      events: 'Événements',
      spa: 'Spa & Bien-être'
    },
    en: {
      contact: 'Contact',
      quickLinks: 'Quick Links',
      services: 'Our Services',
      followUs: 'Follow Us',
      newsletter: 'Newsletter',
      newsletterText: 'Stay informed about our special offers',
      subscribe: 'Subscribe',
      address: 'Avenue of the University, Bujumbura, Burundi',
      rights: 'All rights reserved',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      home: 'Home',
      establishments: 'Establishments',
      booking: 'Booking',
      about: 'About',
      faq: 'FAQ',
      support: 'Support',
      accommodation: 'Accommodation',
      restaurant: 'Restaurant',
      events: 'Events',
      spa: 'Spa & Wellness'
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand & Contact */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
                <img
                  src="/ruzizi_black.png"
                  alt="Ruzizi Hôtel"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Ruzizi Hôtel
                </h3>
                <p className="text-gray-400 text-sm">Excellence & Confort</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-300 text-sm leading-relaxed">{t.address}</p>
              </div>

              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+25769657554" className="text-gray-300 hover:text-amber-400 transition text-sm">
                  +257 69 65 75 54
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contact@ruzizihotel.com" className="text-gray-300 hover:text-amber-400 transition text-sm">
                  contact@ruzizihotel.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">{t.quickLinks}</h4>
            <ul className="space-y-3">
              {[
                { name: t.home, href: '/' },
                { name: t.establishments, href: '/establishments' },
                { name: t.booking, href: '/booking' },
                { name: t.about, href: '/about' },
                { name: t.faq, href: '/faq' },
                { name: t.support, href: '/support' }
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-amber-400 transition text-sm flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">{t.services}</h4>
            <ul className="space-y-3">
              {[
                { name: t.accommodation, icon: '🏨' },
                { name: t.restaurant, icon: '🍽️' },
                { name: t.events, icon: '🎉' },
                { name: t.spa, icon: '💆‍♀️' }
              ].map((service) => (
                <li key={service.name} className="flex items-center space-x-3">
                  <span className="text-lg">{service.icon}</span>
                  <span className="text-gray-300 text-sm">{service.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">{t.newsletter}</h4>
            <p className="text-gray-300 text-sm mb-4">{t.newsletterText}</p>

            <div className="flex mb-6">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-amber-500 text-white text-sm"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-r-lg hover:from-amber-700 hover:to-amber-800 transition text-sm font-medium">
                {t.subscribe}
              </button>
            </div>

            <div>
              <h5 className="text-sm font-semibold mb-4 text-white">{t.followUs}</h5>
              <div className="flex space-x-3">
                {[
                  { name: 'Facebook', icon: 'M18.77 7.46H15.5v-1.9c0-.9.6-1.1 1-1.1h2.2V2.5h-3c-2.8 0-4.7 2.1-4.7 5.1v1.9h-2v2h2v8h3v-8h2.5l.27-2z' },
                  { name: 'Instagram', icon: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0-2.2C8.7 0 8.3 0 7 .1 5.7.2 4.8.4 4.1.7c-.8.3-1.5.7-2.2 1.4C1.2 2.8.8 3.5.5 4.3.2 5 0 5.9 0 7.2v9.6c0 1.3.2 2.2.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.7.3 1.6.5 2.9.5h9.6c1.3 0 2.2-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.7.5-1.6.5-2.9V7.2c0-1.3-.2-2.2-.5-2.9-.3-.8-.7-1.5-1.4-2.2C20.1 1.4 19.4 1 18.6.7 17.9.4 17 .2 15.7.1 14.4 0 14 0 12 0z' },
                  { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' }
                ].map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    className="w-10 h-10 bg-gray-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition group"
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Ruzizi Hôtel. {t.rights}.
            </p>
            <div className="flex space-x-6">
              <a href="/privacy" className="text-gray-400 hover:text-amber-400 text-sm transition">
                {t.privacy}
              </a>
              <a href="/terms" className="text-gray-400 hover:text-amber-400 text-sm transition">
                {t.terms}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}