# Rapport d'Implémentation : Filtrage par Établissement dans le Backoffice

## Vue d'Ensemble

Ce rapport détaille l'implémentation complète du système de filtrage par établissement pour les utilisateurs non-administrateurs (managers et staff) dans le backoffice de l'application Ruzizi Hotel Platform.

## Architecture Actuelle

### Système d'Authentification
- **Middleware d'authentification** : `lib/auth/middleware.ts`
- **Types utilisateur** : `types/user.types.ts`
- **Rôles définis** : `root`, `super_admin`, `manager`, `staff`
- **JWT Payload** inclut `establishmentId` pour les utilisateurs liés à un établissement

### État des Implémentations Existantes

#### ✅ APIs Correctement Implémentées
- **Bookings API** (`app/api/bookings/route.ts`)
  - Utilise `applyEstablishmentFilter()` dans le middleware
  - Vérifie l'accès avec `canAccessEstablishment()`
  - Filtre automatiquement selon le rôle de l'utilisateur

#### ❌ APIs Nécessitant des Corrections
- **Users API** (`app/api/users/route.ts`)
  - **PROBLÈME CRITIQUE** : Utilise `withRole(['super_admin'])` qui bloque complètement l'accès aux managers et staff
  - **IMPACT** : Les managers ne peuvent pas voir les utilisateurs de leur établissement

#### ❌ APIs Nécessitant l'Implémentation
- **Establishments API** : Partiellement implémentée (filtre par managerId)
- **Accommodations API** : Non implémentée
- **Clients API** : Non implémentée
- **Invoices API** : Non implémentée
- **Expenses API** : Non implémentée

## Stratégie d'Implémentation

### Pattern Générique pour Toutes les APIs

#### 1. Modification du Middleware API

```typescript
// Pattern générique pour les APIs avec filtrage par établissement
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Appliquer le filtre d'établissement selon le rôle
      const filters = applyEstablishmentFilter(user, {
        // ... autres filtres depuis searchParams
      });

      // Récupérer les données avec filtrage
      const result = await Service.getAll(filters);

      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse('ERROR', error.message, 500);
    }
  })(request);
}
```

#### 2. Fonctions Utiles du Middleware

```typescript
// lib/auth/middleware.ts - Fonctions existantes à utiliser

/**
 * Applique le filtre d'établissement selon le rôle utilisateur
 */
export function applyEstablishmentFilter(
  user: AuthenticatedUser,
  filters: any = {}
): any {
  // Root et super_admin voient tout
  if (user.role === 'root' || user.role === 'super_admin') {
    return filters;
  }

  // Manager et staff ne voient que leur établissement
  if ((user.role === 'manager' || user.role === 'staff') && user.establishmentId) {
    return {
      ...filters,
      establishmentId: user.establishmentId,
    };
  }

  return filters;
}

/**
 * Vérifie si l'utilisateur peut accéder à une ressource d'établissement
 */
export function canAccessEstablishment(
  user: AuthenticatedUser,
  resourceEstablishmentId: string
): boolean {
  // Root et super_admin ont accès à tout
  if (user.role === 'root' || user.role === 'super_admin') {
    return true;
  }

  // Manager et staff ne peuvent accéder qu'à leur établissement
  return user.establishmentId === resourceEstablishmentId;
}
```

### Corrections Prioritaires

#### 1. Correction Critique : Users API

**Fichier** : `app/api/users/route.ts`

**Problème** : `withRole(['super_admin'])` bloque tous les autres rôles

**Solution** :
```typescript
// Avant (PROBLÉMATIQUE)
export const GET = withRole(['super_admin'], async (request: NextRequest, user) => {

// Après (CORRECT)
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Appliquer le filtre d'établissement
      const filters = applyEstablishmentFilter(user, {
        role: searchParams.get('role') || undefined,
        establishmentId: searchParams.get('establishmentId') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true :
                 searchParams.get('isActive') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      const result = await UserService.getAll(filters);
      return createSuccessResponse({
        users: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      return createErrorResponse('DATABASE_ERROR', error.message || 'Erreur serveur', 500);
    }
  })(request);
}
```

#### 2. Correction : Establishments API

**Fichier** : `app/api/establishments/route.ts`

**État actuel** : Filtre partiellement implémenté

**Amélioration** :
```typescript
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters = EstablishmentFilterSchema.parse({
        city: searchParams.get('city') || undefined,
        pricingMode: searchParams.get('pricingMode') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true :
                 searchParams.get('isActive') === 'false' ? false : undefined,
        managerId: searchParams.get('managerId') || undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '100'),
      });

      // Appliquer le filtre d'établissement pour les managers
      const establishmentFilters = applyEstablishmentFilter(user, filters);

      const result = await EstablishmentService.getAll(establishmentFilters, filters.page, filters.limit);

      return createSuccessResponse(result);
    } catch (error) {
      // ... gestion d'erreur
    }
  })(request);
}
```

#### 3. Implémentation : Accommodations API

**Fichier** : `app/api/accommodations/route.ts`

**État actuel** : Non implémenté

**Implémentation** :
```typescript
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters = AccommodationFilterSchema.parse({
        establishmentId: searchParams.get('establishmentId') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true :
                 searchParams.get('isActive') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
      });

      // Appliquer le filtre d'établissement
      const accommodationFilters = applyEstablishmentFilter(user, filters);

      const result = await AccommodationService.getAll(accommodationFilters);

      return createSuccessResponse(result);
    } catch (error) {
      // ... gestion d'erreur
    }
  })(request);
}
```

### Modifications Frontend

#### 1. Hooks React Query

**Fichier** : `hooks/useQueries.ts`

