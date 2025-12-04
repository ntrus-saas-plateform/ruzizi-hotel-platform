'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Building,
  Calendar,
  ClipboardCheck,
  Phone,
  Mail,
  Clock,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export default function Navigation({ bg = true }) {
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
    const handleKeyDown = (event: any) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
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
      icon: <Home className="w-4 h-4" />,
    },
    {
      name: language === 'fr' ? 'Établissements' : 'Establishments',
      href: '/establishments',
      icon: <Building className="w-4 h-4" />,
    },
    {
      name: language === 'fr' ? 'Chambres & Maisons de Passage' : 'Rooms & Guesthouses',
      href: '/accommodations',
      icon: <Building className="w-4 h-4" />,
    },
    {
      name: language === 'fr' ? 'Suivre ma réservation' : 'Track Booking',
      href: '/track-booking',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
  ];

  // Determine if navigation should have solid background
  const shouldShowBackground = bg ? true : scrolled;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-600 text-luxury-cream px-4 py-2 rounded-md z-50 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        Aller au contenu principal
      </a>

      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Top Bar */}
        <motion.div className="bg-gradient-luxury text-luxury-cream">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex justify-between items-center h-10 text-sm"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center space-x-6">
                <motion.a
                  href="tel:+25769657554"
                  className="flex items-center hover:text-amber-100 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-300 rounded"
                  aria-label="Appeler le +257 69 65 75 54"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Phone className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                  +257 69 65 75 54
                </motion.a>
                <motion.a
                  href="mailto:contact@ruzizihotel.com"
                  className="hidden sm:flex items-center hover:text-amber-100 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-300 rounded px-1 py-0.5"
                  aria-label="Envoyer un email à contact@ruzizihotel.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                  contact@ruzizihotel.com
                </motion.a>
              </div>
              <div className="flex items-center space-x-4">
                <motion.div
                  className="hidden sm:flex items-center space-x-3 text-xs"
                  aria-label="Informations de service"
                >
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    24h/7j
                  </span>
                </motion.div>
                <motion.button
                  onClick={toggleLanguage}
                  className="flex items-center hover:text-amber-100 transition-colors duration-200 font-medium px-2 py-1 rounded hover:bg-luxury-cream/10 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  aria-label={`Changer la langue vers ${language === 'fr' ? 'Anglais' : 'Français'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Navigation - Background changes based on bg prop or scroll */}
        <div
          className={`transition-all duration-500 ${
            shouldShowBackground
              ? 'bg-luxury-cream text-luxury-text border-b border-[hsl(var(--color-luxury-gold-light))]/50'
              : 'bg-transparent text-luxury-cream'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex justify-between items-center h-20"
            >
              <motion.button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 group rounded-lg p-1"
                aria-label="Aller à la page d'accueil Ruzizi Hôtel"
              >
                <motion.div className="relative" transition={{ duration: 0.5 }}>
                  <div className="w-14 h-14 bg-luxury-cream rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 p-2 border border-amber-100">
                    <img
                      src="/ruzizi_black.png"
                      alt="Logo Ruzizi Hôtel"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </motion.div>
                <motion.div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
                    Ruzizi Hôtel
                  </span>
                  <span
                    className={`text-xs -mt-1 font-light ${shouldShowBackground ? 'text-luxury-text' : 'text-luxury-cream'}`}
                  >
                    Excellence & Confort
                  </span>
                </motion.div>
              </motion.button>

              {/* Desktop Navigation */}
              <nav
                className="hidden lg:flex items-center gap-2"
                role="navigation"
                aria-label="Navigation principale desktop"
              >
                <motion.div className="flex items-center gap-6">
                  {navigation.map((item, index) => (
                    <motion.button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`flex items-center space-x-2 cursor-pointer hover:text-[hsl(var(--color-luxury-gold))] transition-all duration-200 relative group ${
                        shouldShowBackground ? 'text-luxury-text' : 'text-luxury-cream'
                      }`}
                      aria-label={`Aller à ${item.name}`}
                      custom={index}
                      whileHover={{
                        y: -2,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{item.name}</span>
                      {/* <motion.span
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-700 group-hover:w-3/4"
                        initial={{ width: 0 }}
                        whileHover={{ width: '75%' }}
                        transition={{ duration: 0.3 }}
                        aria-hidden="true"
                      ></motion.span> */}
                    </motion.button>
                  ))}
                </motion.div>
                <motion.div className="ml-4 flex items-center space-x-3">
                  <motion.button
                    onClick={() => router.push('/booking')}
                    className="px-6 py-2.5 bg-gradient-luxury text-luxury-cream rounded-3xl  transition-all duration-300 shadow-luxury font-medium flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label="Réserver maintenant"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{language === 'fr' ? 'Réserver' : 'Book'}</span>
                  </motion.button>
                </motion.div>
              </nav>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-3 hover:text-amber-600 transition-colors duration-200 rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 touch-manipulation ${
                  shouldShowBackground ? 'text-gray-700' : 'text-luxury-cream'
                }`}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="lg:hidden bg-luxury-cream backdrop-blur-md border-t border-amber-100 shadow-xl overflow-hidden"
              id="mobile-menu"
              role="navigation"
              aria-label="Menu mobile"
              variants={{
                closed: {
                  opacity: 0,
                  height: 0,
                  transition: {
                    duration: 0.3,
                    ease: 'easeInOut',
                  },
                },
                open: {
                  opacity: 1,
                  height: 'auto',
                  transition: {
                    duration: 0.4,
                    ease: 'easeInOut',
                  },
                },
              }}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.div
                className="px-4 py-3 space-y-1 max-h-96 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {navigation.map((item, index) => (
                  <motion.button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-4 py-4 text-[hsl(var(--color-luxury-text))]  hover:text-[hsl(var(--color-luxury-gold))] rounded-lg transition-all duration-200 font-medium touch-manipulation min-h-[48px] group"
                    aria-label={`Aller à ${item.name}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ))}
                <motion.div
                  className="border-t border-gray-200 my-2"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                ></motion.div>
                <motion.button
                  onClick={() => {
                    router.push('/booking');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full text-left px-4 py-4 bg-luxury-gold text-luxury-cream rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-medium touch-manipulation min-h-[48px] focus:outline-none focus:ring-2 focus:ring-amber-500 group"
                  aria-label="Réserver maintenant"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <span>{language === 'fr' ? 'Réserver' : 'Book'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-200 group-hover:text-luxury-cream group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
