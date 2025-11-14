# 🔐 TODO - Sécurité par Établissement

## ✅ Ce qui a été fait

### 1. Middleware de Sécurité Créé
**Fichier:** `middleware/establishmentAccess.ts`

**Fonctions disponibles:**
- ✅ `canAccessEstablishment()` - Vérifie l'accès à un établissement
- ✅ `getEstablishmentFilter()` - Retourne le filtre MongoDB
- ✅ `canModifyEstablishmentResource()` - Vérifie les droits de modification
- ✅ `validateResourceAccess()` - Validation complète d'accès
- ✅ `applySecurityFilter()` - Applique le filtre de sécurité
- ✅ `canViewAllEstablishments()` - Vérifie si peut voir tous
- ✅ `getEstablishmentFilterFromQuery()` - Filtre depuis query params
- ✅ `logAccess()` - Logging des accès
- ✅ `accessDeniedResponse()` - Réponse d'erreur standardisée

### 2. Documentation Créée
- ✅ `SECURITY_ESTABLISHMENT_ACCESS.md` - Guide complet
- ✅ `SECURITY_TODO.md` - Ce fichier
- ✅ Exemples de code pour chaque cas d'usage
- ✅ Scénarios de test

### 3. Modèle User
- ✅ Champ `establishmentId` existe
- ✅ Index sur `establishmentId`
- ✅ Rôles définis (root, super_admin, manager, staff)
- ✅ Permissions par rôle

## ⏳ Ce qui reste à faire

### Priorité 1 - CRITIQUE (À faire immédiatement)

#### Routes API à Sécuriser

**Hébergements:**
```bash
- [ ] app/api/accommodations/route.ts (GET, POST)
- [ ] app/api/accommodations/[id]/route.ts (GET, PUT, DELETE)
```

**Réservations:**
```bash
- [ ] app/api/bookings/route.ts (GET, POST)
- [ ] app/api/bookings/[id]/route.ts (GET, PUT, DELETE)
- [ ] app/api/bookings/[id]/confirm/route.ts
- [ ] app/api/bookings/[id]/cancel/route.ts
- [ ] app/api/bookings/[id]/checkin/route.ts
- [ ] app/api/bookings/[id]/checkout/route.ts
```

**Clients:**
```bash
- [ ] app/api/clients/route.ts (GET, POST)
- [ ] app/api/clients/[id]/route.ts (GET, PUT, DELETE)
```

**Dépenses:**
```bash
- [ ] app/api/expenses/route.ts (GET, POST)
- [ ] app/api/expenses/[id]/route.ts (GET, PUT, DELETE)
- [ ] app/api/expenses/[id]/approve/route.ts
```

**Factures:**
```bash
- [ ] app/api/invoices/route.ts (GET, POST)
- [ ] app/api/invoices/[id]/route.ts (GET, PUT, DELETE)
- [ ] app/api/invoices/[id]/send/route.ts
```

### Priorité 2 - HAUTE (Cette semaine)

**Employés (RH):**
```bash
- [ ] app/api/employees/route.ts (GET, POST)
- [ ] app/api/employees/[id]/route.ts (GET, PUT, DELETE)
```

**Présences:**
```bash
- [ ] app/api/attendance/route.ts (GET, POST)
- [ ] app/api/attendance/[id]/route.ts (GET, PUT, DELETE)
```

**Congés:**
```bash
- [ ] app/api/leave/route.ts (GET, POST)
- [ ] app/api/leave/[id]/route.ts (GET, PUT, DELETE)
- [ ] app/api/leave/[id]/approve/route.ts
```

**Paie:**
```bash
- [ ] app/api/payroll/route.ts (GET, POST)
- [ ] app/api/payroll/[id]/route.ts (GET, PUT, DELETE)
- [ ] app/api/payroll/generate/route.ts
```

### Priorité 3 - MOYENNE (Ce mois)

**Analytics:**
```bash
- [ ] app/api/analytics/financial/route.ts
- [ ] app/api/analytics/occupancy/route.ts
- [ ] app/api/analytics/revenue/route.ts
```

**Rapports:**
```bash
- [ ] app/api/reports/financial/route.ts
- [ ] app/api/reports/occupancy/route.ts
- [ ] app/api/reports/hr/route.ts
- [ ] app/api/reports/comparison/route.ts
```

**Maintenance:**
```bash
- [ ] app/api/maintenance/route.ts (GET, POST)
- [ ] app/api/maintenance/[id]/route.ts (GET, PUT, DELETE)
```

## 📝 Template de Mise à Jour

### Pour chaque route, suivre ce template:

