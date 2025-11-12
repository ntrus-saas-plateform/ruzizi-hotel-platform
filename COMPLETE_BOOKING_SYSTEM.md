# Système de Réservation Complet - Ruzizi Hôtel

## Date: Novembre 2025

## Vue d'ensemble

Le système de réservation a été complètement refait pour collecter TOUTES les informations nécessaires pour une réservation hôtelière professionnelle, conformément aux standards internationaux.

## 🧍‍♂️ Informations du Client Principal

### Informations de Base
- **Prénom** (firstName) - Obligatoire
- **Nom** (lastName) - Obligatoire
- **Email** (email) - Obligatoire
- **Téléphone** (phone) - Obligatoire

### Informations Personnelles
- **Genre** (gender) - M/F/Autre - Obligatoire
- **Date de naissance** (dateOfBirth) - Obligatoire
- **Nationalité** (nationality) - Obligatoire

### Identification
- **Type de pièce d'identité** (idType) - Passeport/CNI/Permis/Acte de naissance - Obligatoire
- **Numéro de pièce d'identité** (idNumber) - Obligatoire
- **Date d'expiration** (idExpiryDate) - Optionnel

### Adresse
- **Adresse complète** (address) - Obligatoire
- **Ville** (city) - Obligatoire
- **Pays** (country) - Obligatoire
- **Code postal** (postalCode) - Optionnel

### Préférences
- **Langue préférée** (preferredLanguage) - Français/English/Kiswahili

### Classification Client
- **Type de client** (customerType) - Obligatoire
  - Individuel
  - Entreprise
  - Agence
  - Autre
- **Nom de l'entreprise/agence** (companyName) - Obligatoire si Entreprise ou Agence

### Fidélité
- **Numéro de carte de fidélité** (loyaltyCardNumber) - Optionnel

### Notes
- **Notes spéciales** (notes) - Optionnel
  - Client VIP
  - Allergies
  - Besoins spéciaux
  - Préférences particulières

## 👥 Informations des Invités/Accompagnants

Pour chaque invité, les informations suivantes sont collectées :

### Informations de Base
- **Prénom** (firstName) - Obligatoire
- **Nom** (lastName) - Obligatoire

### Informations Personnelles
- **Genre** (gender) - M/F/Autre - Obligatoire
- **Date de naissance** (dateOfBirth) - Obligatoire
- **Nationalité** (nationality) - Obligatoire

### Identification
- **Type de pièce d'identité** (idType) - Obligatoire
- **Numéro de pièce d'identité** (idNumber) - Obligatoire
- **Date d'expiration** (idExpiryDate) - Optionnel

### Relation avec le Client Principal
- **Type de relation** (relationshipToMainClient) - Obligatoire
  - Époux/Épouse
  - Enfant
  - Parent
  - Frère/Sœur
  - Ami(e)
  - Collègue
  - Autre
- **Détails de la relation** (relationshipDetails) - Si "Autre"

### Statut
- **Est mineur** (isMinor) - Calculé automatiquement selon la date de naissance

### Notes
- **Notes spéciales** (notes) - Optionnel
  - Allergies alimentaires
  - Besoins d'accessibilité
  - Préférences particulières

## 📅 Informations de Réservation

### Dates
- **Date d'arrivée** (checkInDate) - Obligatoire
- **Date de départ** (checkOutDate) - Obligatoire
- **Nombre de nuits** (numberOfNights) - Calculé automatiquement
- **Heure d'arrivée estimée** (arrivalTime) - Optionnel

### Personnes
- **Nombre total de personnes** (numberOfGuests) - Obligatoire (1-10)
- Inclut le client principal + tous les invités

### Demandes Spéciales
- **Demandes spéciales** (specialRequests) - Optionnel
  - Régime alimentaire
  - Accessibilité
  - Préférences de chambre
  - Autres demandes

## 🏗️ Architecture Technique

### Types TypeScript

**Fichier:** `types/guest.types.ts`

```typescript
// Types principaux
- Gender: 'M' | 'F' | 'Autre'
- IDType: 'passport' | 'id_card' | 'driver_license' | 'birth_certificate'
- CustomerType: 'individual' | 'corporate' | 'agency' | 'other'
- RelationshipType: 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'colleague' | 'other'

// Interfaces
- CompleteClientInfo: Toutes les informations du client principal
- GuestInfo: Toutes les informations d'un invité
- BookingGuestData: Données complètes de réservation
```

### Composants React

**1. MainClientForm** (`components/booking/MainClientForm.tsx`)
- Formulaire complet pour le client principal
- Validation en temps réel
- Champs conditionnels (entreprise/agence)
- Interface utilisateur intuitive

