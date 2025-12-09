'use client';

import { useState, useEffect } from 'react';

export default function TermsPage() {
  const [language, setLanguage] = useState('fr');
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);;

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
    <div className="min-h-screen bg-gradient-subtle pt-48 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-luxury-dark bg-clip-text text-transparent mb-4">
          {t.title}
        </h2>
        <p className="text-base  text-luxury-text">{t.lastUpdated}</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-luxury-cream rounded-2xl border border-white/20 p-8 lg:p-12 prose prose-lg max-w-none prose-headings:text-luxury-dark prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-8 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-li:my-2">
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
