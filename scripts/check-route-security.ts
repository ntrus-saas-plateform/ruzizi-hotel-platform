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
console.log('🔍 Vérification de la sécurité des routes API...\n');
const apiDir = path.join(process.cwd(), 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

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
console.log('📊 RÉSULTATS DE LA VÉRIFICATION\n');

// Afficher les routes sécurisées
if (byStatus.OK.length > 0) {
  console.log(`✅ Routes sécurisées: ${byStatus.OK.length}`);
  const secured = byStatus.OK.filter(r => r.needsAuth);
  const publicRoutes = byStatus.OK.filter(r => !r.needsAuth);

  if (secured.length > 0) {
    console.log(`\n🔒 Routes API sécurisées (${secured.length}):\n`);
    secured.slice(0, 10).forEach(r => {
      console.log(`  ${r.file}`);
    });
    if (secured.length > 10) {
      console.log(`  ... et ${secured.length - 10} autres`);
    }
  }

  if (publicRoutes.length > 0) {
    console.log(`\n🌐 Routes publiques (${publicRoutes.length}):\n`);
    publicRoutes.forEach(r => {
      console.log(`  ${r.file}`);
    });
  }
}

// Afficher les erreurs
if (byStatus.ERROR.length > 0) {
  console.log(`\n❌ Routes non sécurisées: ${byStatus.ERROR.length}`);
  byStatus.ERROR.forEach(r => {
    console.log(`  ${r.file}`);
  });

}

// Afficher les warnings
if (byStatus.WARNING.length > 0) {
  console.log(`\n⚠️  Routes avec avertissements: ${byStatus.WARNING.length}`);
  byStatus.WARNING.forEach(r => {
    console.log(`  ${r.file}`);
  });
}

// Statistiques détaillées
console.log('\n📈 STATISTIQUES DÉTAILLÉES\n');
const authMethodsUsed: Record<string, number> = {};
results.filter(r => r.authMethod).forEach(r => {
  authMethodsUsed[r.authMethod!] = (authMethodsUsed[r.authMethod!] || 0) + 1;
});

Object.entries(authMethodsUsed).forEach(([method, count]) => {
  console.log(`  ${method}: ${count} routes`);
});

// Taux de sécurité
const securedRoutes = results.filter(r => r.needsAuth && r.hasAuth).length;
const routesNeedingAuth = results.filter(r => r.needsAuth).length;
const securityRate = routesNeedingAuth > 0
  ? Math.round((securedRoutes / routesNeedingAuth) * 100)
  : 100;

console.log(`\n🔐 Taux de sécurité: ${securityRate}%`);

// Résumé final
console.log('\n🏁 RÉSUMÉ FINAL\n');
if (byStatus.ERROR.length === 0) {
  console.log('🎉 Toutes les routes sont sécurisées !');
} else {
  console.log(`🚨 ${byStatus.ERROR.length} route(s) non sécurisée(s) détectée(s)`);
}

console.log('\n📄 Rapport détaillé sauvegardé dans security-report.json\n');

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

// Exit code
process.exit(byStatus.ERROR.length > 0 ? 1 : 0);