```typescript
// 1. Importer le middleware
import { 
  getEstablishmentFilter,
  validateResourceAccess,
  canModifyEstablishmentResource,
  accessDeniedResponse
} from '@/middleware/establishmentAccess';

// 2. Importer la fonction d'authentification
import { getAuthenticatedUser } from '@/lib/auth'; // À créer

// 3. GET - Liste avec filtre
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Filtre établissement
    const establishmentFilter = getEstablishmentFilter(user);
    
    // Query avec filtre
    const items = await Model.find(establishmentFilter);
    
    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// 4. POST - Création avec validation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validation accès établissement
    if (!canModifyEstablishmentResource(user, body.establishmentId)) {
      return NextResponse.json(
        accessDeniedResponse('Accès refusé à cet établissement'),
        { status: 403 }
      );
    }

    const item = await Model.create(body);
    
    return NextResponse.json({
      success: true,
      data: item
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// 5. PUT - Modification avec validation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const item = await Model.findById(params.id);
    if (!item) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }

    // Validation accès
    const access = validateResourceAccess(user, item, 'write');
    if (!access.allowed) {
      return NextResponse.json(
        accessDeniedResponse(access.reason),
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await Model.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// 6. DELETE - Suppression avec validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const item = await Model.findById(params.id);
    if (!item) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }

    const access = validateResourceAccess(user, item, 'delete');
    if (!access.allowed) {
      return NextResponse.json(
        accessDeniedResponse(access.reason),
        { status: 403 }
      );
    }

    await Model.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Ressource supprimée'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## 🧪 Tests à Effectuer

### Pour chaque route mise à jour:

1. **Test Manager - Accès à son établissement**
   ```bash
   # Créer un manager pour EST-001
   # Se connecter avec ce manager
   # Vérifier qu'il voit uniquement EST-001
   ```

2. **Test Manager - Accès refusé autre établissement**
   ```bash
   # Tenter d'accéder à une ressource de EST-002
   # Doit retourner 403 Forbidden
   ```

3. **Test Staff - Lecture seule**
   ```bash
   # Se connecter comme staff
   # Vérifier lecture OK
   # Tenter modification -> 403
   ```

4. **Test Super Admin - Accès total**
   ```bash
   # Se connecter comme super_admin
   # Vérifier accès à tous les établissements
   ```

## 📊 Progression

### Routes Sécurisées: 0/30+ (0%)

```
[                                        ] 0%
```

### Par Catégorie:

| Catégorie | Routes | Sécurisées | % |
|-----------|--------|------------|---|
| Hébergements | 2 | 0 | 0% |
| Réservations | 7 | 0 | 0% |
| Clients | 2 | 0 | 0% |
| Dépenses | 3 | 0 | 0% |
| Factures | 3 | 0 | 0% |
| Employés | 2 | 0 | 0% |
| Présences | 2 | 0 | 0% |
| Congés | 3 | 0 | 0% |
| Paie | 3 | 0 | 0% |
| Analytics | 3 | 0 | 0% |
| Rapports | 4 | 0 | 0% |
| **TOTAL** | **34** | **0** | **0%** |

## 🎯 Objectifs

### Cette Semaine
- [ ] Sécuriser toutes les routes Priorité 1 (15 routes)
- [ ] Créer fonction `getAuthenticatedUser()`
- [ ] Tests unitaires middleware
- [ ] Tests d'intégration 5 routes

### Ce Mois
- [ ] Sécuriser toutes les routes Priorité 2 (10 routes)
- [ ] Sécuriser toutes les routes Priorité 3 (9 routes)
- [ ] Tests E2E complets
- [ ] Dashboard de sécurité
- [ ] Logs d'audit

### Trimestre
- [ ] Monitoring en temps réel
- [ ] Alertes automatiques
- [ ] Rapports de sécurité
- [ ] Audit externe

## 🚨 Points d'Attention

### Critique
1. **Ne JAMAIS déployer en production sans cette sécurité**
2. **Tester avec TOUS les rôles avant déploiement**
3. **Vérifier que establishmentId est toujours présent**

### Important
1. Documenter chaque exception aux règles
2. Logger toutes les tentatives d'accès refusé
3. Réviser les permissions régulièrement

### Recommandé
1. Créer des tests automatisés
2. Monitoring des accès suspects
3. Audit trimestriel

## 📞 Support

En cas de question sur l'implémentation:
1. Consulter `SECURITY_ESTABLISHMENT_ACCESS.md`
2. Voir les exemples de code
3. Tester avec le template fourni

---

**Status:** 🔴 URGENT - À implémenter immédiatement  
**Priorité:** CRITIQUE  
**Responsable:** Équipe Dev  
**Deadline:** Avant mise en production  
**Date:** 2024-01-15
