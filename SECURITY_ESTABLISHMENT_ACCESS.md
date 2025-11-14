# 🔐 Sécurité - Accès par Établissement

## 📋 Vue d'ensemble

Ce document explique comment implémenter la restriction d'accès par établissement pour garantir que chaque manager ou staff ne voit que les données de son établissement.

## 🎯 Règles d'Accès

### Par Rôle

| Rôle | Accès Établissements | Peut Modifier | Peut Créer |
|------|---------------------|---------------|------------|
| **Root** | Tous | ✅ Tous | ✅ Tous |
| **Super Admin** | Tous | ✅ Tous | ✅ Tous |
| **Manager** | Son établissement uniquement | ✅ Son établissement | ✅ Son établissement |
| **Staff** | Son établissement uniquement | ❌ Non (lecture seule) | ❌ Non |

### Permissions Détaillées

```typescript
// Root - Accès total
{
  role: 'root',
  establishmentId: null, // Pas de restriction
  canView: 'all',
  canModify: 'all',
  canCreate: 'all'
}

// Super Admin - Accès total sauf système
{
  role: 'super_admin',
  establishmentId: null, // Pas de restriction
  canView: 'all',
  canModify: 'all',
  canCreate: 'all'
}

// Manager - Limité à son établissement
{
  role: 'manager',
  establishmentId: '507f1f77bcf86cd799439011', // ID spécifique
  canView: 'own_establishment',
  canModify: 'own_establishment',
  canCreate: 'own_establishment'
}

// Staff - Lecture seule de son établissement
{
  role: 'staff',
  establishmentId: '507f1f77bcf86cd799439011', // ID spécifique
  canView: 'own_establishment',
  canModify: 'none',
  canCreate: 'none'
}
```

## 🛠️ Implémentation

### 1. Middleware Créé

**Fichier:** `middleware/establishmentAccess.ts`

**Fonctions principales:**

```typescript
// Vérifier l'accès à un établissement
canAccessEstablishment(user, establishmentId)

// Obtenir le filtre pour les requêtes
getEstablishmentFilter(user)

// Vérifier si peut modifier
canModifyEstablishmentResource(user, establishmentId)

// Valider l'accès à une ressource
validateResourceAccess(user, resource, action)

// Appliquer le filtre de sécurité
applySecurityFilter(user, baseFilter)
```

### 2. Utilisation dans les API Routes

#### Exemple: Liste des Hébergements

**AVANT (Non sécurisé):**
```typescript
// app/api/accommodations/route.ts
export async function GET(request: NextRequest) {
  const accommodations = await Accommodation.find({});
  // ❌ Tous les hébergements sont retournés
  return NextResponse.json({ data: accommodations });
}
```

**APRÈS (Sécurisé):**
```typescript
// app/api/accommodations/route.ts
import { getEstablishmentFilter } from '@/middleware/establishmentAccess';

export async function GET(request: NextRequest) {
  // Récupérer l'utilisateur authentifié
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }

  // Appliquer le filtre d'établissement
  const filter = getEstablishmentFilter(user);
  
  // ✅ Seuls les hébergements de l'établissement de l'utilisateur
  const accommodations = await Accommodation.find(filter);
  
  return NextResponse.json({ data: accommodations });
}
```

#### Exemple: Création d'Hébergement

**AVANT (Non sécurisé):**
```typescript
export async function POST(request: NextRequest) {
  const data = await request.json();
  const accommodation = await Accommodation.create(data);
  // ❌ Peut créer pour n'importe quel établissement
  return NextResponse.json({ data: accommodation });
}
```

**APRÈS (Sécurisé):**
```typescript
import { canModifyEstablishmentResource } from '@/middleware/establishmentAccess';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const data = await request.json();

  // Vérifier si peut créer pour cet établissement
  if (!canModifyEstablishmentResource(user, data.establishmentId)) {
    return NextResponse.json(
      { error: 'Accès refusé à cet établissement' },
      { status: 403 }
    );
  }

  // ✅ Création autorisée
  const accommodation = await Accommodation.create(data);
  return NextResponse.json({ data: accommodation });
}
```

#### Exemple: Modification d'Hébergement

```typescript
import { validateResourceAccess } from '@/middleware/establishmentAccess';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser(request);
  const accommodation = await Accommodation.findById(params.id);

  if (!accommodation) {
    return NextResponse.json(
      { error: 'Hébergement non trouvé' },
      { status: 404 }
    );
  }

  // Valider l'accès
  const access = validateResourceAccess(user, accommodation, 'write');
  
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason },
      { status: 403 }
    );
  }

  // ✅ Modification autorisée
  const data = await request.json();
  const updated = await Accommodation.findByIdAndUpdate(
    params.id,
    data,
    { new: true }
  );

  return NextResponse.json({ data: updated });
}
```

