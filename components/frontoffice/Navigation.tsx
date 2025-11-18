'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const navigation = [
    { 
      name: language === 'fr' ? 'Accueil' : 'Home', 
      href: '/',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: language === 'fr' ? 'Établissements' : 'Establishments', 
      href: '/establishments',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: language === 'fr' ? 'Réserver' : 'Book', 
      href: '/booking',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: language === 'fr' ? 'Suivre ma réservation' : 'Track Booking', 
      href: '/track-booking',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-600 text-white px-4 py-2 rounded-md z-50 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        Aller au contenu principal
      </a>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-xl border-b border-amber-100' : 'bg-white/90 backdrop-blur-sm'
        }`}
        role="navigation"
        aria-label="Navigation principale"
      >
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex items-center space-x-6">
              <a
                href="tel:+25769657554"
                className="flex items-center hover:text-amber-100 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-300 rounded"
                aria-label="Appeler le +257 69 65 75 54"
              >
                <svg className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +257 69 65 75 54
              </a>
              <a
                href="mailto:contact@ruzizihotel.com"
                className="hidden sm:flex items-center hover:text-amber-100 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-300 rounded px-1 py-0.5"
                aria-label="Envoyer un email à contact@ruzizihotel.com"
              >
                <svg className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@ruzizihotel.com
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 text-xs" aria-label="Informations de service">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  24h/7j
                </span>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center hover:text-amber-100 transition-colors duration-200 font-medium px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"
                aria-label={`Changer la langue vers ${language === 'fr' ? 'Anglais' : 'Français'}`}
              >
                {language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1"
            aria-label="Aller à la page d'accueil Ruzizi Hôtel"
          >
            <div className="relative">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 p-2 border border-amber-100">
                <img
                  src="/ruzizi_black.png"
                  alt="Logo Ruzizi Hôtel"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" aria-hidden="true"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
                Ruzizi Hôtel
              </span>
              <span className="text-xs text-gray-500 -mt-1 font-medium">Excellence & Confort</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2" role="navigation" aria-label="Navigation principale desktop">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-amber-600 font-medium transition-all duration-200 relative group rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={`Aller à ${item.name}`}
              >
                {item.icon}
                <span>{item.name}</span>
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-700 group-hover:w-3/4 transition-all duration-300" aria-hidden="true"></span>
              </button>
            ))}
            <div className="ml-4 flex items-center space-x-3">
              <button
                onClick={() => router.push('/backoffice/login')}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 transition-all duration-300 shadow-lg hover:shadow-xl font-medium transform hover:scale-105 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Accéder à l'espace professionnel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{language === 'fr' ? 'Espace Pro' : 'Pro Space'}</span>
              </button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 text-gray-700 hover:text-amber-600 transition-colors duration-200 rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 touch-manipulation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden bg-white/95 backdrop-blur-md border-t border-amber-100 shadow-xl"
          id="mobile-menu"
          role="navigation"
          aria-label="Menu mobile"
        >
          <div className="px-4 py-3 space-y-1 max-h-96 overflow-y-auto">
            {navigation.map((item, index) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full text-left px-4 py-4 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all duration-200 font-medium touch-manipulation min-h-[48px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={`Aller à ${item.name}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={() => {
                router.push('/backoffice/login');
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 w-full text-left px-4 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-medium touch-manipulation min-h-[48px] focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Accéder à l'espace professionnel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{language === 'fr' ? 'Espace Pro' : 'Pro Space'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
