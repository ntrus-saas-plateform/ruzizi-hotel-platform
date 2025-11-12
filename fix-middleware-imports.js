const fs = require('fs');
const path = require('path');

// Mapping des anciens imports vers les nouveaux
const importMappings = {
  'requireAuth': 'withAuth',
  'verifyAuth': 'authenticateUser',
  'requireManager': 'withRole([\'manager\', \'admin\', \'super_admin\'])',
  'requireSuperAdmin': 'withRole([\'super_admin\'])',
  'requireAdmin': 'withRole([\'admin\', \'super_admin\'])'
};

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Corriger les imports
    Object.keys(importMappings).forEach(oldImport => {
      const regex = new RegExp(`\\b${oldImport}\\b`, 'g');
      if (content.includes(oldImport)) {
        console.log(`Fixing ${oldImport} in ${filePath}`);
        
        // Pour les cas spéciaux avec withRole
        if (oldImport === 'requireManager' || oldImport === 'requireSuperAdmin' || oldImport === 'requireAdmin') {
          // Remplacer l'import
          content = content.replace(
            new RegExp(`${oldImport},?\\s*`, 'g'),
            'withRole, '
          );
          
          // Remplacer l'usage dans le code
          if (oldImport === 'requireManager') {
            content = content.replace(
              /requireManager\s*\(/g,
              'withRole([\'manager\', \'admin\', \'super_admin\'], '
            );
          } else if (oldImport === 'requireSuperAdmin') {
            content = content.replace(
              /requireSuperAdmin\s*\(/g,
              'withRole([\'super_admin\'], '
            );
          } else if (oldImport === 'requireAdmin') {
            content = content.replace(
              /requireAdmin\s*\(/g,
              'withRole([\'admin\', \'super_admin\'], '
            );
          }
        } else if (oldImport === 'verifyAuth') {
          // Cas spécial pour verifyAuth - remplacer par authenticateUser
          content = content.replace(/verifyAuth/g, 'authenticateUser');
          
          // Adapter l'usage
          content = content.replace(
            /const user = await authenticateUser\(request\);/g,
            'const authResult = await authenticateUser(request);'
          );
          
          content = content.replace(
            /if \(!user\) \{/g,
            'if (!authResult.success || !authResult.user) {'
          );
          
          content = content.replace(
            /if \(user\.role !== ['"]super_admin['"]\) \{/g,
            'if (authResult.user.role !== \'super_admin\') {'
          );
          
          // Remplacer les références à user par authResult.user
          content = content.replace(
            /user\.role/g,
            'authResult.user.role'
          );
          
        } else if (oldImport === 'requireAuth') {
          // Remplacer requireAuth par withAuth
          content = content.replace(/requireAuth/g, 'withAuth');
        }
        
        hasChanges = true;
      }
    });

    // Nettoyer les imports en double
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*,/g, '{');
    content = content.replace(/,\s*}/g, '}');

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir) {
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
}

// Commencer la correction
console.log('🔧 Fixing middleware imports...');
walkDir('./app/api');
console.log('✅ Done!');