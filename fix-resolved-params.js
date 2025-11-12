const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFileContent(content) {
  // Pattern: export async function METHOD(...) { return requireAuth(async () => { ... resolvedParams ...
  // Besoin d'ajouter: const resolvedParams = await params; après la signature de fonction
  
  const functionPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]+\{ params \}[^)]+\) \{(\s*)return requireAuth/g;
  
  let modified = false;
  content = content.replace(functionPattern, (match, method, whitespace) => {
    // Vérifier si resolvedParams est déjà défini dans cette fonction
    const funcStart = content.indexOf(match);
    const nextFuncStart = content.indexOf('export async function', funcStart + 1);
    const funcEnd = nextFuncStart === -1 ? content.length : nextFuncStart;
    const funcBody = content.substring(funcStart, funcEnd);
    
    if (funcBody.includes('resolvedParams') && !funcBody.includes('const resolvedParams = await params;')) {
      modified = true;
      return `export async function ${method}(${match.split('(')[1].split(')')[0]}) {${whitespace}const resolvedParams = await params;${whitespace}return requireAuth`;
    }
    return match;
  });
  
  return { content, modified };
}

const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Trouvé ${routeFiles.length} fichiers route.ts`);

let fixedCount = 0;

for (const file of routeFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Vérifier si le fichier utilise resolvedParams sans le définir
    if (content.includes('resolvedParams') && content.includes('return requireAuth')) {
      const { content: fixedContent, modified } = fixFileContent(content);
      
      if (modified) {
        fs.writeFileSync(file, fixedContent);
        console.log(`✅ Corrigé: ${file}`);
        fixedCount++;
      }
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${file}:`, error.message);
  }
}

console.log(`\n🎉 ${fixedCount} fichiers corrigés!`);
