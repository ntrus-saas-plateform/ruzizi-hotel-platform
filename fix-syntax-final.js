const fs = require('fs');
const path = require('path');

// Liste des fichiers avec des erreurs de syntaxe
const problematicFiles = [
  './app/api/backup/delete/route.ts',
  './app/api/backup/list/route.ts', 
  './app/api/backup/restore/route.ts',
  './app/api/hr/analytics/kpis/route.ts',
  './app/api/hr/analytics/report/route.ts',
  './app/api/hr/analytics/salary-cost/route.ts',
  './app/api/hr/analytics/turnover/route.ts',
  './app/api/maintenance/route.ts',
  './app/api/performance/criteria/route.ts',
  './app/api/performance/route.ts',
  './app/api/performance/stats/route.ts'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corriger la syntaxe malformée
    // Pattern: export const METHOD = withRole([...], async (request: NextRequest, user) => {, { status: XXX });
    content = content.replace(
      /export const (GET|POST|PUT|DELETE) = withRole\(\[([^\]]+)\], async \(request: NextRequest, user\) => \{, \{ status: \d+ \}\);/g,
      'export const $1 = withRole([$2], async (request: NextRequest, user) => {'
    );
    
    // Supprimer les lignes orphelines "}"
    content = content.replace(/^\s*\}\s*$/gm, '');
    
    // Ajouter try-catch si manquant
    if (!content.includes('try {')) {
      // Trouver le début du code après l'export
      content = content.replace(
        /(export const \w+ = withRole\([^}]+\{)\s*/,
        '$1\n  try {'
      );
    }
    
    // S'assurer que le fichier se termine correctement
    if (!content.trim().endsWith('});')) {
      // Trouver la dernière accolade de fermeture et ajouter la fermeture manquante
      content = content.replace(/(\}\s*)$/, '  } catch (error: any) {\n    return NextResponse.json(\n      { error: error.message || \'Erreur serveur\' },\n      { status: 500 }\n    );\n  }\n});');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing syntax errors in all files...');
problematicFiles.forEach(fixFile);
console.log('✅ Done!');