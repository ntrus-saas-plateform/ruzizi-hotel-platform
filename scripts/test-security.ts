#!/usr/bin/env ts-node

/**
 * Script de test de la sécurité par établissement
 * Vérifie que les managers et staff ne voient que leur établissement
 */

import { applyEstablishmentFilter, canAccessEstablishment, canModifyResource } from '../lib/auth/middleware';

// Types de test
interface TestUser {
  userId: string;
  email: string;
  role: 'root' | 'super_admin' | 'manager' | 'staff';
  establishmentId?: string;
}

// Utilisateurs de test
const testUsers: Record<string, TestUser> = {
  root: {
    userId: 'root-001',
    email: 'root@ruzizihotel.com',
    role: 'root',
  },
  superAdmin: {
    userId: 'admin-001',
    email: 'admin@ruzizihotel.com',
    role: 'super_admin',
  },
  manager1: {
    userId: 'manager-001',
    email: 'manager1@ruzizihotel.com',
    role: 'manager',
    establishmentId: 'EST-001',
  },
  manager2: {
    userId: 'manager-002',
    email: 'manager2@ruzizihotel.com',
    role: 'manager',
    establishmentId: 'EST-002',
  },
  staff1: {
    userId: 'staff-001',
    email: 'staff1@ruzizihotel.com',
    role: 'staff',
    establishmentId: 'EST-001',
  },
};

// Résultats des tests
interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  message?: string;
}

const results: TestResult[] = [];

// Fonction helper pour les tests
function test(name: string, expected: any, actual: any, message?: string) {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);
  results.push({ name, passed, expected, actual, message });

  if (passed) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Attendu: ${JSON.stringify(expected)}`);
    console.log(`   Reçu: ${JSON.stringify(actual)}`);
    if (message) console.log(`   ${message}`);
  }
}

// Tests
console.log('🧪 Démarrage des tests de sécurité...\n');

// Test 1: applyEstablishmentFilter
test(
  'Root voit tout (pas de filtre)',
  {},
  applyEstablishmentFilter(testUsers.root, {}),
  'Root ne doit pas avoir de filtre d\'établissement'
);

test(
  'Super Admin voit tout (pas de filtre)',
  {},
  applyEstablishmentFilter(testUsers.superAdmin, {}),
  'Super Admin ne doit pas avoir de filtre d\'établissement'
);

test(
  'Manager voit uniquement son établissement',
  { establishmentId: 'EST-001' },
  applyEstablishmentFilter(testUsers.manager1, {}),
  'Manager doit avoir un filtre sur son établissement'
);

test(
  'Staff voit uniquement son établissement',
  { establishmentId: 'EST-001' },
  applyEstablishmentFilter(testUsers.staff1, {}),
  'Staff doit avoir un filtre sur son établissement'
);

test(
  'Manager conserve les autres filtres',
  { status: 'available', establishmentId: 'EST-001' },
  applyEstablishmentFilter(testUsers.manager1, { status: 'available' }),
  'Les autres filtres doivent être conservés'
);

// Test 2: canAccessEstablishment
test(
  'Root peut accéder à n\'importe quel établissement',
  true,
  canAccessEstablishment(testUsers.root, 'EST-999'),
  'Root doit pouvoir accéder à tous les établissements'
);

test(
  'Super Admin peut accéder à n\'importe quel établissement',
  true,
  canAccessEstablishment(testUsers.superAdmin, 'EST-999'),
  'Super Admin doit pouvoir accéder à tous les établissements'
);

test(
  'Manager peut accéder à son établissement',
  true,
  canAccessEstablishment(testUsers.manager1, 'EST-001'),
  'Manager doit pouvoir accéder à son établissement'
);

test(
  'Manager ne peut PAS accéder à un autre établissement',
  false,
  canAccessEstablishment(testUsers.manager1, 'EST-002'),
  'Manager ne doit pas pouvoir accéder à un autre établissement'
);

test(
  'Staff peut accéder à son établissement',
  true,
  canAccessEstablishment(testUsers.staff1, 'EST-001'),
  'Staff doit pouvoir accéder à son établissement'
);

test(
  'Staff ne peut PAS accéder à un autre établissement',
  false,
  canAccessEstablishment(testUsers.staff1, 'EST-002'),
  'Staff ne doit pas pouvoir accéder à un autre établissement'
);

// Test 3: canModifyResource
test(
  'Root peut modifier n\'importe quelle ressource',
  true,
  canModifyResource(testUsers.root, 'EST-999'),
  'Root doit pouvoir modifier toutes les ressources'
);

test(
  'Super Admin peut modifier n\'importe quelle ressource',
  true,
  canModifyResource(testUsers.superAdmin, 'EST-999'),
  'Super Admin doit pouvoir modifier toutes les ressources'
);

test(
  'Manager peut modifier les ressources de son établissement',
  true,
  canModifyResource(testUsers.manager1, 'EST-001'),
  'Manager doit pouvoir modifier les ressources de son établissement'
);

test(
  'Manager ne peut PAS modifier les ressources d\'un autre établissement',
  false,
  canModifyResource(testUsers.manager1, 'EST-002'),
  'Manager ne doit pas pouvoir modifier les ressources d\'un autre établissement'
);

test(
  'Staff ne peut PAS modifier (même son établissement)',
  false,
  canModifyResource(testUsers.staff1, 'EST-001'),
  'Staff ne doit pas pouvoir modifier les ressources'
);

// Résumé
console.log('\n📊 RÉSUMÉ DES TESTS\n');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`Total: ${total} tests`);
console.log(`Réussis: ${passed} (${Math.round((passed / total) * 100)}%)`);
console.log(`Échoués: ${failed} (${Math.round((failed / total) * 100)}%)`);

if (failed > 0) {
  console.log('\n❌ TESTS ÉCHOUÉS:');
  results
    .filter(r => !r.passed)
    .forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    Attendu: ${JSON.stringify(r.expected)}`);
      console.log(`    Reçu: ${JSON.stringify(r.actual)}`);
    });
}

console.log('\n🏁 Tests terminés\n');

// Exit code
process.exit(failed > 0 ? 1 : 0);
