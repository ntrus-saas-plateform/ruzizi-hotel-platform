'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Establishment {
  id: string;
  name: string;
  description: string;
  images: string[];
  location: {
    city: string;
  };
}

const HeroSection = memo(function HeroSection() {
  const router = useRouter();
  const [language, setLanguage] = useState('fr');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const response = await fetch('/api/public/establishments?limit=3');
      const data = await response.json();

      if (data.success && data.data.data && data.data.data.length > 0) {
        const establishments = data.data.data.slice(0, 3);

        setEstablishments(establishments);
        setImagesLoaded(new Array(establishments.length).fill(false));
      } else {
        console.warn('⚠️ Aucun établissement trouvé, utilisation des images par défaut');
      }
    } catch (error) {
      console.error('❌ Erreur chargement établissements pour Hero:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    fr: {
      title: "Bienvenue au Ruzizi Hôtel",
      subtitle: "Excellence & Confort au Cœur de Bujumbura",
      description: "Découvrez l'hospitalité burundaise dans un cadre moderne et élégant. Notre hôtel vous offre une expérience unique alliant tradition et modernité.",
      cta1: "Réserver maintenant",
      cta2: "Découvrir nos établissements",
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
      cta2: "Discover our institutions",
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

  // Images par défaut si pas d'établissements
  const defaultSlides = [
    {
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      fallback: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=2070&q=80",
      title: "Chambres Luxueuses",
      description: "Confort moderne avec vue imprenable",
      establishmentId: undefined as string | undefined
    },
    {
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      fallback: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2070&q=80",
      title: "Restaurant Gastronomique",
      description: "Saveurs locales et internationales",
      establishmentId: undefined as string | undefined
    },
    {
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      fallback: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=2070&q=80",
      title: "Spa & Bien-être",
      description: "Détente et relaxation absolue",
      establishmentId: undefined as string | undefined
    }
  ];

  // Utiliser les images des établissements de la DB ou les images par défaut
  const slides = establishments.length > 0
    ? establishments.map((est, idx) => {
        const hasImage = est.images && est.images.length > 0;
        const imageUrl = hasImage ? est.images[0] : defaultSlides[0].image;

        return {
          image: imageUrl,
          fallback: defaultSlides[0].fallback,
          title: est.name,
          description: `${est.location.city} - ${est.description.substring(0, 60)}...`,
          establishmentId: est.id
        };
      })
    : defaultSlides;

  // Preload images when establishments are loaded
  useEffect(() => {
    if (slides.length > 0 && !loading) {
      slides.forEach((slide, index) => {
        const img = new Image();
        img.onload = () => {
          setImagesLoaded(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        };
        img.onerror = () => {
          console.error(`❌ Erreur chargement hero image ${index + 1}:`, slide.title);
          setImagesLoaded(prev => {
            const newState = [...prev];
            newState[index] = true; // Mark as loaded anyway to prevent infinite loading
            return newState;
          });
        };
        img.src = slide.image;
      });
    }
  }, [loading, establishments]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slides.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Keyboard navigation for slideshow
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (slides.length === 0) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentSlide((prev) => (prev + 1) % slides.length);
          break;
        case 'Home':
          event.preventDefault();
          setCurrentSlide(0);
          break;
        case 'End':
          event.preventDefault();
          setCurrentSlide(slides.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // Reset currentSlide if it exceeds slides length
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Show loading state while fetching
  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Chargement...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      id="main-content"
      aria-label="Section d'accueil avec diaporama"
      role="banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slideshow */}
      <div className="absolute inset-0" role="img" aria-label="Diaporama d'arrière-plan">
        {slides.length > 0 && slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Loading placeholder */}
            {!imagesLoaded[index] && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-sm">Chargement...</p>
                </div>
              </div>
            )}

            {/* Background image */}
            <img
              src={slide.image}
              alt={slide.title}
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded[index] ? 'opacity-100' : 'opacity-0'
                }`}
              onError={(e) => {
                console.error(`❌ Erreur affichage hero background ${index + 1}, essai fallback`);
                // Try fallback image
                if (e.currentTarget.src !== slide.fallback) {
                  e.currentTarget.src = slide.fallback;
                } else {
                  // Both failed, hide image and show gradient only
                  e.currentTarget.style.display = 'none';
                  console.error(`❌ Fallback aussi échoué pour ${slide.title}`);
                }
              }}
            />

            {/* Gradient overlay */}
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
          <header className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent animate-fade-in">
                {t.title}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-amber-100 font-light mb-4 animate-fade-in-delay-1" role="banner">
              {t.subtitle}
            </p>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2">
              {t.description}
            </p>
          </header>

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
          <nav className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-delay-4" aria-label="Actions principales">
            <button
              onClick={() => router.push('/booking')}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 transition-all duration-300 shadow-2xl hover:shadow-amber-500/25 font-semibold text-lg transform hover:scale-105 flex items-center justify-center space-x-3 focus:outline-none focus:ring-4 focus:ring-amber-500/50 touch-manipulation min-h-[48px]"
              aria-label={`Réserver maintenant - ${t.cta1}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.cta1}</span>
            </button>

            <button
              onClick={() => router.push('/establishments')}
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-lg backdrop-blur-sm flex items-center justify-center space-x-3 focus:outline-none focus:ring-4 focus:ring-white/50 touch-manipulation min-h-[48px]"
              aria-label={`Découvrir les établissements - ${t.cta2}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{t.cta2}</span>
            </button>
          </nav>

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

        {/* Scroll Indicator - Centré en bas, plus haut pour éviter chevauchement */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Slide Indicators - Droite bas, responsive */}
      {slides.length > 0 && (
        <div
          className="absolute bottom-6 right-4 md:bottom-8 md:right-8 flex space-x-2 z-20"
          role="tablist"
          aria-label="Contrôles du diaporama"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 touch-manipulation ${index === currentSlide
                ? 'bg-amber-400 scale-125'
                : 'bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Afficher la diapositive ${index + 1} sur ${slides.length}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>
      )}

      {/* Slide Info - Gauche bas, responsive, ne chevauche pas les autres éléments */}
      {slides.length > 0 && slides[currentSlide] && (
        <div className="absolute bottom-6 left-4 md:bottom-8 md:left-8 text-white z-20 max-w-[calc(100%-8rem)] md:max-w-xs">
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
            <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-1">
              {slides[currentSlide].title}
            </h3>
            <p className="text-gray-200 text-xs md:text-sm line-clamp-2 mb-3">
              {slides[currentSlide].description}
            </p>
            {slides[currentSlide].establishmentId && (
              <button
                onClick={() => router.push(`/establishments/${slides[currentSlide].establishmentId}`)}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs md:text-sm rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Voir détails</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

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
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;