'use client';

import { useState, useEffect } from 'react';

export default function AboutPage() {
  const [language, setLanguage] = useState('fr');
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const content = {
    fr: {
      title: 'À propos de Ruzizi Hotel',
      subtitle: 'Votre destination de choix au Burundi',
      ourStory: 'Notre histoire',
      storyText:
        "Fondé avec passion, Ruzizi Hotel s'engage à offrir une expérience exceptionnelle à ses clients. Notre établissement combine confort moderne et hospitalité traditionnelle burundaise pour créer des souvenirs inoubliables.",
      mission: 'Notre mission',
      missionText:
        "Fournir un service d'hébergement de qualité supérieure qui dépasse les attentes de nos clients, tout en contribuant au développement touristique durable du Burundi.",
      values: 'Nos valeurs',
      excellence: 'Excellence',
      excellenceDesc: "Nous visons l'excellence dans chaque aspect de notre service.",
      hospitality: 'Hospitalité',
      hospitalityDesc: "L'hospitalité burundaise authentique et chaleureuse.",
      sustainability: 'Durabilité',
      sustainabilityDesc: "Engagement envers des pratiques respectueuses de l'environnement.",
      innovation: 'Innovation',
      innovationDesc: 'Adoption des dernières technologies pour améliorer votre séjour.',
      whyChooseUs: 'Pourquoi nous choisir?',
      location: 'Emplacement privilégié',
      locationDesc: 'Situé au cœur du Burundi, proche des attractions touristiques majeures.',
      comfort: 'Confort moderne',
      comfortDesc: 'Chambres équipées des dernières commodités pour votre bien-être.',
      service: 'Service personnalisé',
      serviceDesc: 'Une équipe dédiée pour répondre à vos besoins spécifiques.',
      team: 'Notre équipe',
      teamText:
        'Notre équipe passionnée travaille chaque jour pour faire de votre séjour une expérience mémorable.',
    },
    en: {
      title: 'About Ruzizi Hotel',
      subtitle: 'Your premier destination in Burundi',
      ourStory: 'Our story',
      storyText:
        'Founded with passion, Ruzizi Hotel is committed to providing an exceptional experience for our guests. Our establishment combines modern comfort with traditional Burundian hospitality to create unforgettable memories.',
      mission: 'Our mission',
      missionText:
        "To provide superior accommodation services that exceed our customers' expectations while contributing to the sustainable tourism development of Burundi.",
      values: 'Our values',
      excellence: 'Excellence',
      excellenceDesc: 'We strive for excellence in every aspect of our service.',
      hospitality: 'Hospitality',
      hospitalityDesc: 'Authentic and warm Burundian hospitality.',
      sustainability: 'Sustainability',
      sustainabilityDesc: 'Commitment to environmentally friendly practices.',
      innovation: 'Innovation',
      innovationDesc: 'Adopting the latest technologies to enhance your stay.',
      whyChooseUs: 'Why choose us?',
      location: 'Prime location',
      locationDesc: 'Located in the heart of Burundi, close to major tourist attractions.',
      comfort: 'Modern comfort',
      comfortDesc: 'Rooms equipped with the latest amenities for your well-being.',
      service: 'Personalized service',
      serviceDesc: 'A dedicated team to meet your specific needs.',
      team: 'Our team',
      teamText: 'Our passionate team works every day to make your stay a memorable experience.',
    },
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen pt-48 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-xl text-luxury-text">{t.subtitle}</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Our Story */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-luxury-dark">{t.ourStory}</h2>
            </div>
            <p className="text-lg text-center text-luxury-text leading-relaxed mb-6">
              {t.storyText}
            </p>
          </div>

          {/* Mission */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-luxury-dark">{t.mission}</h2>
            </div>
            <p className="text-lg text-center text-luxury-text leading-relaxed">{t.missionText}</p>
          </div>
        </div>

        {/* Values */}
        <div className="p-8 mb-8">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-luxury-dark">{t.values}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-200 to-amber-200 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-luxury-cream"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxury-dark mb-2">{t.excellence}</h3>
                  <p className="text-luxury-text leading-relaxed">{t.excellenceDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-200 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-luxury-cream"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxury-dark mb-2">{t.hospitality}</h3>
                  <p className="text-luxury-text leading-relaxed">{t.hospitalityDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-200 to-green-200 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-luxury-cream"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9m-9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxury-dark mb-2">{t.sustainability}</h3>
                  <p className="text-luxury-text leading-relaxed">{t.sustainabilityDesc}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-200 to-purple-200 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-luxury-cream"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxury-dark mb-2">{t.innovation}</h3>
                  <p className="text-luxury-text leading-relaxed">{t.innovationDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="p-8 mb-8">
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-luxury-dark">{t.whyChooseUs}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-luxury-cream"
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
              <h3 className="text-xl font-bold text-luxury-dark mb-3">{t.location}</h3>
              <p className="text-luxury-text">{t.locationDesc}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-luxury-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-luxury-dark mb-3">{t.comfort}</h3>
              <p className="text-luxury-text">{t.comfortDesc}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-luxury-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-luxury-dark mb-3">{t.service}</h3>
              <p className="text-luxury-text">{t.serviceDesc}</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-luxury-text rounded-2xl p-8 shadow-luxury text-center">
          <div className="w-16 h-16 bg-[hsl(var(--color-luxury-cream))]/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-luxury-cream"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-luxury-cream mb-4">{t.team}</h3>
          <p className="text-luxury-cream text-lg leading-relaxed max-w-3xl mx-auto">
            {t.teamText}
          </p>
        </div>
      </div>
    </div>
  );
}
