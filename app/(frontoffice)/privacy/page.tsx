'use client';

import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const [language, setLanguage] = useState('fr');
  const savedLanguage = localStorage.getItem('language') || 'fr';

  useEffect(() => {
    setLanguage(savedLanguage);
  }, [savedLanguage]);

  const content = {
    fr: {
      title: 'Politique de Confidentialité',
      subtitle: 'Protection de vos données personnelles',
      lastUpdated: 'Dernière mise à jour',
      introduction: {
        title: 'Introduction',
        content:
          'Chez Ruzizi Hotel, nous nous engageons à protéger la confidentialité et la sécurité de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations.',
      },
      dataCollection: {
        title: 'Collecte des données',
        content:
          'Nous collectons des informations personnelles lorsque vous utilisez nos services, effectuez une réservation, créez un compte ou nous contactez. Ces informations peuvent inclure votre nom, adresse email, numéro de téléphone, informations de paiement et préférences de séjour.',
      },
      dataUsage: {
        title: 'Utilisation des données',
        content:
          'Vos données sont utilisées pour traiter vos réservations, améliorer nos services, communiquer avec vous, assurer la sécurité de nos établissements et respecter nos obligations légales.',
      },
      dataSharing: {
        title: 'Partage des données',
        content:
          "Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos informations uniquement avec nos prestataires de services de confiance (traitement des paiements, services informatiques) ou lorsque la loi l'exige.",
      },
      dataSecurity: {
        title: 'Sécurité des données',
        content:
          "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.",
      },
      cookies: {
        title: 'Cookies et technologies similaires',
        content:
          "Notre site utilise des cookies pour améliorer votre expérience utilisateur, analyser le trafic et personnaliser le contenu. Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.",
      },
      userRights: {
        title: 'Vos droits',
        content:
          "Vous avez le droit d'accéder à vos données, de les rectifier, de les supprimer ou de limiter leur traitement. Vous pouvez également vous opposer au traitement de vos données ou demander leur portabilité.",
      },
      dataRetention: {
        title: 'Conservation des données',
        content:
          'Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services, respecter nos obligations légales ou résoudre des litiges. Les données de réservation sont généralement conservées pendant 7 ans.',
      },
      internationalTransfers: {
        title: 'Transferts internationaux',
        content:
          "Vos données peuvent être transférées vers des pays hors de l'Union Européenne. Nous nous assurons que ces transferts sont effectués en conformité avec les réglementations applicables.",
      },
      contact: {
        title: 'Contact',
        content:
          "Pour toute question concernant cette politique de confidentialité ou l'utilisation de vos données, contactez notre délégué à la protection des données.",
      },
      updates: {
        title: 'Mises à jour',
        content:
          'Cette politique peut être mise à jour périodiquement. Nous vous informerons de tout changement important par email ou via une notification sur notre site.',
      },
    },
    en: {
      title: 'Privacy Policy',
      subtitle: 'Protection of your personal data',
      lastUpdated: 'Last updated',
      introduction: {
        title: 'Introduction',
        content:
          'At Ruzizi Hotel, we are committed to protecting the confidentiality and security of your personal data. This privacy policy explains how we collect, use, disclose and protect your information.',
      },
      dataCollection: {
        title: 'Data Collection',
        content:
          'We collect personal information when you use our services, make a reservation, create an account, or contact us. This information may include your name, email address, phone number, payment information, and stay preferences.',
      },
      dataUsage: {
        title: 'Data Usage',
        content:
          'Your data is used to process your reservations, improve our services, communicate with you, ensure the security of our establishments, and comply with our legal obligations.',
      },
      dataSharing: {
        title: 'Data Sharing',
        content:
          'We do not sell your personal data to third parties. We may share your information only with our trusted service providers (payment processing, IT services) or when required by law.',
      },
      dataSecurity: {
        title: 'Data Security',
        content:
          'We implement appropriate technical and organizational security measures to protect your data against unauthorized access, loss, or alteration.',
      },
      cookies: {
        title: 'Cookies and similar technologies',
        content:
          'Our website uses cookies to improve your user experience, analyze traffic, and personalize content. You can control cookie usage through your browser settings.',
      },
      userRights: {
        title: 'Your Rights',
        content:
          'You have the right to access your data, rectify it, delete it, or limit its processing. You can also object to the processing of your data or request its portability.',
      },
      dataRetention: {
        title: 'Data Retention',
        content:
          'We retain your personal data as long as necessary to provide our services, comply with our legal obligations, or resolve disputes. Booking data is generally kept for 7 years.',
      },
      internationalTransfers: {
        title: 'International Transfers',
        content:
          'Your data may be transferred to countries outside the European Union. We ensure that these transfers are carried out in compliance with applicable regulations.',
      },
      contact: {
        title: 'Contact',
        content:
          'For any questions regarding this privacy policy or the use of your data, contact our data protection officer.',
      },
      updates: {
        title: 'Updates',
        content:
          'This policy may be updated periodically. We will inform you of any significant changes by email or through a notification on our website.',
      },
    },
  };

  const t = content[language as keyof typeof content];

  const sections = [
    { key: 'introduction', data: t.introduction },
    { key: 'dataCollection', data: t.dataCollection },
    { key: 'dataUsage', data: t.dataUsage },
    { key: 'dataSharing', data: t.dataSharing },
    { key: 'dataSecurity', data: t.dataSecurity },
    { key: 'cookies', data: t.cookies },
    { key: 'userRights', data: t.userRights },
    { key: 'dataRetention', data: t.dataRetention },
    { key: 'internationalTransfers', data: t.internationalTransfers },
    { key: 'contact', data: t.contact },
    { key: 'updates', data: t.updates },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle pt-48 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-xl text-luxury-text">{t.subtitle}</p>
        <p className="text-luxury-text mt-4 text-sm">
          {t.lastUpdated}:{' '}
          {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden">
          <div className="p-8 lg:p-12">
            {/* Table of Contents */}
            <div className="mb-12 p-6 bg-luxury-cream rounded-xl border border-amber-100">
              <h2 className="text-xl font-bold text-luxury-dark mb-4">Table des matières</h2>
              <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sections.map((section, index) => (
                  <a
                    key={section.key}
                    href={`#${section.key}`}
                    className="text-luxury-gold transition-colors text-sm"
                  >
                    {index + 1}. {section.data.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <section key={section.key} id={section.key} className="scroll-mt-8">
                  <div className="flex items-start mb-4">
                    <div className="w-8 h-8 bg-gradient-luxury rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-luxury-cream font-bold text-sm">{index + 1}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-luxury-dark">{section.data.title}</h2>
                  </div>
                  <div className="ml-12">
                    <p className="text-luxury-text leading-relaxed text-base">{section.data.content}</p>
                  </div>
                </section>
              ))}
            </div>

            {/* Contact Information */}
            <div className="mt-16 p-8 bg-luxury-cream rounded-xl border border-amber-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-luxury rounded-xl flex items-center justify-center mr-4">
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
                <h3 className="text-xl font-bold text-luxury-dark">
                  Contact pour la protection des données
                </h3>
              </div>
              <div className="ml-16 space-y-2 text-luxury-text">
                <p className="">
                  <strong>Email:</strong> privacy@ruzizihotel.com
                </p>
                <p className="">
                  <strong>Téléphone:</strong> +257 69 65 75 54
                </p>
                <p className="">
                  <strong>Adresse:</strong> Bujumbura, Burundi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
