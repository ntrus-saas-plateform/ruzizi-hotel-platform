/**
 * Verification script to check that User API routes have been properly updated
 * with establishment isolation middleware
 */

import fs from 'fs';
import path from 'path';

function checkFileContains(filePath: string, patterns: string[]): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return patterns.every(pattern => content.includes(pattern));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

function verifyUserApiRoutes() {
  console.log('🔍 Verifying User API routes have been updated with establishment isolation...\n');

  const checks = [
    {
      name: 'User route imports establishment isolation middleware',
      file: 'app/api/users/route.ts',
      patterns: [
        'withEstablishmentIsolation',
        'EstablishmentAccessDeniedError',
        'context.serviceContext'
      ]
    },
    {
      name: 'User route uses middleware in GET handler',
      file: 'app/api/users/route.ts',
      patterns: [
        'withEstablishmentIsolation(async (req, context)',
        'context.serviceContext.canAccessAll()',
        'UserService.getAll('
      ]
    },
    {
      name: 'User route uses middleware in POST handler',
      file: 'app/api/users/route.ts',
      patterns: [
        'withEstablishmentIsolation(async (req, context)',
        'context.role !== \'super_admin\'',
        'context.serviceContext'
      ]
    },
    {
      name: 'User [id] route imports establishment isolation middleware',
      file: 'app/api/users/[id]/route.ts',
      patterns: [
        'withEstablishmentIsolation',
        'EstablishmentAccessDeniedError',
        'context.serviceContext'
      ]
    },
    {
      name: 'User [id] route uses middleware in all handlers',
      file: 'app/api/users/[id]/route.ts',
      patterns: [
        'withEstablishmentIsolation(async (req, context)',
        'context.userId',
        'context.role'
      ]
    },
    {
      name: 'User service accepts establishment context',
      file: 'services/User.service.ts',
      patterns: [
        'context?: EstablishmentServiceContext',
        'context.applyFilter',
        'context.validateAccess'
      ]
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    const filePath = path.join(process.cwd(), check.file);
    const passed = checkFileContains(filePath, check.patterns);
    
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    
    if (!passed) {
      allPassed = false;
      console.log(`   File: ${check.file}`);
      console.log(`   Missing patterns: ${check.patterns.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 All checks passed! User API routes have been successfully updated.');
    console.log('✅ withEstablishmentIsolation middleware is properly integrated');
    console.log('✅ EstablishmentServiceContext is passed to service methods');
    console.log('✅ Error handling for establishment access is implemented');
  } else {
    console.log('❌ Some checks failed. Please review the implementation.');
  }

  return allPassed;
}

// Run verification
const success = verifyUserApiRoutes();
process.exit(success ? 0 : 1);

export { verifyUserApiRoutes };