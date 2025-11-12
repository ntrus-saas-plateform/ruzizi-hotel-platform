# Documentation API - Ruzizi Hôtel Platform

## Base URL

```
Production: https://api.ruzizihotel.com
Development: http://localhost:3000
```

## Authentication

Toutes les routes protégées nécessitent un token JWT dans le header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /api/auth/login
Connexion utilisateur

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "manager"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### POST /api/auth/refresh
Rafraîchir le token d'accès

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### POST /api/auth/logout
Déconnexion

---

### Establishments

#### GET /api/establishments
Liste des établissements

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `city` (string): Filter by city
- `search` (string): Search term

**Response:**
```json
{
  "data": [
    {
      "id": "est_id",
      "name": "Ruzizi Hotel Bujumbura",
      "location": {
        "city": "Bujumbura",
        "address": "Avenue de l'Université"
      },
      "pricingMode": "nightly",
      "totalCapacity": 50
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### POST /api/establishments
Créer un établissement (Admin only)

**Request Body:**
```json
{
  "name": "Ruzizi Hotel Bujumbura",
  "location": {
    "address": "Avenue de l'Université",
    "city": "Bujumbura",
    "country": "Burundi"
  },
  "pricingMode": "nightly",
  "services": ["WiFi", "Restaurant", "Parking"]
}
```

---

### Accommodations

#### GET /api/accommodations
Liste des hébergements

**Query Parameters:**
- `establishmentId` (string): Filter by establishment
- `type` (string): Filter by type
- `status` (string): Filter by status
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price

#### POST /api/accommodations
Créer un hébergement

**Request Body:**
```json
{
  "establishmentId": "est_id",
  "name": "Chambre Deluxe 101",
  "type": "standard_room",
  "capacity": {
    "maxGuests": 2,
    "bedrooms": 1,
    "bathrooms": 1
  },
  "pricing": {
    "basePrice": 50000,
    "currency": "BIF"
  },
  "amenities": ["WiFi", "TV", "AC"]
}
```

---

### Bookings

#### GET /api/bookings
Liste des réservations

**Query Parameters:**
- `status` (string): Filter by status
- `establishmentId` (string): Filter by establishment
- `checkInFrom` (date): Filter by check-in date
- `checkInTo` (date): Filter by check-in date

#### POST /api/bookings
Créer une réservation

**Request Body:**
```json
{
  "establishmentId": "est_id",
  "accommodationId": "acc_id",
  "clientInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+25769000000"
  },
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "numberOfGuests": 2
}
```

**Response:**
```json
{
  "id": "booking_id",
  "bookingCode": "BK-2025-001",
  "status": "pending",
  "pricingDetails": {
    "total": 250000
  }
}
```

#### GET /api/bookings/:id
Détails d'une réservation

#### PATCH /api/bookings/:id
Mettre à jour une réservation

#### DELETE /api/bookings/:id
Annuler une réservation

---

### Invoices

#### GET /api/invoices
Liste des factures

#### POST /api/invoices
Générer une facture

**Request Body:**
```json
{
  "bookingId": "booking_id"
}
```

#### POST /api/invoices/:id/payment
Enregistrer un paiement

**Request Body:**
```json
{
  "amount": 100000,
  "method": "cash",
  "reference": "CASH-001"
}
```

---

### Employees

#### GET /api/employees
Liste des employés

#### POST /api/employees
Créer un employé

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+25769000000"
  },
  "employmentInfo": {
    "position": "Receptionist",
    "department": "Front Desk",
    "salary": 300000,
    "startDate": "2025-01-01"
  },
  "establishmentId": "est_id"
}
```

---

### Attendance

#### POST /api/attendance/check-in
Pointer l'arrivée

**Request Body:**
```json
{
  "employeeId": "emp_id",
  "checkInTime": "2025-01-15T08:00:00Z"
}
```

#### POST /api/attendance/check-out
Pointer le départ

---

### Payroll

#### GET /api/payroll
Liste des fiches de paie

#### POST /api/payroll/generate
Générer la paie mensuelle

**Request Body:**
```json
{
  "month": 1,
  "year": 2025,
  "establishmentId": "est_id"
}
```

---

### Leave

#### GET /api/leave
Liste des congés

#### POST /api/leave
Demander un congé

**Request Body:**
```json
{
  "employeeId": "emp_id",
  "type": "annual",
  "startDate": "2025-02-01",
  "endDate": "2025-02-10",
  "reason": "Vacances"
}
```

#### PATCH /api/leave/:id/approve
Approuver un congé

#### PATCH /api/leave/:id/reject
Rejeter un congé

---

### Analytics

#### GET /api/analytics/revenue
Statistiques de revenus

**Query Parameters:**
- `startDate` (date): Start date
- `endDate` (date): End date
- `establishmentId` (string): Filter by establishment

**Response:**
```json
{
  "totalRevenue": 5000000,
  "revenueByPeriod": [
    {
      "date": "2025-01-01",
      "amount": 250000
    }
  ],
  "occupancyRate": 75.5
}
```

#### GET /api/analytics/occupancy
Taux d'occupation

---

## Error Responses

Toutes les erreurs suivent ce format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```

### Codes d'Erreur Communs

- `400` - Bad Request: Données invalides
- `401` - Unauthorized: Non authentifié
- `403` - Forbidden: Accès refusé
- `404` - Not Found: Ressource non trouvée
- `409` - Conflict: Conflit (ex: réservation existante)
- `422` - Unprocessable Entity: Validation échouée
- `500` - Internal Server Error: Erreur serveur

## Rate Limiting

- **Limite**: 100 requêtes par 15 minutes
- **Header**: `X-RateLimit-Remaining`

## Pagination

Les endpoints de liste supportent la pagination:

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Éléments par page (défaut: 10, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## Webhooks (À venir)

Les webhooks permettront de recevoir des notifications pour:
- Nouvelles réservations
- Paiements reçus
- Changements de statut

---

**Version**: 1.0  
**Dernière mise à jour**: Novembre 2025
