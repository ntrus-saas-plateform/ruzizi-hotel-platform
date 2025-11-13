'use client';

import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour: Novembre 2025"
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: November 2025"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100">{t.lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12 prose prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-8 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-li:my-2">
          <h2>1. Collecte des Informations</h2>
          <p>
            Nous collectons les informations que vous nous fournissez lors de votre réservation,
            y compris votre nom, adresse email, numéro de téléphone, informations de paiement
            et pièces d'identité.
          </p>

          <h2>2. Utilisation des Informations</h2>
          <p>
            Vos informations personnelles sont utilisées pour:
          </p>
          <ul>
            <li>Traiter vos réservations</li>
            <li>Communiquer avec vous concernant votre séjour</li>
            <li>Améliorer nos services</li>
            <li>Respecter nos obligations légales</li>
          </ul>

          <h2>3. Protection des Données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos
            informations personnelles contre tout accès non autorisé, modification, divulgation
            ou destruction.
          </p>

          <h2>4. Partage des Informations</h2>
          <p>
            Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers.
            Vos informations peuvent être partagées avec nos prestataires de services uniquement
            dans le cadre de la fourniture de nos services.
          </p>

          <h2>5. Cookies</h2>
          <p>
            Notre site web utilise des cookies pour améliorer votre expérience de navigation.
            Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut
            affecter certaines fonctionnalités du site.
          </p>

          <h2>6. Vos Droits</h2>
          <p>
            Vous avez le droit de:
          </p>
          <ul>
            <li>Accéder à vos informations personnelles</li>
            <li>Corriger vos informations personnelles</li>
            <li>Demander la suppression de vos informations personnelles</li>
            <li>Vous opposer au traitement de vos informations personnelles</li>
          </ul>

          <h2>7. Conservation des Données</h2>
          <p>
            Nous conservons vos informations personnelles aussi longtemps que nécessaire pour
            fournir nos services et respecter nos obligations légales.
          </p>

          <h2>8. Modifications de la Politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
            Les modifications seront publiées sur cette page.
          </p>

          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou pour exercer
            vos droits, veuillez nous contacter à:
            <br />
            Email: contact@ruzizihotel.com
            <br />
            Téléphone: +257 69 65 75 54
            <br />
            Adresse: Bwiza Avenue de l'Université, Bujumbura, Burundi
          </p>
        </div>
      </div>
    </div>
  );
}
