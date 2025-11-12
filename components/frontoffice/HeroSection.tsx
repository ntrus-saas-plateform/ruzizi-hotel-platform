'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();
  const [language, setLanguage] = useState('fr');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Bienvenue au Ruzizi Hôtel",
      subtitle: "Excellence & Confort au Cœur de Bujumbura",
      description: "Découvrez l'hospitalité burundaise dans un cadre moderne et élégant. Notre hôtel vous offre une expérience unique alliant tradition et modernité.",
      cta1: "Réserver maintenant",
      cta2: "Découvrir nos chambres",
      features: [
        "Vue panoramique sur le lac Tanganyika",
        "Restaurant gastronomique",
        "Spa & Centre de bien-être",
        "Salles de conférence modernes"
      ],
      stats: [
        { number: "150+", label: "Chambres luxueuses" },
        { number: "24/7", label: "Service client" },
        { number: "5★", label: "Évaluation moyenne" },
        { number: "10+", label: "Années d'expérience" }
      ]
    },
    en: {
      title: "Welcome to Ruzizi Hotel",
      subtitle: "Excellence & Comfort in the Heart of Bujumbura",
      description: "Discover Burundian hospitality in a modern and elegant setting. Our hotel offers you a unique experience combining tradition and modernity.",
      cta1: "Book now",
      cta2: "Discover our rooms",
      features: [
        "Panoramic view of Lake Tanganyika",
        "Gourmet restaurant",
        "Spa & Wellness Center",
        "Modern conference rooms"
      ],
      stats: [
        { number: "150+", label: "Luxury rooms" },
        { number: "24/7", label: "Customer service" },
        { number: "5★", label: "Average rating" },
        { number: "10+", label: "Years of experience" }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Chambres Luxueuses",
      description: "Confort moderne avec vue imprenable"
    },
    {
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Restaurant Gastronomique",
      description: "Saveurs locales et internationales"
    },
    {
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Spa & Bien-être",
      description: "Détente et relaxation absolue"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
          </div>
        ))}
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent animate-fade-in">
                {t.title}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-amber-100 font-light mb-4 animate-fade-in-delay-1">
              {t.subtitle}
            </p>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2">
              {t.description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto animate-fade-in-delay-3">
            {t.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center md:justify-start space-x-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-gray-200">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-delay-4">
            <button
              onClick={() => router.push('/booking')}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 transition-all duration-300 shadow-2xl hover:shadow-amber-500/25 font-semibold text-lg transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.cta1}</span>
            </button>
            
            <button
              onClick={() => router.push('/establishments')}
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-lg backdrop-blur-sm flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{t.cta2}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-delay-5">
            {t.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 right-8 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-amber-400 scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Slide Info */}
      <div className="absolute bottom-8 left-8 text-white">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 max-w-xs">
          <h3 className="font-semibold text-lg mb-1">
            {slides[currentSlide].title}
          </h3>
          <p className="text-gray-200 text-sm">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-delay-1 {
          animation: fade-in 1s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 1s ease-out 0.6s both;
        }
        
        .animate-fade-in-delay-4 {
          animation: fade-in 1s ease-out 0.8s both;
        }
        
        .animate-fade-in-delay-5 {
          animation: fade-in 1s ease-out 1s both;
        }
      `}</style>
    </section>
  );
}