'use client';

import { useState, useEffect } from 'react';

export default function AboutPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "À propos de Ruzizi Hôtel",
      subtitle: "Découvrez notre histoire et notre engagement envers l'excellence",
      ourStory: "Notre Histoire",
      ourValues: "Nos Valeurs",
      excellence: "Excellence",
      excellenceDesc: "Nous visons l'excellence dans tous les aspects de notre service",
      hospitality: "Hospitalité",
      hospitalityDesc: "Un accueil chaleureux et un service personnalisé pour chaque client",
      trust: "Confiance",
      trustDesc: "Votre satisfaction et votre sécurité sont nos priorités",
      quality: "Qualité",
      qualityDesc: "Nous maintenons les plus hauts standards de qualité dans tous nos services",
      innovation: "Innovation",
      innovationDesc: "Nous adoptons les dernières technologies pour améliorer votre expérience",
      sustainability: "Durabilité",
      sustainabilityDesc: "Nous nous engageons pour un tourisme responsable et durable",
      community: "Communauté",
      communityDesc: "Nous contribuons au développement de nos communautés locales",
      story1: "Ruzizi Hôtel est une chaîne hôtelière de référence au Burundi, offrant des hébergements de qualité et un service exceptionnel depuis de nombreuses années. Nos établissements sont situés dans les plus beaux endroits du Burundi à Bujumbura.",
      story2: "Nous nous engageons à offrir à nos clients une expérience inoubliable, alliant confort moderne et hospitalité traditionnelle burundaise. Chaque établissement est conçu pour répondre aux besoins des voyageurs d'affaires et de loisirs.",
      stats: {
        years: "Années d'expérience",
        establishments: "Établissements",
        rooms: "Chambres disponibles",
        guests: "Clients satisfaits"
      }
    },
    en: {
      title: "About Ruzizi Hotel",
      subtitle: "Discover our story and commitment to excellence",
      ourStory: "Our Story",
      ourValues: "Our Values",
      excellence: "Excellence",
      excellenceDesc: "We aim for excellence in all aspects of our service",
      hospitality: "Hospitality",
      hospitalityDesc: "A warm welcome and personalized service for every guest",
      trust: "Trust",
      trustDesc: "Your satisfaction and safety are our priorities",
      quality: "Quality",
      qualityDesc: "We maintain the highest quality standards in all our services",
      innovation: "Innovation",
      innovationDesc: "We adopt the latest technologies to enhance your experience",
      sustainability: "Sustainability",
      sustainabilityDesc: "We are committed to responsible and sustainable tourism",
      community: "Community",
      communityDesc: "We contribute to the development of our local communities",
      story1: "Ruzizi Hotel is a leading hotel chain in Burundi, offering quality accommodations and exceptional service for many years. Our establishments are located in the most beautiful places in Burundi in Bujumbura.",
      story2: "We are committed to offering our guests an unforgettable experience, combining modern comfort and traditional Burundian hospitality. Each establishment is designed to meet the needs of business and leisure travelers.",
      stats: {
        years: "Years of experience",
        establishments: "Establishments",
        rooms: "Available rooms",
        guests: "Satisfied guests"
      }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">15+</div>
              <p className="text-gray-600 font-medium">{t.stats.years}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">5</div>
              <p className="text-gray-600 font-medium">{t.stats.establishments}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">150+</div>
              <p className="text-gray-600 font-medium">{t.stats.rooms}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-gray-600 font-medium">{t.stats.guests}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Story */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12 mb-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t.ourStory}</h2>
          </div>
          <div className="prose max-w-none text-gray-700 space-y-6 text-lg leading-relaxed">
            <p>{t.story1}</p>
            <p>{t.story2}</p>
          </div>
        </div>

        {/* Core Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.excellence}</h3>
            <p className="text-gray-700 leading-relaxed">{t.excellenceDesc}</p>
          </div>

          <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.hospitality}</h3>
            <p className="text-gray-700 leading-relaxed">{t.hospitalityDesc}</p>
          </div>

          <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.trust}</h3>
            <p className="text-gray-700 leading-relaxed">{t.trustDesc}</p>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t.ourValues}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t.quality}</h3>
                <p className="text-gray-700">{t.qualityDesc}</p>
              </div>
            </div>

            <div className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t.innovation}</h3>
                <p className="text-gray-700">{t.innovationDesc}</p>
              </div>
            </div>

            <div className="flex items-start p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t.sustainability}</h3>
                <p className="text-gray-700">{t.sustainabilityDesc}</p>
              </div>
            </div>

            <div className="flex items-start p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">{t.community}</h3>
                <p className="text-gray-700">{t.communityDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
