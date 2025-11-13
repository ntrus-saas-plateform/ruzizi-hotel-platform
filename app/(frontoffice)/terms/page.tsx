'use client';

import { useState, useEffect } from 'react';

export default function TermsPage() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
  }, []);

  const content = {
    fr: {
      title: "Conditions Générales",
      lastUpdated: "Dernière mise à jour: Novembre 2025"
    },
    en: {
      title: "Terms and Conditions",
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-amber-100">{t.lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 lg:p-12 prose prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-8 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-li:my-2">
          <h2>1. Réservations</h2>
          <p>
            Les réservations peuvent être effectuées en ligne via notre site web, par téléphone ou par email.
            Toute réservation est soumise à disponibilité et doit être confirmée par Ruzizi Hôtel.
          </p>

          <h2>2. Tarifs et Paiement</h2>
          <p>
            Les tarifs affichés sont en Francs Burundais (BIF) et incluent toutes les taxes applicables.
            Le paiement peut être effectué en espèces, par carte bancaire ou par virement bancaire.
          </p>

          <h2>3. Arrivée et Départ</h2>
          <p>
            L'heure d'arrivée est à partir de 14h00 et l'heure de départ est avant 12h00.
            Un départ tardif peut être accordé sous réserve de disponibilité et moyennant des frais supplémentaires.
          </p>

          <h2>4. Annulation et Modification</h2>
          <p>
            Les annulations doivent être effectuées au moins 48 heures avant la date d'arrivée prévue
            pour obtenir un remboursement complet. Les annulations tardives peuvent entraîner des frais.
          </p>

          <h2>5. Responsabilité</h2>
          <p>
            Ruzizi Hôtel ne peut être tenu responsable de la perte, du vol ou des dommages causés aux
            biens personnels des clients. Nous recommandons l'utilisation de nos coffres-forts.
          </p>

          <h2>6. Comportement des Clients</h2>
          <p>
            Les clients sont tenus de respecter les règles de l'établissement et de ne pas perturber
            le confort des autres clients. Ruzizi Hôtel se réserve le droit de refuser le service
            à tout client dont le comportement est jugé inapproprié.
          </p>

          <h2>7. Dommages</h2>
          <p>
            Les clients sont responsables de tout dommage causé aux installations, au mobilier ou
            aux équipements de l'hôtel pendant leur séjour.
          </p>

          <h2>8. Modifications des Conditions</h2>
          <p>
            Ruzizi Hôtel se réserve le droit de modifier ces conditions générales à tout moment.
            Les modifications seront publiées sur notre site web.
          </p>

          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant ces conditions générales, veuillez nous contacter à:
            <br />
            Email: contact@ruzizihotel.com
            <br />
            Téléphone: +257 69 65 75 54
          </p>
        </div>
      </div>
    </div>
  );
}