**Modification des hooks existants** :
```typescript
// Avant
export function useBookings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.bookings, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiClient.get(`/api/bookings?${params}`);
      return response.data;
    },
    // ...
  });
}

// Après - Le filtrage est maintenant géré côté serveur
// Les hooks restent identiques car le filtrage automatique
// est appliqué par l'API selon le rôle de l'utilisateur connecté
```

#### 2. Composants Frontend

**Principe** : Les composants frontend n'ont pas besoin de modifications majeures car le filtrage est appliqué automatiquement côté serveur selon le rôle de l'utilisateur authentifié.

## Considérations de Sécurité

### 1. Validation des Permissions

```typescript
// Vérification d'accès à une ressource spécifique
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(async (req, user) => {
    const resourceId = params.id;

    // Vérifier si l'utilisateur peut accéder à cette ressource
    const canAccess = await canAccessResource(user, resourceId, 'booking');
    if (!canAccess) {
      return createErrorResponse('FORBIDDEN', 'Accès refusé à cette ressource', 403);
    }

    // ... continuer le traitement
  })(request);
}
```

### 2. Protection contre les Attaques

- **Injection de paramètres** : Utiliser les schémas Zod pour valider tous les paramètres
- **Accès non autorisé** : Vérifier systématiquement les permissions
- **Fuite de données** : Ne retourner que les données autorisées

### 3. Audit et Logging

```typescript
// Middleware d'audit
export function withAudit(action: string) {
  return (handler: Function) => async (request: NextRequest, user: AuthenticatedUser) => {
    const startTime = Date.now();

    try {
      const result = await handler(request, user);

      // Logger l'action réussie
      await AuditService.log({
        userId: user.userId,
        action,
        resource: request.url.pathname,
        success: true,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Logger l'échec
      await AuditService.log({
        userId: user.userId,
        action,
        resource: request.url.pathname,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  };
}
```

### 4. Gestion des Erreurs

```typescript
// Réponses d'erreur standardisées
export function createSecurityErrorResponse(message: string): NextResponse {
  return createErrorResponse('SECURITY_ERROR', message, 403);
}

export function createAccessDeniedResponse(resource: string): NextResponse {
  return createSecurityErrorResponse(`Accès refusé à la ressource: ${resource}`);
}
```

## Plan de Tests

### 1. Tests Unitaires

```typescript
// tests/auth/middleware.test.ts
describe('applyEstablishmentFilter', () => {
  it('should not filter for super_admin', () => {
    const user = { role: 'super_admin', establishmentId: undefined };
    const filters = { status: 'active' };

    const result = applyEstablishmentFilter(user, filters);
    expect(result).toEqual(filters);
  });

  it('should filter by establishmentId for manager', () => {
    const user = { role: 'manager', establishmentId: 'est123' };
    const filters = { status: 'active' };

    const result = applyEstablishmentFilter(user, filters);
    expect(result).toEqual({
      status: 'active',
      establishmentId: 'est123'
    });
  });
});
```

### 2. Tests d'Intégration

```typescript
// tests/api/bookings.integration.test.ts
describe('Bookings API - Establishment Filtering', () => {
  it('should return only bookings from user establishment for manager', async () => {
    // Créer un manager avec establishmentId
    const managerToken = await createAuthenticatedUser('manager', 'est123');

    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${managerToken}`);

    // Vérifier que seules les réservations de est123 sont retournées
    expect(response.body.data.every(booking =>
      booking.establishmentId === 'est123'
    )).toBe(true);
  });
});
```

### 3. Tests de Sécurité

```typescript
describe('Security Tests', () => {
  it('should prevent manager from accessing other establishment bookings', async () => {
    const managerToken = await createAuthenticatedUser('manager', 'est123');

    // Tenter d'accéder aux réservations d'un autre établissement
    const response = await request(app)
      .get('/api/bookings?establishmentId=est456')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(403);
  });
});
```

## Phases d'Implémentation

### Phase 1 : Corrections Critiques (Priorité Haute)
1. **Corriger Users API** - Débloquer l'accès des managers
2. **Corriger Establishments API** - Améliorer le filtrage existant

### Phase 2 : Implémentations Manquantes (Priorité Moyenne)
1. **Accommodations API** - Implémenter le filtrage complet
2. **Clients API** - Implémenter le filtrage complet
3. **Invoices API** - Implémenter le filtrage complet
4. **Expenses API** - Implémenter le filtrage complet

### Phase 3 : Améliorations et Sécurité (Priorité Basse)
1. **Audit logging** - Implémenter le suivi des actions
2. **Rate limiting** - Protection contre les abus
3. **Performance** - Optimisation des requêtes

## Recommandations Finales

### 1. Migration Progressive
- Commencer par les corrections critiques
- Tester chaque API individuellement
- Déployer par petites itérations

### 2. Monitoring et Alertes
- Surveiller les logs d'erreur
- Alertes sur les tentatives d'accès non autorisé
- Métriques de performance des APIs

### 3. Documentation
- Documenter les règles de filtrage pour chaque API
- Maintenir à jour la documentation développeur
- Créer des guides pour les tests de sécurité

### 4. Maintenance
- Revue régulière des permissions
- Audit de sécurité trimestriel
- Mise à jour des dépendances de sécurité

## Conclusion

L'implémentation du filtrage par établissement est essentielle pour la sécurité et l'intégrité des données dans une architecture multi-établissements. Les corrections identifiées, particulièrement pour l'API Users, sont critiques et doivent être prioritaires.

Le pattern établi par l'API Bookings démontre une approche robuste qui peut être reproduite pour toutes les autres APIs. L'utilisation systématique des fonctions `applyEstablishmentFilter()` et `canAccessEstablishment()` assure une implémentation cohérente et sécurisée.

---

**Document généré le** : Décembre 2025
**Version** : 1.0
**Auteur** : Kilo Code - Technical Leader