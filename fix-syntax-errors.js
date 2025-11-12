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
  './app/api/performance/stats/route.ts',
  './app/api/users/route.ts'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corriger l'import
    content = content.replace(/import { withAuth }/g, 'import { withRole }');
    
    // Corriger la syntaxe de l'export avec super_admin
    content = content.replace(
      /export const (GET|POST|PUT|DELETE) = withAuth\(async \(request: NextRequest\) \{[\s\S]*?const user = await withAuth\(request\);[\s\S]*?if \(!user\) \{[\s\S]*?\}[\s\S]*?if \(user\.role !== 'super_admin'\) \{[\s\S]*?\}/,
      'export const $1 = withRole([\'super_admin\'], async (request: NextRequest, user) => {'
    );
    
    // Corriger la syntaxe de l'export avec manager/admin
    content = content.replace(
      /export const (GET|POST|PUT|DELETE) = withAuth\(async \(request: NextRequest\) \{[\s\S]*?const user = await withAuth\(request\);[\s\S]*?if \(!user\) \{[\s\S]*?\}/,
      'export const $1 = withRole([\'manager\', \'super_admin\'], async (request: NextRequest, user) => {'
    );
    
    // Nettoyer les vérifications redondantes
    content = content.replace(
      /const user = await withAuth\(request\);[\s\S]*?if \(!user\) \{[\s\S]*?\}[\s\S]*?if \(user\.role !== 'super_admin'\) \{[\s\S]*?\}/,
      ''
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing syntax errors...');
problematicFiles.forEach(fixFile);
console.log('✅ Done!');