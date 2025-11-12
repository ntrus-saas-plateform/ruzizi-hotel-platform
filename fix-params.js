const fs = require('fs');
const path = require('path');

function getAllRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' && filePath.includes('[')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixParamsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: { params }: { params: { id: string } }
  const pattern1 = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, '{ params }: { params: Promise<{ $1 }> }');
    modified = true;
  }
  
  // Pattern 2: const { id } = params;
  const pattern2 = /const \{ ([^}]+) \} = params;/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, 'const { $1 } = await params;');
    modified = true;
  }
  
  // Pattern 3: const id = params.id;
  const pattern3 = /const ([a-zA-Z_]+) = params\.([a-zA-Z_]+);/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, 'const { $2: $1 } = await params;');
    modified = true;
  }
  
  // Pattern 4: params.id directly used
  const pattern4 = /params\.([a-zA-Z_]+)/g;
  const matches = content.match(pattern4);
  if (matches && !content.includes('await params')) {
    // Add await params at the beginning of the function
    content = content.replace(
      /(export async function \w+\([^)]+\) \{)/,
      '$1\n  const resolvedParams = await params;'
    );
    content = content.replace(/params\.([a-zA-Z_]+)/g, 'resolvedParams.$1');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = getAllRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files with dynamic params\n`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixParamsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log(`✓ Skipped ${routeFiles.length - fixedCount} files (already correct or no params)`);