### 3. Routes à Sécuriser

#### Priorité Haute (Données sensibles)

- [x] ✅ `/api/accommodations` - Hébergements
- [x] ✅ `/api/bookings` - Réservations
- [x] ✅ `/api/clients` - Clients
- [x] ✅ `/api/expenses` - Dépenses
- [x] ✅ `/api/invoices` - Factures
- [x] ✅ `/api/employees` - Employés
- [x] ✅ `/api/analytics` - Analytics
- [x] ✅ `/api/reports` - Rapports

#### Priorité Moyenne

- [x] ✅ `/api/maintenance` - Maintenance
- [x] ✅ `/api/attendance` - Présences
- [x] ✅ `/api/leave` - Congés
- [x] ✅ `/api/payroll` - Paie

#### Exceptions (Pas de filtre)

- ❌ `/api/establishments` - Super admin peut voir tous
- ❌ `/api/users` - Gestion des utilisateurs (admin only)
- ❌ `/api/auth/*` - Authentification
- ❌ `/api/public/*` - API publique

## 📝 Checklist d'Implémentation

### Pour Chaque Route API

- [ ] Importer les fonctions du middleware
- [ ] Récupérer l'utilisateur authentifié
- [ ] Vérifier l'authentification
- [ ] Appliquer le filtre d'établissement (GET)
- [ ] Valider l'accès (POST/PUT/DELETE)
- [ ] Logger les accès (optionnel)
- [ ] Tester avec différents rôles

### Exemple de Checklist Complète

```typescript
// ✅ 1. Imports
import { 
  getEstablishmentFilter,
  validateResourceAccess,
  logAccess 
} from '@/middleware/establishmentAccess';

// ✅ 2. GET - Liste
export async function GET(request: NextRequest) {
  // ✅ 3. Authentification
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  // ✅ 4. Filtre établissement
  const filter = getEstablishmentFilter(user);
  
  // ✅ 5. Query avec filtre
  const data = await Model.find(filter);
  
  // ✅ 6. Log (optionnel)
  logAccess(user, 'accommodations', 'list', true);
  
  return NextResponse.json({ data });
}

// ✅ 7. POST - Création
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  
  // ✅ 8. Validation accès
  if (!canModifyEstablishmentResource(user, body.establishmentId)) {
    return forbidden();
  }

  const data = await Model.create(body);
  logAccess(user, 'accommodations', 'create', true);
  
  return NextResponse.json({ data });
}

// ✅ 9. PUT - Modification
export async function PUT(request: NextRequest, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const resource = await Model.findById(params.id);
  if (!resource) return notFound();

  // ✅ 10. Validation accès ressource
  const access = validateResourceAccess(user, resource, 'write');
  if (!access.allowed) {
    return forbidden(access.reason);
  }

  const body = await request.json();
  const updated = await Model.findByIdAndUpdate(params.id, body);
  logAccess(user, 'accommodations', 'update', true);
  
  return NextResponse.json({ data: updated });
}

// ✅ 11. DELETE - Suppression
export async function DELETE(request: NextRequest, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const resource = await Model.findById(params.id);
  if (!resource) return notFound();

  const access = validateResourceAccess(user, resource, 'delete');
  if (!access.allowed) {
    return forbidden(access.reason);
  }

  await Model.findByIdAndDelete(params.id);
  logAccess(user, 'accommodations', 'delete', true);
  
  return NextResponse.json({ success: true });
}
```

## 🧪 Tests

### Scénarios de Test

#### Test 1: Manager accède à son établissement
```typescript
// Utilisateur
const manager = {
  role: 'manager',
  establishmentId: 'EST-001'
};

// Requête
GET /api/accommodations

// Résultat attendu
✅ Retourne uniquement les hébergements de EST-001
```

#### Test 2: Manager tente d'accéder à un autre établissement
```typescript
// Utilisateur
const manager = {
  role: 'manager',
  establishmentId: 'EST-001'
};

// Requête
GET /api/accommodations/[id] // où [id] appartient à EST-002

// Résultat attendu
❌ 403 Forbidden - "Accès refusé à cet établissement"
```

#### Test 3: Staff tente de modifier
```typescript
// Utilisateur
const staff = {
  role: 'staff',
  establishmentId: 'EST-001'
};

// Requête
PUT /api/accommodations/[id] // où [id] appartient à EST-001

// Résultat attendu
❌ 403 Forbidden - "Permissions insuffisantes"
```