**2. GuestForm** (`components/booking/GuestForm.tsx`)
- Formulaire pour chaque invité
- Calcul automatique du statut mineur
- Possibilité de supprimer un invité
- Indicateur visuel pour les mineurs

**3. BookingPage** (`app/(frontoffice)/booking/page.tsx`)
- Page principale de réservation
- Gestion dynamique du nombre d'invités
- Validation complète avant soumission
- Messages d'erreur clairs

### API

**Endpoint:** `POST /api/public/bookings`

**Données envoyées:**
```json
{
  "accommodationId": "string",
  "checkInDate": "date",
  "checkOutDate": "date",
  "numberOfNights": "number",
  "arrivalTime": "string",
  "mainClient": {
    // Toutes les informations du client principal
  },
  "guests": [
    // Tableau de tous les invités
  ],
  "numberOfGuests": "number",
  "specialRequests": "string"
}
```

**Traitement:**
- Validation complète des données
- Vérification de disponibilité
- Calcul du prix
- Création de notes détaillées incluant toutes les informations
- Enregistrement dans la base de données

## 📊 Stockage des Données

Les informations complètes sont stockées dans le champ `notes` de la réservation sous forme structurée :

```
Client: [Prénom] [Nom] | Type: [Type] | Entreprise: [Nom] | 
Genre: [Genre], Nationalité: [Nationalité] | 
Adresse: [Adresse complète] | Langue: [Langue] | 
Heure d'arrivée: [Heure] | Invités: [Nombre] | 
Invité 1: [Nom] ([Relation], [mineur si applicable]) | 
Notes client: [Notes] | Demandes spéciales: [Demandes]
```

## ✅ Validation

### Validation Côté Client
- Tous les champs obligatoires sont vérifiés
- Format des emails validé
- Dates cohérentes (départ après arrivée)
- Informations complètes pour chaque invité

### Validation Côté Serveur
- Vérification de l'existence de l'hébergement
- Contrôle de disponibilité
- Validation des données reçues
- Gestion des erreurs

## 🎨 Interface Utilisateur

### Caractéristiques
- Design moderne et professionnel
- Responsive (mobile, tablette, desktop)
- Indicateurs visuels clairs
- Messages d'erreur explicites
- Progression visible
- Champs conditionnels intelligents

### Expérience Utilisateur
- Formulaire en sections logiques
- Calculs automatiques (nuits, statut mineur)
- Ajout/suppression dynamique d'invités
- Sauvegarde des données en cours de saisie
- Confirmation avant soumission

## 🔒 Sécurité et Conformité

### Protection des Données
- Toutes les informations personnelles sont protégées
- Conformité RGPD
- Stockage sécurisé
- Transmission chiffrée (HTTPS)

### Validation des Identités
- Vérification des pièces d'identité requise
- Dates d'expiration enregistrées
- Traçabilité complète

## 📈 Avantages du Système

### Pour l'Hôtel
1. **Conformité légale** - Toutes les informations requises par la loi
2. **Gestion efficace** - Données complètes pour chaque réservation
3. **Sécurité** - Identification complète de tous les clients
4. **Marketing** - Données pour programmes de fidélité
5. **Statistiques** - Analyse détaillée de la clientèle

### Pour les Clients
1. **Processus clair** - Formulaire bien structuré
2. **Transparence** - Savent exactement quelles informations sont requises
3. **Rapidité** - Formulaire optimisé malgré la quantité d'informations
4. **Sécurité** - Confiance dans la protection de leurs données

## 🚀 Prochaines Étapes Recommandées

1. **Intégration paiement** - Ajouter le paiement en ligne sécurisé
2. **Notifications** - Emails de confirmation automatiques
3. **Documents** - Génération automatique de contrats
4. **Check-in en ligne** - Pré-enregistrement avant l'arrivée
5. **Application mobile** - Version mobile native
6. **Multi-langue** - Support complet de plusieurs langues
7. **Scan de documents** - Upload des pièces d'identité
8. **Signature électronique** - Signature des documents en ligne

## 📝 Notes Techniques

### Dépendances
- React 18+
- Next.js 14+
- TypeScript 5+
- Tailwind CSS 3+
- MongoDB

### Performance
- Formulaires optimisés
- Validation en temps réel
- Chargement progressif
- Mise en cache intelligente

### Maintenance
- Code modulaire et réutilisable
- Types TypeScript stricts
- Documentation complète
- Tests unitaires recommandés

## 📞 Support

Pour toute question technique sur ce système, référez-vous à :
- Ce document
- Les commentaires dans le code
- Les types TypeScript
- L'équipe de développement

---

**Version:** 2.0  
**Dernière mise à jour:** Novembre 2025  
**Statut:** Production Ready ✅
