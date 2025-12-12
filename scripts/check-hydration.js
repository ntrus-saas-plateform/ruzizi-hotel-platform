/**
 * Script pour vérifier les problèmes d'hydratation potentiels
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des problèmes d\'hydratation...');

// Fonctions à éviter dans les composants React
const problematicPatterns = [
  {
    pattern: /Math\.random\(\)/g,
    message: 'Math.random() peut causer des erreurs d\'hydratation',
    severity: 'error'
  },
  {
    pattern: /Date\.now\(\)/g,
    message: 'Date.now() peut causer des erreurs d\'hydratation',
    severity: 'error'
  },
  {
    pattern: /new Date\(\)/g,
    message: 'new Date() sans paramètre peut causer des erreurs d\'hydratation',
    severity: 'warning'
  },
  {
    pattern: /typeof window !== ['"]undefined['"]/g,
    message: 'Vérification window côté serveur/client détectée',
    severity: 'info'
  }
];

// Dossiers à vérifier
const foldersToCheck = [
  'components',
  'app',
  'pages' // au cas où
];

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  problematicPatterns.forEach(({ pattern, message, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        pattern: pattern.source,
        message,
        severity,
        count: matches.length
      });
    }
  });
  
  return issues;
}

function scanDirectory(dir) {
  const issues = [];
  
  if (!fs.existsSync(dir)) return issues;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      issues.push(...scanDirectory(fullPath));
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || file.name.endsWith('.js'))) {
      issues.push(...checkFile(fullPath));
    }
  });
  
  return issues;
}

// Scanner tous les dossiers
let allIssues = [];
foldersToCheck.forEach(folder => {
  console.log(`📁 Scan du dossier: ${folder}`);
  const issues = scanDirectory(folder);
  allIssues.push(...issues);
});

// Afficher les résultats
console.log('\n📊 Résultats de la vérification:');
console.log('=====================================');

if (allIssues.length === 0) {
  console.log('✅ Aucun problème d\'hydratation détecté!');
} else {
  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'info').length;
  
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`⚠️  Avertissements: ${warningCount}`);
  console.log(`ℹ️  Informations: ${infoCount}`);
  console.log('');
  
  // Grouper par fichier
  const issuesByFile = {};
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    console.log(`📄 ${file}:`);
    issues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : 
                   issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${issue.message} (${issue.count} occurrence${issue.count > 1 ? 's' : ''})`);
    });
    console.log('');
  });
}

// Vérifications spécifiques pour les cartes
console.log('🗺️ Vérifications spécifiques aux cartes:');
console.log('=========================================');

const mapFiles = [
  'components/maps/InteractiveMap.tsx',
  'components/maps/LocationUtils.ts'
];

let mapIssues = 0;
mapFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Vérifier l'utilisation de useEffect pour l'hydratation
    if (file.includes('InteractiveMap') && content.includes('useEffect') && content.includes('setIsMounted')) {
      console.log(`✅ ${file}: Protection contre l'hydratation détectée`);
    } else if (file.includes('InteractiveMap')) {
      console.log(`⚠️  ${file}: Vérifier la protection contre l'hydratation`);
      mapIssues++;
    }
    
    // Vérifier les URLs stables
    if (file.includes('LocationUtils') && content.includes('fixedTimestamp')) {
      console.log(`✅ ${file}: URLs stables utilisées`);
    } else if (file.includes('LocationUtils')) {
      console.log(`⚠️  ${file}: Vérifier l'utilisation d'URLs stables`);
      mapIssues++;
    }
  } else {
    console.log(`❌ ${file}: Fichier non trouvé`);
    mapIssues++;
  }
});

if (mapIssues === 0) {
  console.log('\n🎉 Toutes les vérifications des cartes sont passées!');
} else {
  console.log(`\n⚠️  ${mapIssues} problème(s) détecté(s) dans les cartes`);
}

// Recommandations
console.log('\n💡 Recommandations:');
console.log('===================');
console.log('1. Utilisez useEffect avec un état isMounted pour éviter l\'hydratation');
console.log('2. Évitez Math.random() et Date.now() dans le rendu initial');
console.log('3. Utilisez des valeurs stables pour les URLs d\'embed');
console.log('4. Testez avec npm run build pour détecter les erreurs d\'hydratation');

process.exit(allIssues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);