# Audit de Sécurité des Routes API

## ✅ Système de Sécurité en Place

### Middleware d'Authentification (`/lib/auth/middleware.ts`)

Le système utilise un middleware robuste avec les fonctionnalités suivantes :

#### 1. **Authentification**
- `requireAuth` / `withAuth` : Vérifie le token JWT
- Support des tokens dans headers (`Authorization: Bearer`) et cookies
- Validation de l'utilisateur actif

#### 2. **Contrôle d'Accès par Établissement**
- `applyEstablishmentFilter(user, filters)` : Filtre automatique par établissement
  - **super_admin / root** : Accès à TOUS les établissements
  - **manager / staff** : Accès UNIQUEMENT à leur établissement

- `canAccessEstablishment(user, establishmentId)` : Vérifie l'accès à un établissement spécifique
  - **super_admin / root** : true pour tous
  - **manager / staff** : true seulement si c'est leur établissement

- `canModifyResource(user, establishmentId)` : Vérifie les droits de modification
  - **super_admin / root** : Peut tout modifier
  - **manager** : Peut modifier son établissement
  - **staff** : Ne peut pas modifier

#### 3. **Contrôle par Rôle**
- `withRole(roles, handler)` : Restreint l'accès à certains rôles
- `requireManager` : manager + super_admin
- `requireAdmin` / `requireSuperAdmin` : super_admin uniquement

#### 4. **Contrôle par Permission**
- `withPermission(permission, handler)` : Vérifie les permissions spécifiques

## 📋 État des Routes

### ✅ Routes Sécurisées (Utilisent le middleware)

#### Accommodations
- ✅ `/api/accommodations` - Filtre par établissement pour managers
- ✅ `/api/accommodations/[id]` - Vérification d'accès

#### Bookings
- ✅ `/api/bookings` - **NOUVELLEMENT SÉCURISÉ**
  - Filtre automatique par établissement
  - Vérification d'accès pour établissement spécifique
- ✅ `/api/bookings/[id]/*` - À vérifier

#### Clients
- ✅ `/api/clients` - Utilise le middleware

#### Employees
- ✅ `/api/employees` - Utilise le middleware

#### Establishments
- ✅ `/api/establishments` - Utilise le middleware

#### Expenses
- ✅ `/api/expenses` - Utilise le middleware

#### Invoices
- ✅ `/api/invoices` - Utilise le middleware

#### Leave (Congés)
- ✅ `/api/leave` - Utilise requireAuth
- ✅ `/api/leave/[id]/*` - Utilise requireAuth

#### Maintenance
- ✅ `/api/maintenance` - Utilise withRole
- ✅ `/api/maintenance/[id]/*` - Utilise verifyAuth

#### Notifications
- ✅ `/api/notifications` - Utilise requireAuth

#### Payroll (Paie)
- ✅ `/api/payroll` - Utilise requireAuth
- ✅ `/api/payroll/*` - Utilise requireAuth

#### Performance
- ✅ `/api/performance` - Utilise withRole
- ✅ `/api/performance/*` - Utilise verifyAuth

#### Reports
- ✅ `/api/reports/*` - Utilise requireAuth

#### Users
- ✅ `/api/users` - Utilise withRole
- ✅ `/api/users/*` - Utilise requireAuth

### 🔓 Routes Publiques (Pas de sécurité requise)
- `/api/public/*` - Intentionnellement publiques
- `/api/auth/*` - Authentification

### ⚠️ Routes à Vérifier

Les routes suivantes doivent être auditées pour s'assurer qu'elles utilisent correctement `applyEstablishmentFilter` :

1. `/api/attendance/*` - Présences
2. `/api/audit/*` - Logs d'audit
3. `/api/analytics/*` - Analytics
4. `/api/alerts/*` - Alertes
5. `/api/hr/analytics/*` - Analytics RH

## 🔐 Bonnes Pratiques Implémentées

### 1. Pattern Standard pour GET
```typescript
export async function GET(request: NextRequest) {
    return requireAuth(async (req, user) => {
        await connectDB();
        
        // Construire les filtres
        let filters: any = { /* filtres de recherche */ };
        
        // Appliquer le filtre d'établissement automatique
        filters = applyEstablishmentFilter(user, filters);
        
        // Récupérer les données
        const data = await Model.find(filters);
        
        return createSuccessResponse(data);
    })(request);
}
```

