# 🔐 Guide de Sécurité - Ruzizi Hôtel Platform

## 📖 Vue d'Ensemble

Ce document explique comment utiliser et maintenir le système de sécurité de la plateforme Ruzizi Hôtel.

## 🎯 Objectifs de Sécurité

1. **Authentification:** Vérifier l'identité des utilisateurs
2. **Autorisation:** Contrôler l'accès aux ressources
3. **Isolation:** Séparer les données par établissement
4. **Audit:** Tracer toutes les actions sensibles

## 🚀 Démarrage Rapide

### Vérifier la Sécurité

```bash
# Vérifier toutes les routes
npm run check:routes

# Tester les fonctions de sécurité
npm run test:security
```

### Résultat Attendu

```
✅ TOUTES LES ROUTES SONT SÉCURISÉES!
✅ Le système est prêt pour la production.
```

## 🔑 Hiérarchie des Rôles

| Rôle | Niveau | Accès | Permissions |
|------|--------|-------|-------------|
| **root** | 4 | Tous les établissements | Toutes |
| **super_admin** | 3 | Tous les établissements | Toutes |
| **manager** | 2 | Son établissement | Lecture + Écriture |
| **staff** | 1 | Son établissement | Lecture seule |

## 🛡️ Utilisation dans les Routes

### 1. Authentification Simple

Pour une route qui nécessite juste une authentification :

```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    // user est automatiquement disponible
    // user.userId, user.role, user.establishmentId
    
    return NextResponse.json({ data: 'protected' });
  })(request);
}
```

### 2. Authentification avec Rôle Spécifique

Pour limiter l'accès à certains rôles :

```typescript
import { withRole } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return withRole(['manager', 'super_admin'])(async (req, user) => {
    // Seuls les managers et super_admins peuvent accéder
    
    return NextResponse.json({ data: 'admin only' });
  })(request);
}
```

### 3. Filtrage par Établissement

Pour filtrer automatiquement par établissement :

```typescript
import { requireAuth, applyEstablishmentFilter } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    
    // Ajoute automatiquement le filtre d'établissement
    const filters = applyEstablishmentFilter(user, {
      status: searchParams.get('status'),
    });
    
    const data = await Service.getAll(filters);
    return NextResponse.json(data);
  })(request);
}
```

### 4. Vérification d'Accès à une Ressource

Pour vérifier l'accès à une ressource spécifique :

```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  return requireAuth(async (req, user) => {
    const resource = await Service.getById(resolvedParams.id);
    
    // Vérifier l'accès selon l'établissement
    if (user.role !== 'root' && user.role !== 'super_admin') {
      if (!resource.establishmentId || 
          resource.establishmentId !== user.establishmentId) {
        return NextResponse.json(
          { error: 'Accès refusé' }, 
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(resource);
  })(request);
}
```

### 5. Permissions par Rôle

Pour limiter les modifications au staff :

```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  return requireAuth(async (req, user) => {
    // Staff ne peut pas modifier
    if (user.role === 'staff') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' }, 
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const updated = await Service.update(resolvedParams.id, data);
    
    return NextResponse.json(updated);
  })(request);
}
```

## 📚 Fonctions Disponibles

### Middleware d'Authentification

#### `requireAuth(handler)`
Authentification obligatoire pour accéder à la route.

```typescript
requireAuth(async (req, user) => {
  // Votre logique ici
})
```

#### `withRole(roles)(handler)`
Authentification avec rôles spécifiques requis.

```typescript
withRole(['manager', 'super_admin'])(async (req, user) => {
  // Votre logique ici
})
```

#### `verifyAuth(request)`
Vérification manuelle de l'authentification.

```typescript
const authResult = await verifyAuth(request);
if (!authResult.success || !authResult.user) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}
const user = authResult.user;
```

### Fonctions Utilitaires

#### `applyEstablishmentFilter(user, filters)`
Ajoute automatiquement le filtre d'établissement.

```typescript
const filters = applyEstablishmentFilter(user, {
  status: 'active',
  type: 'booking',
});
// Pour un manager: { status: 'active', type: 'booking', establishmentId: 'EST-001' }
// Pour un super_admin: { status: 'active', type: 'booking' }
```

#### `canAccessEstablishment(user, establishmentId)`
Vérifie si l'utilisateur peut accéder à un établissement.

```typescript
if (!canAccessEstablishment(user, 'EST-001')) {
  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
}
```

#### `canModifyResource(user, resource)`
Vérifie si l'utilisateur peut modifier une ressource.

```typescript
if (!canModifyResource(user, booking)) {
  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
}
```

#### `hasRole(user, roles)`
Vérifie si l'utilisateur a un des rôles spécifiés.

```typescript
if (hasRole(user, ['manager', 'super_admin'])) {
  // Logique pour managers et admins
}
```

## 🧪 Tests de Sécurité

### Exécuter les Tests

```bash
npm run test:security
```

### Tests Disponibles

1. **applyEstablishmentFilter**
   - ✅ Filtre pour manager
   - ✅ Pas de filtre pour super_admin
   - ✅ Pas de filtre pour root

2. **canAccessEstablishment**
   - ✅ Manager peut accéder à son établissement
   - ✅ Manager ne peut pas accéder à un autre
   - ✅ Super_admin peut accéder à tous

3. **canModifyResource**
   - ✅ Staff ne peut pas modifier
   - ✅ Manager peut modifier son établissement
   - ✅ Super_admin peut tout modifier

4. **hasRole**
   - ✅ Vérification de rôle unique
   - ✅ Vérification de rôles multiples

## 📋 Checklist pour Nouvelle Route

