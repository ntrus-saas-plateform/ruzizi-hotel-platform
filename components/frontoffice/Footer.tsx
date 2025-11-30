'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Home, Utensils, Calendar, Heart, Facebook, Instagram, Twitter, HeartHandshake } from 'lucide-react';

export default function Footer() {
  const [language, setLanguage] = useState('fr');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const savedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('language') || 'fr') : 'fr';
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

  const handleSubscribe = () => {
    if (email) {
      console.log('Subscribed:', email);
      setEmail('');
    }
  };

  return (
    <footer className="bg-luxury-dark text-luxury-cream relative overflow-hidden">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand & Contact - Larger column */}
          <div className="lg:col-span-4">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-14 h-14 bg-luxury-cream rounded-xl flex items-center justify-center shadow-luxury transform hover:scale-105 transition-transform duration-300 p-2.5">
                  <img
                    src="/ruzizi_black.png"
                    alt="Ruzizi Hôtel"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
                    Ruzizi Hôtel
                  </h3>
                  <p className="text-luxury-cream text-xs tracking-wide">Excellence & Confort</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-[hsl(var(--color-luxury-text))]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--color-luxury-gold))] transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-[hsl(var(--color-luxury-gold))] group-hover:text-[#1a1a1a]" />
                </div>
                <p className="text-[hsl(var(--color-luxury-cream))] text-sm leading-relaxed pt-2">{t.address}</p>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-[hsl(var(--color-luxury-text))]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--color-luxury-gold))] transition-colors duration-300">
                  <Phone className="w-5 h-5 text-[hsl(var(--color-luxury-gold))] group-hover:text-[#1a1a1a]" />
                </div>
                <a href="tel:+25769657554" className="text-[hsl(var(--color-luxury-cream))] hover:text-[hsl(var(--color-luxury-gold))] transition-colors text-sm pt-2 font-medium">
                  +257 69 65 75 54
                </a>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-[hsl(var(--color-luxury-text))]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--color-luxury-gold))] transition-colors duration-300">
                  <Mail className="w-5 h-5 text-[hsl(var(--color-luxury-gold))] group-hover:text-[#1a1a1a]" />
                </div>
                <a href="mailto:contact@ruzizihotel.com" className="text-[hsl(var(--color-luxury-cream))] hover:text-[hsl(var(--color-luxury-gold))] transition-colors text-sm pt-2 font-medium">
                  contact@ruzizihotel.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-bold mb-6 text-[hsl(var(--color-luxury-cream))] relative inline-block">
              {t.quickLinks}
            </h4>
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
                  <Link
                    href={link.href}
                    className="text-[hsl(var(--color-luxury-cream))] hover:text-[hsl(var(--color-luxury-gold))] transition-all text-sm flex items-center group"
                  >
                    {/* <span className="w-0 group-hover:w-2 h-px bg-[hsl(var(--color-luxury-gold))] transition-all duration-300 mr-0 group-hover:mr-2"></span> */}
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h4 className="text-lg font-bold mb-6 text-[hsl(var(--color-luxury-cream))] relative inline-block">
              {t.services}
            </h4>
            <ul className="space-y-3">
              {[
                { name: t.accommodation, Icon: Home },
                { name: t.restaurant, Icon: Utensils },
                { name: t.events, Icon: Calendar },
                { name: t.spa, Icon: HeartHandshake }
              ].map((service) => (
                <li key={service.name} className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-[hsl(var(--color-luxury-text))]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--color-luxury-gold))] transition-colors duration-300">
                    <service.Icon className="w-4 h-4 text-[hsl(var(--color-luxury-gold))] group-hover:text-[#1a1a1a]" />
                  </div>
                  <span className="text-[hsl(var(--color-luxury-cream))] text-sm group-hover:text-[hsl(var(--color-luxury-gold))] transition-colors">{service.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Social */}
          <div className="lg:col-span-3">
            <h4 className="text-lg font-bold mb-6 text-[hsl(var(--color-luxury-cream))] relative inline-block">
              {t.newsletter}
            </h4>
            <p className="text-[hsl(var(--color-luxury-cream))] text-sm mb-4 leading-relaxed">{t.newsletterText}</p>

            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-3 bg-[hsl(var(--color-luxury-text))]/20 border border-[#3d3d3d] rounded-lg focus:outline-none focus:border-[hsl(var(--color-luxury-gold))] text-[hsl(var(--color-luxury-cream))] text-sm placeholder-[hsl(var(--color-luxury-cream))]/70 transition-colors"
                />
                <button 
                  onClick={handleSubscribe}
                  className="px-6 py-3 bg-gradient-luxury text-luxury-cream rounded-lg shadow-luxury transition-all duration-300 text-sm font-semibold whitespace-nowrap transform hover:scale-105">
                  {t.subscribe}
                </button>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold mb-4 text-hsl(var(--color-luxury-cream))">{t.followUs}</h5>
              <div className="flex space-x-3">
                {[
                  { name: 'Facebook', Icon: Facebook, link: '#' },
                  { name: 'Instagram', Icon: Instagram, link: '#' },
                  { name: 'Twitter', Icon: Twitter, link: '#' }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.link}
                    aria-label={social.name}
                    className="w-11 h-11 bg-[hsl(var(--color-luxury-text))]/20 hover:bg-[hsl(var(--color-luxury-gold))]  rounded-xl flex items-center justify-center transition-all duration-300 group transform hover:scale-110 hover:shadow-lg hover:shadow-[hsl(var(--color-luxury-gold))]/30"
                  >
                    <social.Icon className="w-5 h-5 text-[hsl(var(--color-luxury-cream))] group-hover:text-[hsl(var(--color-luxury-dark))] transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#2d2d2d] bg-[hsl(var(--color-luxury-text))]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <p className="text-[hsl(var(--color-luxury-cream))] text-sm">
              © {new Date().getFullYear()} Ruzizi Hôtel. {t.rights}
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-[hsl(var(--color-luxury-cream))] hover:text-[hsl(var(--color-luxury-gold))] text-sm transition-colors relative group">
                {t.privacy}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[hsl(var(--color-luxury-gold))] group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/terms" className="text-[hsl(var(--color-luxury-cream))] hover:text-[hsl(var(--color-luxury-gold))] text-sm transition-colors relative group">
                {t.terms}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-[hsl(var(--color-luxury-gold))] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}