### 2. Pattern Standard pour POST
```typescript
export async function POST(request: NextRequest) {
    return requireAuth(async (req, user) => {
        await connectDB();
        
        const body = await req.json();
        
        // Vérifier l'accès à l'établissement
        if (body.establishmentId && !canAccessEstablishment(user, body.establishmentId)) {
            return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
        }
        
        // Assigner l'établissement si non spécifié
        if (!body.establishmentId && user.establishmentId) {
            body.establishmentId = user.establishmentId;
        }
        
        // Créer la ressource
        const resource = await Model.create({ ...body, createdBy: user.userId });
        
        return createSuccessResponse(resource, 'Créé avec succès', 201);
    })(request);
}
```

### 3. Pattern Standard pour PUT/PATCH
```typescript
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return requireAuth(async (req, user) => {
        await connectDB();
        
        const { id } = await params;
        const body = await req.json();
        
        // Récupérer la ressource
        const resource = await Model.findById(id);
        if (!resource) {
            return createErrorResponse('NOT_FOUND', 'Ressource non trouvée', 404);
        }
        
        // Vérifier l'accès
        if (!canModifyResource(user, resource.establishmentId.toString())) {
            return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
        }
        
        // Mettre à jour
        Object.assign(resource, body);
        await resource.save();
        
        return createSuccessResponse(resource, 'Mis à jour avec succès');
    })(request);
}
```

### 4. Pattern Standard pour DELETE
```typescript
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return requireAuth(async (req, user) => {
        await connectDB();
        
        const { id } = await params;
        
        // Récupérer la ressource
        const resource = await Model.findById(id);
        if (!resource) {
            return createErrorResponse('NOT_FOUND', 'Ressource non trouvée', 404);
        }
        
        // Vérifier l'accès
        if (!canModifyResource(user, resource.establishmentId.toString())) {
            return createErrorResponse('FORBIDDEN', 'Accès refusé', 403);
        }
        
        // Supprimer
        await resource.deleteOne();
        
        return createSuccessResponse(null, 'Supprimé avec succès');
    })(request);
}
```

## 🎯 Règles de Sécurité

### Hiérarchie des Rôles
1. **super_admin / root** : Accès complet à tous les établissements
2. **manager** : Accès complet à son établissement
3. **staff** : Accès lecture à son établissement

### Filtrage Automatique
- Toutes les requêtes GET doivent utiliser `applyEstablishmentFilter()`
- Les super_admins voient tout
- Les autres voient uniquement leur établissement

### Vérification d'Accès
- Toutes les opérations de modification (POST/PUT/DELETE) doivent vérifier `canAccessEstablishment()` ou `canModifyResource()`
- Toujours assigner l'établissement de l'utilisateur si non spécifié

### Logs et Audit
- Toutes les opérations sensibles doivent logger l'utilisateur (`createdBy`, `updatedBy`)
- Les suppressions doivent être soft-delete quand possible

## 📝 Prochaines Étapes

1. ✅ Sécuriser `/api/bookings` - **FAIT**
2. ⏳ Auditer et sécuriser `/api/attendance/*`
3. ⏳ Auditer et sécuriser `/api/audit/*`
4. ⏳ Auditer et sécuriser `/api/analytics/*`
5. ⏳ Auditer et sécuriser `/api/alerts/*`
6. ⏳ Vérifier toutes les routes `[id]` pour s'assurer qu'elles vérifient l'accès

## 🧪 Tests de Sécurité Recommandés

### Test 1 : Isolation des Établissements
- Créer 2 établissements avec des managers différents
- Vérifier que Manager A ne peut pas voir/modifier les données de l'Établissement B

### Test 2 : Accès Super Admin
- Vérifier que super_admin peut accéder à tous les établissements
- Vérifier que super_admin peut modifier toutes les ressources

### Test 3 : Tentative d'Accès Non Autorisé
- Essayer d'accéder à une ressource d'un autre établissement
- Vérifier que l'API retourne 403 Forbidden

### Test 4 : Filtrage Automatique
- Se connecter en tant que manager
- Vérifier que les listes ne contiennent que les données de son établissement