Quand vous créez une nouvelle route API :

- [ ] Importer `requireAuth` ou `withRole`
- [ ] Wrapper le handler avec l'authentification
- [ ] Vérifier l'accès à l'établissement si nécessaire
- [ ] Vérifier les permissions par rôle
- [ ] Ajouter des logs d'audit pour actions sensibles
- [ ] Tester avec différents rôles
- [ ] Exécuter `npm run check:routes`

### Exemple Complet

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, applyEstablishmentFilter } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit';
import Service from '@/services/Service';

// GET - Liste avec filtrage
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    const { searchParams } = new URL(req.url);
    const filters = applyEstablishmentFilter(user, {
      status: searchParams.get('status'),
    });
    
    const data = await Service.getAll(filters);
    return NextResponse.json(data);
  })(request);
}

// POST - Création avec vérification
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    // Staff ne peut pas créer
    if (user.role === 'staff') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' }, 
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Ajouter l'établissement automatiquement
    if (user.role === 'manager') {
      data.establishmentId = user.establishmentId;
    }
    
    const created = await Service.create(data);
    
    // Log d'audit
    await logAudit({
      action: 'CREATE',
      entity: 'resource',
      entityId: created.id,
      userId: user.userId,
      details: { data },
    });
    
    return NextResponse.json(created);
  })(request);
}

// PATCH - Modification avec vérification d'accès
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  return requireAuth(async (req, user) => {
    // Staff ne peut pas modifier
    if (user.role === 'staff') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' }, 
        { status: 403 }
      );
    }
    
    const resource = await Service.getById(resolvedParams.id);
    
    // Vérifier l'accès
    if (user.role !== 'root' && user.role !== 'super_admin') {
      if (!resource.establishmentId || 
          resource.establishmentId !== user.establishmentId) {
        return NextResponse.json(
          { error: 'Accès refusé' }, 
          { status: 403 }
        );
      }
    }
    
    const data = await request.json();
    const updated = await Service.update(resolvedParams.id, data);
    
    // Log d'audit
    await logAudit({
      action: 'UPDATE',
      entity: 'resource',
      entityId: resolvedParams.id,
      userId: user.userId,
      details: { before: resource, after: updated },
    });
    
    return NextResponse.json(updated);
  })(request);
}

// DELETE - Suppression avec vérification stricte
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  return requireAuth(async (req, user) => {
    // Seuls les admins peuvent supprimer
    if (user.role !== 'super_admin' && user.role !== 'root') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' }, 
        { status: 403 }
      );
    }
    
    const resource = await Service.getById(resolvedParams.id);
    
    await Service.delete(resolvedParams.id);
    
    // Log d'audit
    await logAudit({
      action: 'DELETE',
      entity: 'resource',
      entityId: resolvedParams.id,
      userId: user.userId,
      details: { deleted: resource },
    });
    
    return NextResponse.json({ 
      message: 'Ressource supprimée avec succès' 
    });
  })(request);
}
```

## 🔍 Vérification Continue

### Avant Chaque Commit

```bash
npm run check:routes
```

### Avant Chaque Déploiement

```bash
npm run check:routes && npm run test:security
```

### Monitoring Production

Configurer un cron job pour vérifier quotidiennement :

```bash
0 9 * * * cd /path/to/project && npm run check:routes
```

## 📊 Rapport de Sécurité

Le fichier `security-report.json` contient :

```json
{
  "date": "2024-01-15T10:00:00.000Z",
  "totalRoutes": 89,
  "secured": 89,
  "warnings": 0,
  "errors": 0,
  "securityRate": 100,
  "details": [...]
}
```

## 🆘 Dépannage

### Route Détectée comme Non Sécurisée

1. Vérifier que vous utilisez une des méthodes reconnues :
   - `requireAuth`
   - `withRole`
   - `verifyAuth`
   - `authenticateUser`

2. Vérifier l'import :
   ```typescript
   import { requireAuth } from '@/lib/auth/middleware';
   ```

3. Vérifier l'utilisation :
   ```typescript
   return requireAuth(async (req, user) => {
     // ...
   })(request);
   ```

### Erreur 401 (Non Autorisé)

- Vérifier que le token JWT est présent dans les headers
- Vérifier que le token n'est pas expiré
- Vérifier la configuration JWT dans `.env`

### Erreur 403 (Accès Refusé)

- Vérifier le rôle de l'utilisateur
- Vérifier l'établissement de l'utilisateur
- Vérifier les permissions requises

## 📞 Support

Pour toute question sur la sécurité :

1. Consulter la documentation complète : `SECURITY_FINAL_REPORT.md`
2. Vérifier les exemples dans ce guide
3. Exécuter les tests : `npm run test:security`
4. Consulter les logs d'audit via `/api/audit`

## 🎯 Bonnes Pratiques

1. ✅ **Toujours** utiliser `requireAuth` ou `withRole`
2. ✅ **Toujours** vérifier l'accès à l'établissement
3. ✅ **Toujours** vérifier les permissions par rôle
4. ✅ **Toujours** logger les actions sensibles
5. ✅ **Toujours** tester avec différents rôles
6. ✅ **Toujours** exécuter `npm run check:routes` avant commit
7. ❌ **Jamais** exposer de données sans authentification
8. ❌ **Jamais** permettre l'accès cross-établissement sans vérification
9. ❌ **Jamais** donner des permissions de modification au staff

---

**Version:** 1.0.0  
**Dernière mise à jour:** 15 janvier 2024  
**Status:** ✅ Production Ready

**🔐 Sécurité Garantie à 100% ! 🔐**
