'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Conditions Générales</h1>
          <p className="text-xl text-blue-100">
            Dernière mise à jour: Novembre 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 prose max-w-none">
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
