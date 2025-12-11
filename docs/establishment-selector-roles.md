# EstablishmentSelector - Gestion des Rôles

## Vue d'ensemble

Le composant `EstablishmentSelector` implémente une logique de contrôle d'accès basée sur les rôles utilisateur pour la sélection d'établissements.

## Règles de Contrôle d'Accès

### 🔑 Administrateurs (`root` et `super_admin`)

**Accès** : COMPLET
- ✅ Voient **TOUS** les établissements du système
- ✅ Peuvent sélectionner **n'importe quel** établissement
- ✅ Aucune restriction géographique ou organisationnelle
- ✅ Sélecteur activé et fonctionnel

**Comportement** :
```typescript
// Exemple pour un admin
userRole: 'root' | 'super_admin'
userEstablishmentId: 'est1' // Ignoré pour les admins

// Résultat
establishments: [est1, est2, est3, est4] // TOUS
canSelect: true
disabled: false
message: "En tant qu'administrateur, vous avez accès à tous les établissements (4 disponibles)."
```

### 👥 Non-Administrateurs (`manager`, `staff`, autres)

**Accès** : RESTREINT
- ⚠️ Voient **SEULEMENT** leur établissement assigné
- ⚠️ **Pas de choix** - sélection automatique et désactivée
- ⚠️ Restriction stricte à leur périmètre d'action

**Comportement** :
```typescript
// Exemple pour un manager
userRole: 'manager'
userEstablishmentId: 'est2'

// Résultat
establishments: [est2] // SEULEMENT le leur
canSelect: false
disabled: true
autoSelect: 'est2'
message: "Votre accès est limité à votre établissement assigné."
```

## Cas d'Erreur

### ❌ Non-admin sans établissement assigné
```typescript
userRole: 'manager'
userEstablishmentId: null

// Résultat
establishments: []
error: "Aucun établissement assigné à votre compte"
```

### ❌ Non-admin avec établissement inexistant
```typescript
userRole: 'staff'
userEstablishmentId: 'nonexistent'

// Résultat
establishments: []
error: "Votre établissement assigné n'a pas été trouvé"
```

## Interface Utilisateur

### Pour les Administrateurs
```html
<select enabled>
  <option value="">Sélectionner un établissement</option>
  <option value="est1">Hotel Ruzizi - Bujumbura</option>
  <option value="est2">Hotel Burundi - Gitega</option>
  <option value="est3">Hotel Tanganyika - Rumonge</option>
  <option value="est4">Hotel Kibira - Kayanza</option>
</select>
<p class="help-text">
  En tant qu'administrateur, vous avez accès à tous les établissements (4 disponibles).
</p>
```

### Pour les Non-Administrateurs
```html
<select disabled>
  <option value="est2" selected>Hotel Burundi - Gitega</option>
</select>
<p class="help-text">
  Votre accès est limité à votre établissement assigné.
</p>
<span class="badge">(Pré-sélectionné)</span>
```

## Logique d'Implémentation

### Détection du Rôle Admin
```typescript
const isAdmin = userRole === 'root' || userRole === 'super_admin';
```

### Filtrage des Établissements
```typescript
if (isAdmin) {
  // Admins : tous les établissements
  setEstablishments(allEstablishments);
} else if (userEstablishmentId) {
  // Non-admin : seulement le leur
  const userEst = allEstablishments.find(est => est.id === userEstablishmentId);
  setEstablishments(userEst ? [userEst] : []);
} else {
  // Non-admin sans assignation : erreur
  setEstablishments([]);
  setError('Aucun établissement assigné');
}
```

### Auto-sélection
```typescript
useEffect(() => {
  // Auto-select pour les non-admins
  if (!isAdmin && userEstablishmentId && !value) {
    onChange(userEstablishmentId);
  }
}, [isAdmin, userEstablishmentId, value, onChange]);
```

## Sécurité

### Côté Client
- ✅ Filtrage visuel des options
- ✅ Désactivation du sélecteur pour les non-admins
- ✅ Messages d'erreur informatifs

### Côté Serveur
- ⚠️ **Important** : La sécurité réelle doit être implémentée côté serveur
- ⚠️ Les APIs doivent valider les permissions avant toute opération
- ⚠️ Ne jamais faire confiance uniquement au filtrage côté client

## Tests

### Scénarios Couverts
1. ✅ Admin root voit tous les établissements
2. ✅ Super admin voit tous les établissements
3. ✅ Manager voit seulement son établissement
4. ✅ Staff voit seulement son établissement
5. ✅ Auto-sélection pour les non-admins
6. ✅ Gestion des erreurs (pas d'assignation, établissement inexistant)
7. ✅ Messages d'interface appropriés

### Commande de Test
```bash
npm test -- --testPathPatterns="establishment-selector-roles.test.tsx"
```

## Utilisation

### Exemple Complet
```tsx
<EstablishmentSelector
  value={selectedEstablishment}
  onChange={setSelectedEstablishment}
  userRole={user.role}
  userEstablishmentId={user.establishmentId}
  required={true}
  label="Établissement"
  className="mb-4"
/>
```

### Props Importantes
- `userRole`: Détermine le niveau d'accès
- `userEstablishmentId`: Établissement assigné à l'utilisateur
- `value`/`onChange`: Contrôle de la sélection
- `disabled`: Peut forcer la désactivation (en plus de la logique de rôle)

## Maintenance

### Ajout de Nouveaux Rôles Admin
```typescript
// Dans le composant
const isAdmin = userRole === 'root' || 
                userRole === 'super_admin' || 
                userRole === 'nouveau_role_admin';
```

### Modification des Messages
Les messages sont centralisés dans le composant et peuvent être facilement modifiés ou internationalisés.

---

**Note** : Cette documentation reflète l'implémentation actuelle. Toute modification de la logique de rôles doit être accompagnée d'une mise à jour de cette documentation.