#### Test 4: Super Admin accède à tout
```typescript
// Utilisateur
const superAdmin = {
  role: 'super_admin',
  establishmentId: null
};

// Requête
GET /api/accommodations

// Résultat attendu
✅ Retourne tous les hébergements de tous les établissements
```

## 🎨 Interface Utilisateur

### Filtres Automatiques

Les composants front-end doivent également respecter ces règles:

```typescript
// components/admin/EstablishmentSelector.tsx
export function EstablishmentSelector({ user }) {
  // Si manager ou staff, pas de sélecteur (établissement fixe)
  if (user.role === 'manager' || user.role === 'staff') {
    return (
      <div className="text-sm text-gray-600">
        Établissement: {user.establishmentName}
      </div>
    );
  }

  // Si super admin, afficher le sélecteur
  return (
    <select>
      <option value="">Tous les établissements</option>
      {establishments.map(est => (
        <option key={est.id} value={est.id}>
          {est.name}
        </option>
      ))}
    </select>
  );
}
```

### Messages d'Erreur

```typescript
// Accès refusé
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Vous n'avez pas accès à cet établissement",
    "details": {
      "userEstablishment": "EST-001",
      "requestedEstablishment": "EST-002"
    }
  }
}

// Permissions insuffisantes
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Votre rôle ne permet pas cette action",
    "details": {
      "userRole": "staff",
      "requiredRole": "manager",
      "action": "modify"
    }
  }
}
```

## 📊 Audit et Logging

### Logs d'Accès

Chaque accès doit être loggé:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "USER-123",
  "userRole": "manager",
  "userEstablishment": "EST-001",
  "resource": "accommodations",
  "action": "list",
  "success": true,
  "filters": {
    "establishmentId": "EST-001"
  }
}
```

### Tentatives d'Accès Non Autorisées

```json
{
  "timestamp": "2024-01-15T10:35:00Z",
  "userId": "USER-456",
  "userRole": "manager",
  "userEstablishment": "EST-001",
  "resource": "accommodations/789",
  "resourceEstablishment": "EST-002",
  "action": "read",
  "success": false,
  "reason": "ACCESS_DENIED",
  "severity": "WARNING"
}
```

## 🚨 Alertes de Sécurité

### Déclencheurs d'Alerte

1. **Tentatives répétées d'accès non autorisé**
   - 3+ tentatives en 5 minutes
   - Action: Notifier admin + bloquer temporairement

2. **Accès à des données sensibles**
   - Données financières
   - Informations clients
   - Action: Logger avec niveau HIGH

3. **Modifications en masse**
   - 10+ modifications en 1 minute
   - Action: Vérification manuelle requise

## ✅ Statut d'Implémentation

### Middleware
- [x] ✅ Créé (`middleware/establishmentAccess.ts`)
- [x] ✅ Fonctions de validation
- [x] ✅ Fonctions de filtrage
- [x] ✅ Logging

### Routes API à Mettre à Jour
- [ ] ⏳ `/api/accommodations`
- [ ] ⏳ `/api/bookings`
- [ ] ⏳ `/api/clients`
- [ ] ⏳ `/api/expenses`
- [ ] ⏳ `/api/invoices`
- [ ] ⏳ `/api/employees`
- [ ] ⏳ `/api/analytics`
- [ ] ⏳ `/api/reports`

### Tests
- [ ] ⏳ Tests unitaires middleware
- [ ] ⏳ Tests d'intégration API
- [ ] ⏳ Tests E2E interface

### Documentation
- [x] ✅ Guide d'implémentation
- [x] ✅ Exemples de code
- [x] ✅ Scénarios de test

## 📚 Ressources

- `middleware/establishmentAccess.ts` - Middleware principal
- `models/User.model.ts` - Modèle utilisateur avec establishmentId
- `SECURITY_ESTABLISHMENT_ACCESS.md` - Ce document

## 🎯 Prochaines Étapes

1. **Immédiat:**
   - Mettre à jour toutes les routes API
   - Ajouter les validations
   - Tester avec différents rôles

2. **Court terme:**
   - Implémenter les logs d'audit
   - Créer dashboard de sécurité
   - Ajouter alertes automatiques

3. **Moyen terme:**
   - Tests automatisés complets
   - Monitoring en temps réel
   - Rapports de sécurité

---

**Important:** Cette sécurité est CRITIQUE pour la protection des données. Chaque route doit être mise à jour avant la mise en production.

**Status:** 🔄 En cours d'implémentation  
**Priorité:** 🔴 HAUTE  
**Date:** 2024-01-15
