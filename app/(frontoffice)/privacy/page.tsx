'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Politique de Confidentialité</h1>
          <p className="text-xl text-blue-100">
            Dernière mise à jour: Novembre 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 prose max-w-none">
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
