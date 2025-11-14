#!/usr/bin/env ts-node

/**
 * Script pour vérifier la sécurité de toutes les routes API
 * Vérifie que chaque route utilise requireAuth ou withAuth
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteCheck {
  file: string;
  hasAuth: boolean;
  authMethod: string | null;
  needsAuth: boolean;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
}

const results: RouteCheck[] = [];

// Routes qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/api/auth/',
  '/api/public/',
];

// Méthodes d'authentification acceptées
const AUTH_METHODS = [
  'requireAuth',
  'withAuth',
  'requireManager',
  'requireAdmin',
  'requireSuperAdmin',
  'withRole',
  'withPermission',
  'verifyAuth',
  'authenticateUser',
];

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(filePath: string): boolean {
  return PUBLIC_ROUTES.some(route => filePath.includes(route.replace(/\//g, '\\')));
}

/**
 * Vérifie si un fichier utilise l'authentification
 */
function checkFileAuth(filePath: string): RouteCheck {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '\\', '');
  
  const needsAuth = !isPublicRoute(filePath);
  let hasAuth = false;
  let authMethod: string | null = null;

  // Vérifier chaque méthode d'authentification
  for (const method of AUTH_METHODS) {
    if (content.includes(method)) {
      hasAuth = true;
      authMethod = method;
      break;
    }
  }

  let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
  let message = '';

  if (needsAuth && !hasAuth) {
    status = 'ERROR';
    message = '❌ Route non sécurisée - Authentification manquante';
  } else if (needsAuth && hasAuth) {
    status = 'OK';
    message = `✅ Sécurisée avec ${authMethod}`;
  } else if (!needsAuth) {
    status = 'OK';
    message = '✅ Route publique (pas d\'auth requise)';
  }

  return {
    file: relativePath,
    hasAuth,
    authMethod,
    needsAuth,
    status,
    message,
  };
}

/**
 * Trouve tous les fichiers route.ts
 */
function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Exécution
console.log('\n🔐 Vérification de la Sécurité des Routes API\n');
console.log('═'.repeat(80));

const apiDir = path.join(process.cwd(), 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`\n📁 ${routeFiles.length} fichiers de routes trouvés\n`);

// Vérifier chaque fichier
for (const file of routeFiles) {
  const result = checkFileAuth(file);
  results.push(result);
}

// Grouper par statut
const byStatus = {
  OK: results.filter(r => r.status === 'OK'),
  WARNING: results.filter(r => r.status === 'WARNING'),
  ERROR: results.filter(r => r.status === 'ERROR'),
};

// Afficher les résultats
console.log('📊 Résultats par Statut:\n');
console.log(`✅ OK:       ${byStatus.OK.length} routes`);
console.log(`⚠️  WARNING:  ${byStatus.WARNING.length} routes`);
console.log(`❌ ERROR:    ${byStatus.ERROR.length} routes`);

// Afficher les routes sécurisées
if (byStatus.OK.length > 0) {
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Routes Sécurisées:\n');
  
  const secured = byStatus.OK.filter(r => r.needsAuth);
  const publicRoutes = byStatus.OK.filter(r => !r.needsAuth);
  
  if (secured.length > 0) {
    console.log(`📌 Routes avec authentification (${secured.length}):\n`);
    secured.slice(0, 10).forEach(r => {
      console.log(`   ✅ ${r.file}`);
      console.log(`      ${r.message}`);
    });
    if (secured.length > 10) {
      console.log(`   ... et ${secured.length - 10} autres routes sécurisées`);
    }
  }
  
  if (publicRoutes.length > 0) {
    console.log(`\n📌 Routes publiques (${publicRoutes.length}):\n`);
    publicRoutes.forEach(r => {
      console.log(`   ✅ ${r.file}`);
    });
  }
}

// Afficher les erreurs
if (byStatus.ERROR.length > 0) {
  console.log('\n' + '═'.repeat(80));
  console.log('\n❌ ERREURS - Routes Non Sécurisées:\n');
  
  byStatus.ERROR.forEach(r => {
    console.log(`   ❌ ${r.file}`);
    console.log(`      ${r.message}`);
    console.log('');
  });
  
  console.log('⚠️  ACTION REQUISE: Ces routes doivent être sécurisées avant la production!\n');
}

// Afficher les warnings
if (byStatus.WARNING.length > 0) {
  console.log('\n' + '═'.repeat(80));
  console.log('\n⚠️  WARNINGS:\n');
  
  byStatus.WARNING.forEach(r => {
    console.log(`   ⚠️  ${r.file}`);
    console.log(`      ${r.message}`);
    console.log('');
  });
}

// Statistiques détaillées
console.log('\n' + '═'.repeat(80));
console.log('\n📈 Statistiques Détaillées:\n');

const authMethodsUsed: Record<string, number> = {};
results.filter(r => r.authMethod).forEach(r => {
  authMethodsUsed[r.authMethod!] = (authMethodsUsed[r.authMethod!] || 0) + 1;
});

console.log('Méthodes d\'authentification utilisées:');
Object.entries(authMethodsUsed).forEach(([method, count]) => {
  console.log(`   ${method}: ${count} routes`);
});

// Taux de sécurité
const securedRoutes = results.filter(r => r.needsAuth && r.hasAuth).length;
const routesNeedingAuth = results.filter(r => r.needsAuth).length;
const securityRate = routesNeedingAuth > 0 
  ? Math.round((securedRoutes / routesNeedingAuth) * 100) 
  : 100;

console.log(`\n📊 Taux de sécurité: ${securityRate}% (${securedRoutes}/${routesNeedingAuth} routes sécurisées)`);

// Résumé final
console.log('\n' + '═'.repeat(80));
console.log('\n🎯 Résumé Final:\n');

if (byStatus.ERROR.length === 0) {
  console.log('✅ TOUTES LES ROUTES SONT SÉCURISÉES!');
  console.log('✅ Le système est prêt pour la production.');
} else {
  console.log(`❌ ${byStatus.ERROR.length} route(s) non sécurisée(s) détectée(s)`);
  console.log('⚠️  Sécurisez ces routes avant le déploiement en production!');
}

console.log('\n' + '═'.repeat(80) + '\n');

// Sauvegarder le rapport
const report = {
  date: new Date().toISOString(),
  totalRoutes: results.length,
  secured: byStatus.OK.length,
  warnings: byStatus.WARNING.length,
  errors: byStatus.ERROR.length,
  securityRate,
  details: results,
};

fs.writeFileSync(
  path.join(process.cwd(), 'security-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('📄 Rapport détaillé sauvegardé dans: security-report.json\n');

// Exit code
process.exit(byStatus.ERROR.length > 0 ? 1 : 0);
