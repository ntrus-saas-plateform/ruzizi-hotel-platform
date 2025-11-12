const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 1. Corriger les imports verifyAuth
    if (content.includes('verifyAuth')) {
      content = content.replace(/import { verifyAuth }/g, 'import { authenticateUser }');
      content = content.replace(/verifyAuth/g, 'authenticateUser');
      
      // Corriger l'usage de verifyAuth
      content = content.replace(
        /const user = await authenticateUser\(request\);/g,
        'const authResult = await authenticateUser(request);'
      );
      
      content = content.replace(
        /if \(!user\) \{/g,
        'if (!authResult.success || !authResult.user) {'
      );
      
      content = content.replace(
        /if \(user\.role/g,
        'if (authResult.user.role'
      );
      
      content = content.replace(
        /user\.role/g,
        'authResult.user.role'
      );
      
      hasChanges = true;
    }

    // 2. Corriger requireAuth vers withAuth
    if (content.includes('requireAuth')) {
      content = content.replace(/requireAuth/g, 'withAuth');
      hasChanges = true;
    }

    // 3. Corriger les paramètres req vers request
    content = content.replace(/async \(req, user\)/g, 'async (request, user)');
    content = content.replace(/async \(req\)/g, 'async (request)');
    content = content.replace(/await req\.json\(\)/g, 'await request.json()');
    content = content.replace(/new URL\(req\.url\)/g, 'new URL(request.url)');

    // 4. Corriger les exports de fonctions vers const
    content = content.replace(
      /export async function (GET|POST|PUT|DELETE)\(/g,
      'export const $1 = withAuth(async ('
    );

    // 5. Ajouter les imports manquants
    if (content.includes('withAuth') && !content.includes('import { withAuth')) {
      content = content.replace(
        /from '@\/lib\/auth\/middleware';/,
        ', withAuth } from \'@/lib/auth/middleware\';'
      );
      content = content.replace(
        /import {/,
        'import { withAuth,'
      );
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') && filePath.includes('/api/')) {
        fixFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('🔧 Fixing all middleware imports...');
walkDir('./app/api');
console.log('✅ Done!');