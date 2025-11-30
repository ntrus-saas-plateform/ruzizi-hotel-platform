'use client';

import { useState, useEffect, memo } from 'react';
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
      toptitle: 'Bienvenue au',
      title: 'Ruzizi Hôtel',
      subtitle: 'Excellence & Confort au Cœur de Bujumbura',
      description:
        "Découvrez l'hospitalité burundaise dans un cadre moderne et élégant. Notre hôtel vous offre une expérience unique alliant tradition et modernité.",
      cta1: 'Réserver maintenant',
      cta2: 'Découvrir nos établissements',
      features: [
        'Vue panoramique sur le lac Tanganyika',
        'Restaurant gastronomique',
        'Spa & Centre de bien-être',
        'Salles de conférence modernes',
      ],
      stats: [
        { number: '150+', label: 'Chambres luxueuses' },
        { number: '24/7', label: 'Service client' },
        { number: '5★', label: 'Évaluation moyenne' },
        { number: '10+', label: "Années d'expérience" },
      ],
    },
    en: {
      toptitle: 'Welcome to',
      title: 'Ruzizi Hotel',
      subtitle: 'Excellence & Comfort in the Heart of Bujumbura',
      description:
        'Discover Burundian hospitality in a modern and elegant setting. Our hotel offers you a unique experience combining tradition and modernity.',
      cta1: 'Book now',
      cta2: 'Discover our institutions',
      features: [
        'Panoramic view of Lake Tanganyika',
        'Gourmet restaurant',
        'Spa & Wellness Center',
        'Modern conference rooms',
      ],
      stats: [
        { number: '150+', label: 'Luxury rooms' },
        { number: '24/7', label: 'Customer service' },
        { number: '5★', label: 'Average rating' },
        { number: '10+', label: 'Years of experience' },
      ],
    },
  };

  const t = content[language as keyof typeof content];

  const defaultSlides = [
    {
      image: '/bg.jpg',
      fallback: '/bg.jpg',
      title: 'Chambres Luxueuses',
      description: 'Confort moderne avec vue imprenable',
      establishmentId: undefined as string | undefined,
    },
    {
      image: '/bg.jpg',
      fallback: '/bg.jpg',
      title: 'Restaurant Gastronomique',
      description: 'Saveurs locales et internationales',
      establishmentId: undefined as string | undefined,
    },
    {
      image: '/bg.jpg',
      fallback: '/bg.jpg',
      title: 'Spa & Bien-être',
      description: 'Détente et relaxation absolue',
      establishmentId: undefined as string | undefined,
    },
  ];

  const slides =
    establishments.length > 0
      ? establishments.map((est, idx) => {
          const hasImage = est.images && est.images.length > 0;
          const imageUrl = hasImage ? est.images[0] : defaultSlides[0].image;

          return {
            image: imageUrl,
            fallback: defaultSlides[0].fallback,
            title: est.name,
            description: `${est.location.city} - ${est.description.substring(0, 60)}...`,
            establishmentId: est.id,
          };
        })
      : defaultSlides;

  useEffect(() => {
    if (slides.length > 0 && !loading) {
      slides.forEach((slide, index) => {
        const img = new Image();
        img.onload = () => {
          setImagesLoaded((prev) => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        };
        img.onerror = () => {
          console.error(`❌ Erreur chargement hero image ${index + 1}:`, slide.title);
          setImagesLoaded((prev) => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        };
        img.src = slide.image;
      });
    }
  }, [loading, establishments]);

  useEffect(() => {
    if (slides.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

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

  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // if (loading) {
  //   return (
  //     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
  //       <div className="text-center text-luxury-cream">
  //         <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
  //         <p className="text-lg">Chargement...</p>
  //       </div>
  //     </section>
  //   );
  // }

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
        {slides.length > 0 &&
          slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden={index !== currentSlide}
            >
              {!imagesLoaded[index] && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
                    {/* <p className="text-luxury-cream text-sm">Chargement...</p> */}
                  </div>
                </div>
              )}

              <img
                src={slide.image}
                alt={slide.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imagesLoaded[index] ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  console.error(`❌ Erreur affichage hero background ${index + 1}, essai fallback`);
                  if (e.currentTarget.src !== slide.fallback) {
                    e.currentTarget.src = slide.fallback;
                  } else {
                    e.currentTarget.style.display = 'none';
                    console.error(`❌ Fallback aussi échoué pour ${slide.title}`);
                  }
                }}
              />

              {/* Enhanced Gradient Overlay with Color */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-amber-900/40 to-black/70" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
            </div>
          ))}
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Two-Sided Content Layout */}
      <div className="relative z-10 w-full max-w-7xl container mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-40 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-end min-h-[calc(100vh-5rem)]">
          {/* Left Side - Main Content */}
          <div className="col-span-2 text-luxury-cream space-y-3">
            <div className="space-y-3 text-center lg:text-start">
              <p className="text-xl leading-0 md:text-2xl text-amber-100 font-light animate-fade-in-delay-1">
                {t.toptitle}
              </p>
              <h1 className="text-5xl lg:text-[5rem] font-bold leading-tight">
                <span className="block bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent animate-fade-in">
                  {t.title}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-amber-100 font-light animate-fade-in-delay-1"
                role="banner"
              >
                {t.subtitle}
              </p>
              <p className="text-base md:text-lg text-luxury-cream leading-relaxed animate-fade-in-delay-2 text-balance">
                {t.description}
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 justify-center lg:grid grid-cols-1 sm:grid-cols-2 lg:gap-1 animate-fade-in-delay-3">
              {t.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-luxury-gold rounded-full flex-shrink-0" />
                  <span className="text-luxury-cream text-sm md:text-base">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <nav
              className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-4 pt-4"
              aria-label="Actions principales"
            >
              <button
                onClick={() => router.push('/booking')}
                className="px-4 py-2 md:px-6 md:py-3 bg-gradient-luxury text-luxury-cream rounded-xl transition-all duration-300 shadow-luxury font-semibold text-base md:text-lg transform hover:scale-105 flex items-center justify-center space-x-3 focus:outline-none focus:ring-4 focus:ring-amber-500/50 touch-manipulation min-h-[48px]"
                aria-label={`Réserver maintenant - ${t.cta1}`}
              >
                <span>{t.cta1}</span>
              </button>

              <button
                onClick={() => router.push('/establishments')}
                className="px-4 py-2 md:px-6 md:py-3 border-2 border-white/30 text-luxury-cream rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-base md:text-lg backdrop-blur-sm flex items-center justify-center space-x-3 focus:outline-none focus:ring-4 focus:ring-white/50 touch-manipulation min-h-[48px]"
                aria-label={`Découvrir les établissements - ${t.cta2}`}
              >
                <span>{t.cta2}</span>
              </button>
            </nav>
          </div>

          {/* Right Side - Slide Info Card */}
          <div className="relative lg:flex flex-col lg:items-center lg:justify-center animate-fade-in-delay-3">
            {slides.length > 0 && slides[currentSlide] && (
              <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20 max-w-md mx-auto lg:mx-0 transform hover:scale-105 transition-all duration-300">
                <h3 className="font-bold text-xl md:text-2xl mb-3 text-luxury-cream">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-luxury-cream text-sm md:text-base mb-6 leading-relaxed">
                  {slides[currentSlide].description}
                </p>

                {slides[currentSlide].establishmentId && (
                  <button
                    onClick={() =>
                      router.push(`/establishments/${slides[currentSlide].establishmentId}`)
                    }
                    className="w-full px-4 py-2 bg-gradient-luxury text-luxury-cream rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span>Voir les détails</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}

                {/* Slide Indicators */}
                <div
                  className="flex justify-center space-x-2 mt-3"
                  role="tablist"
                  aria-label="Contrôles du diaporama"
                >
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-4 h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 touch-manipulation ${
                        index === currentSlide
                          ? 'bg-amber-400 scale-125'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Afficher la diapositive ${index + 1} sur ${slides.length}`}
                      aria-selected={index === currentSlide}
                      role="tab"
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-delay-5 pt-8 w-full">
              {t.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-2xl lg:text-3xl font-bold text-luxury-gold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-luxury-cream text-xs md:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
