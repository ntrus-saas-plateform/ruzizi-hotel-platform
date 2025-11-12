# Guide de Tests - Ruzizi Hôtel Platform

## Vue d'ensemble

Ce document décrit la stratégie de tests et comment exécuter les tests pour la plateforme Ruzizi Hôtel.

## Technologies Utilisées

- **Jest**: Framework de test principal
- **@testing-library/react**: Pour tester les composants React
- **@testing-library/jest-dom**: Matchers personnalisés pour Jest
- **ts-jest**: Support TypeScript pour Jest

## Structure des Tests

```
ruzizi-hotel-platform/
├── __tests__/
│   ├── services/          # Tests des services
│   │   ├── Auth.service.test.ts
│   │   ├── Booking.service.test.ts
│   │   └── Invoice.service.test.ts
│   ├── components/        # Tests des composants (à venir)
│   └── api/              # Tests des API routes (à venir)
├── jest.config.js        # Configuration Jest
└── jest.setup.js         # Setup global pour les tests
```

## Commandes de Test

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests en mode watch
```bash
npm run test:watch
```

### Générer un rapport de couverture
```bash
npm run test:coverage
```

### Exécuter les tests en CI
```bash
npm run test:ci
```

## Tests Implémentés

### Phase 16.1: Tests du Service d'Authentification ✅

**Fichier**: `__tests__/services/Auth.service.test.ts`

**Tests couverts**:
- ✅ Connexion avec identifiants valides
- ✅ Erreur pour email invalide
- ✅ Erreur pour mot de passe invalide
- ✅ Erreur pour compte inactif
- ✅ Vérification de token valide
- ✅ Erreur pour token invalide
- ✅ Erreur pour token expiré
- ✅ Génération de nouveau token d'accès
- ✅ Hachage de mot de passe
- ✅ Comparaison de mot de passe

### Phase 16.2: Tests du Service de Réservation ✅

**Fichier**: `__tests__/services/Booking.service.test.ts`

**Tests couverts**:
- ✅ Vérification de disponibilité (disponible)
- ✅ Vérification de disponibilité (non disponible)
- ✅ Calcul de prix pour tarif nuitée
- ✅ Calcul de prix pour tarif mensuel
- ✅ Erreur pour hébergement invalide
- ✅ Création de réservation réussie
- ✅ Erreur quand hébergement non disponible
- ✅ Mise à jour du statut de réservation
- ✅ Erreur pour réservation invalide

### Phase 16.3: Tests des Services de Facturation ✅

**Fichier**: `__tests__/services/Invoice.service.test.ts`

**Tests couverts**:
- ✅ Génération de facture depuis réservation
- ✅ Erreur pour réservation invalide
- ✅ Enregistrement de paiement partiel
- ✅ Marquage de facture comme payée
- ✅ Erreur pour surpaiement
- ✅ Calcul du solde

## Couverture de Code

Objectif de couverture: **80%** minimum

### Zones Critiques à Tester

1. **Services** (Priorité Haute)
   - ✅ AuthService
   - ✅ BookingService
   - ✅ InvoiceService
   - ⏳ PayrollService
   - ⏳ EmployeeService
   - ⏳ LeaveService

2. **Modèles** (Priorité Moyenne)
   - ⏳ Validations Mongoose
   - ⏳ Méthodes statiques
   - ⏳ Hooks pre/post

3. **API Routes** (Priorité Haute)
   - ⏳ Authentification
   - ⏳ CRUD operations
   - ⏳ Gestion des erreurs

4. **Composants** (Priorité Moyenne)
   - ⏳ Formulaires
   - ⏳ Composants de réservation
   - ⏳ Tableaux de bord

## Bonnes Pratiques

### 1. Isolation des Tests
- Chaque test doit être indépendant
- Utiliser `beforeEach` pour réinitialiser les mocks
- Ne pas dépendre de l'ordre d'exécution

### 2. Mocking
```typescript
// Mock d'un module
jest.mock('@/models/User.model');

// Mock d'une fonction
(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
```

### 3. Assertions Claires
```typescript
// Bon
expect(result).toHaveProperty('accessToken');
expect(result.user.email).toBe('test@example.com');

// À éviter
expect(result).toBeTruthy();
```

### 4. Tests de Cas Limites
- Toujours tester les cas d'erreur
- Tester les valeurs nulles/undefined
- Tester les limites (min/max)

### 5. Nommage Descriptif
```typescript
// Bon
it('should throw error for invalid email', async () => {
  // ...
});

// À éviter
it('test login', async () => {
  // ...
});
```

## Configuration

### Variables d'Environnement de Test

Les variables suivantes sont configurées dans `jest.setup.js`:

```javascript
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
process.env.MONGODB_URI = 'mongodb://localhost:27017/ruzizi-hotel-test'
```

### Alias de Chemins

Les alias TypeScript sont configurés dans `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

## Debugging des Tests

### Exécuter un seul fichier de test
```bash
npm test -- Auth.service.test.ts
```

### Exécuter un seul test
```bash
npm test -- -t "should successfully login"
```

### Mode debug
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Intégration Continue (CI)

Les tests sont exécutés automatiquement sur chaque push/PR via:

```bash
npm run test:ci
```

Cette commande:
- Exécute tous les tests
- Génère un rapport de couverture
- Limite les workers pour optimiser les ressources CI

## Prochaines Étapes

### Tests à Implémenter

1. **Tests de Paie** (Phase 16.3)
   - Calcul de salaire
   - Génération de fiche de paie
   - Déductions et bonus

2. **Tests d'Intégration** (Phase 30)
   - Tests des endpoints API
   - Tests des opérations de base de données
   - Tests de transactions

3. **Tests End-to-End** (Phase 31)
   - Flux de réservation complet
   - Gestion d'établissement
   - Processus de paie

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Support

Pour toute question sur les tests, consultez:
- Ce guide
- Les exemples de tests existants
- L'équipe de développement

---

**Dernière mise à jour**: Novembre 2025  
**Statut**: Phase 16.1-16.3 Complétée ✅
