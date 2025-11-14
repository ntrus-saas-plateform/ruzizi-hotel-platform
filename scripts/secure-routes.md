# Plan de Sécurisation des Routes API

## Routes à Sécuriser avec Filtre par Établissement

### ✅ Déjà Sécurisées
- `/api/bookings` - Réservations

### 🔒 À Sécuriser

#### Haute Priorité (Données sensibles)
1. `/api/accommodations` - Hébergements
2. `/api/clients` - Clients
3. `/api/employees` - Employés
4. `/api/expenses` - Dépenses
5. `/api/invoices` - Factures
6. `/api/maintenance` - Maintenance
7. `/api/attendance` - Présences
8. `/api/payroll` - Paie
9. `/api/leave` - Congés
10. `/api/performance` - Évaluations

#### Moyenne Priorité (Rapports et Analytics)
11. `/api/analytics/financial` - Analytics financières
12. `/api/reports/*` - Tous les rapports
13. `/api/hr/analytics/*` - Analytics RH
14. `/api/audit` - Audit logs

#### Basse Priorité (Admin uniquement)
15. `/api/users` - Utilisateurs (super_admin only)
16. `/api/establishments` - Établissements (super_admin only)
17. `/api/backup/*` - Sauvegardes (super_admin only)

#### Routes Publiques (Pas de sécurité établissement)
- `/api/public/*` - Routes publiques
- `/api/auth/*` - Authentification

## Règles de Sécurité

### Pour chaque route :
1. **Authentification** : Utiliser `secureRoute()`
2. **Filtre établissement** : Utiliser `getEstablishmentFilter(user)`
3. **Vérification accès** : Utiliser `checkEstablishmentAccess()` pour les ressources spécifiques
4. **Super Admin** : Accès complet à tous les établissements
5. **Autres rôles** : Accès uniquement à leur établissement

### Pattern de Code Standard

```typescript
import { secureRoute, getEstablishmentFilter, checkEstablishmentAccess } from '@/lib/apiSecurity';
import { forbiddenResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // 1. Authentification
    const authResult = await secureRoute(request, { requireEstablishment: true });
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    await connectDB();

    // 2. Filtres avec établissement
    const filters: any = {
        ...getEstablishmentFilter(user), // Filtre automatique
    };

    // 3. Récupération des données
    const data = await Model.find(filters);

    return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
    // 1. Authentification
    const authResult = await secureRoute(request, { requireEstablishment: true });
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    await connectDB();

    const body = await request.json();

    // 2. Vérifier l'établissement
    if (body.establishmentId && !checkEstablishmentAccess(user, body.establishmentId)) {
        return NextResponse.json(forbiddenResponse('Accès refusé'), { status: 403 });
    }

    // 3. Assigner l'établissement si non spécifié
    if (!body.establishmentId && user.establishmentId) {
        body.establishmentId = user.establishmentId;
    }

    // 4. Créer la ressource
    const resource = await Model.create({ ...body, createdBy: user.id });

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
}
```
