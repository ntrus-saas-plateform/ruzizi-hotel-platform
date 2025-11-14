# Workflow de Gestion des Réservations - Ruzizi Hôtel

## 📋 Cycle de Vie d'une Réservation

### 1. Création (Status: `pending`)
**Par défaut, toutes les réservations sont créées avec le statut "En attente"**

#### Sources de création:
- **En ligne** (`bookingType: online`) - Via le site web par les clients
- **Sur place** (`bookingType: onsite`) - Par la réception
- **Walk-in** (`bookingType: walkin`) - Clients sans réservation préalable

#### Caractéristiques:
- ⏳ Statut: `pending`
- 📧 Notification envoyée au client
- 🔔 Alerte pour les administrateurs/managers
- ⏰ En attente de confirmation manuelle

### 2. Confirmation (Status: `confirmed`)
**Action requise: Administrateur ou Manager**

#### Processus:
1. Révision de la réservation par l'admin/manager
2. Vérification de la disponibilité
3. Clic sur "Confirmer la réservation"
4. Notification automatique au client par email

#### Caractéristiques:
- ✅ Statut: `confirmed`
- 📧 Email de confirmation envoyé au client
- 🔒 Chambre bloquée pour les dates réservées
- 💳 Paiement peut être effectué
- 📅 Client peut effectuer le check-in

### 3. Check-out (Status: `completed`)
**Action requise: Réceptionniste, Manager ou Admin**

#### Processus:
1. Client termine son séjour
2. Vérification de la chambre
3. Clic sur "Effectuer le check-out"
4. Libération de la chambre

#### Caractéristiques:
- ✓ Statut: `completed`
- 🏠 Chambre disponible pour nouvelles réservations
- 📊 Données archivées pour statistiques
- 🔒 Réservation non modifiable

### 4. Annulation (Status: `cancelled`)
**Action possible: Administrateur ou Manager**

#### Processus:
1. Demande d'annulation (client ou admin)
2. Saisie de la raison d'annulation
3. Confirmation de l'annulation
4. Notification au client

#### Caractéristiques:
- ❌ Statut: `cancelled`
- 📝 Raison d'annulation enregistrée
- 🏠 Chambre libérée immédiatement
- 💰 Remboursement selon politique
- 🔒 Réservation non modifiable

## 🎯 Actions Disponibles par Statut

### Statut: `pending` (En attente)
| Action | Rôle requis | Description |
|--------|-------------|-------------|
| ✅ Confirmer | Admin/Manager | Valide la réservation |
| ❌ Annuler | Admin/Manager | Rejette la réservation |
| ✏️ Modifier | Admin/Manager | Modifie les détails |
| 👁️ Voir détails | Tous | Consulte les informations |

### Statut: `confirmed` (Confirmée)
| Action | Rôle requis | Description |
|--------|-------------|-------------|
| 🚪 Check-out | Admin/Manager/Réceptionniste | Termine le séjour |
| ❌ Annuler | Admin/Manager | Annule la réservation |
| ✏️ Modifier | Admin/Manager | Modifie les détails |
| 💳 Gérer paiement | Admin/Manager/Réceptionniste | Enregistre les paiements |

### Statut: `completed` (Terminée)
| Action | Rôle requis | Description |
|--------|-------------|-------------|
| 👁️ Voir détails | Tous | Consultation uniquement |
| 📊 Voir facture | Tous | Accès à la facture |

### Statut: `cancelled` (Annulée)
| Action | Rôle requis | Description |
|--------|-------------|-------------|
| 👁️ Voir détails | Tous | Consultation uniquement |
| 📝 Voir raison | Tous | Raison d'annulation |

## 📱 Pages et Fonctionnalités

### 1. Liste des Réservations (`/admin/bookings`)
- ✅ Vue d'ensemble de toutes les réservations
- 🔍 Filtres par statut, date, client
- 📊 Statistiques rapides
- 🎨 Code couleur par statut

### 2. Réservations en Attente (`/admin/bookings/pending`)
- ⏳ Liste des réservations à confirmer
- ⚡ Actions rapides (Confirmer/Rejeter)
- 🔔 Notifications visuelles
- 📧 Informations client complètes

### 3. Détails de Réservation (`/admin/bookings/[id]`)
- 📋 Informations complètes
- 🎯 Actions contextuelles selon statut
- 💰 Détails de tarification
- 📝 Historique et notes
- 🔔 Alertes et notifications

### 4. Création de Réservation (`/admin/bookings/create`)
- 📝 Formulaire complet
- 🏠 Sélection d'hébergement
- 👤 Informations client
- 💳 Calcul automatique du prix
- ⏳ Statut initial: `pending`

### 5. Walk-in (`/admin/bookings/walkin`)
- ⚡ Enregistrement rapide
- 🏃 Pour clients sans réservation
- ⏰ Tarification horaire/journalière
- ✅ Confirmation immédiate possible

### 6. Modification (`/admin/bookings/[id]/edit`)
- ✏️ Modification des détails
- 📅 Changement de dates
- 👥 Mise à jour nombre de personnes
- 🚫 Bloquée si annulée/terminée

## 🔔 Notifications et Emails

### Création de Réservation
- 📧 Email de confirmation de réception au client
- 🔔 Notification aux admins/managers

### Confirmation
- 📧 Email de confirmation au client
- 📄 Détails de la réservation
- 🗺️ Informations d'accès

### Annulation
- 📧 Email d'annulation au client
- 📝 Raison de l'annulation
- 💰 Informations de remboursement

### Check-out
- 📧 Email de remerciement
- 📄 Facture finale
- ⭐ Demande d'avis (optionnel)

## 🔐 Permissions

### Super Admin
- ✅ Toutes les actions
- 🌍 Tous les établissements
- 📊 Accès complet aux données

### Manager
- ✅ Confirmer/Annuler réservations
- ✅ Check-out
- ✅ Modifier réservations
- 🏢 Limité à son établissement

### Réceptionniste
- ✅ Créer réservations
- ✅ Check-out
- ✅ Voir détails
- 🏢 Limité à son établissement

### Personnel
- 👁️ Voir réservations
- 📋 Consultation uniquement

## 📊 Statistiques et Rapports

### Métriques Suivies
- 📈 Taux de confirmation (pending → confirmed)
- ❌ Taux d'annulation
- ⏱️ Temps moyen de confirmation
- 💰 Revenus par statut
- 📅 Occupation par période

### Rapports Disponibles
- 📊 Rapport d'occupation
- 💵 Rapport financier
- 📈 Tendances de réservation
- 🎯 Performance par canal

## 🚀 Améliorations Futures

### Court Terme
- [ ] Confirmation automatique pour certains cas
- [ ] Rappels automatiques pour réservations en attente
- [ ] Système de priorité pour réservations VIP

### Moyen Terme
- [ ] Intégration paiement en ligne
- [ ] Check-in en ligne
- [ ] QR codes pour réservations
- [ ] Application mobile pour clients

### Long Terme
- [ ] IA pour prédiction d'annulations
- [ ] Tarification dynamique
- [ ] Système de fidélité
- [ ] Intégration avec OTAs (Booking.com, etc.)

## 📝 Notes Importantes

1. **Toutes les réservations commencent en `pending`** - Cela permet un contrôle qualité
2. **Seuls Admin/Manager peuvent confirmer** - Évite les erreurs
3. **Raison obligatoire pour annulation** - Traçabilité et amélioration
4. **Notifications automatiques** - Communication transparente avec clients
5. **Historique complet** - Audit trail pour toutes les actions
