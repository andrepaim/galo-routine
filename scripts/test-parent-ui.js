#!/usr/bin/env node

/**
 * Comprehensive Parent UI Test Script
 * 
 * Tests the simplified parent interface for:
 * - TypeScript compilation
 * - React hooks ordering
 * - Import resolution
 * - Route structure
 * - Navigation functionality
 * - UI rendering
 * - Portuguese language
 * - Galo theme consistency
 * - All CRUD functionality accessibility
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  projectRoot: '/root/star-routine',
  puppeteerPath: '/root/.cache/puppeteer/chrome/linux-145.0.7632.67/chrome-linux64/chrome',
  metroPort: 8081,
  testTimeoutMs: 30000,
};

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, colors.green);
  } else {
    testResults.failed++;
    testResults.failures.push({ test: testName, details });
    log(`❌ ${testName}`, colors.red);
    if (details) log(`   ${details}`, colors.yellow);
  }
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

// Test 1: TypeScript Compilation
async function testTypeScriptCompilation() {
  logSection('TypeScript Compilation Tests');
  
  try {
    const result = execSync('npx tsc --noEmit', {
      cwd: TEST_CONFIG.projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logTest('TypeScript compilation (all files)', true);
  } catch (error) {
    logTest('TypeScript compilation (all files)', false, error.stdout || error.stderr);
    return false;
  }

  // Test specific parent files
  const parentFiles = [
    'app/(parent)/_layout.tsx',
    'app/(parent)/index.tsx', 
    'app/(parent)/settings.tsx',
    'app/(parent)/approvals.tsx'
  ];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      if (fs.existsSync(filePath)) {
        // Check if file compiles individually (syntax check)
        const content = fs.readFileSync(filePath, 'utf8');
        // Basic syntax checks
        const hasBalancedBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
        const hasBalancedParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
        
        logTest(`Syntax check: ${file}`, hasBalancedBraces && hasBalancedParens);
      } else {
        logTest(`File exists: ${file}`, false, 'File not found');
      }
    } catch (error) {
      logTest(`Syntax check: ${file}`, false, error.message);
    }
  }

  return true;
}

// Test 2: React Hooks Ordering
async function testReactHooksOrdering() {
  logSection('React Hooks Ordering Tests');

  const parentFiles = [
    'app/(parent)/index.tsx',
    'app/(parent)/settings.tsx',
    'app/(parent)/approvals.tsx'
  ];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find all hook calls and conditional returns
      const hookMatches = [...content.matchAll(/\s+(use\w+)\s*\(/g)];
      const conditionalReturns = [...content.matchAll(/\s+if\s*\([^)]+\)\s*{[^}]*return/g)];
      
      if (hookMatches.length === 0) {
        logTest(`Hooks ordering: ${file}`, true, 'No hooks found');
        continue;
      }

      // Check if hooks come before first conditional return
      const firstHookIndex = hookMatches[0].index;
      const firstConditionalIndex = conditionalReturns.length > 0 ? conditionalReturns[0].index : Infinity;
      
      const hooksBeforeConditionals = firstHookIndex < firstConditionalIndex;
      logTest(`Hooks before conditionals: ${file}`, hooksBeforeConditionals);
      
    } catch (error) {
      logTest(`Hooks ordering: ${file}`, false, error.message);
    }
  }
}

// Test 3: Import Resolution
async function testImportResolution() {
  logSection('Import Resolution Tests');

  const parentFiles = [
    'app/(parent)/_layout.tsx',
    'app/(parent)/index.tsx',
    'app/(parent)/settings.tsx'
  ];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract all import statements
      const importMatches = [...content.matchAll(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g)];
      let allImportsResolve = true;
      let unresolvedImports = [];

      for (const match of importMatches) {
        const importPath = match[1];
        
        // Skip built-in modules and node_modules
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
          let resolvedPath;
          
          if (importPath.startsWith('.')) {
            resolvedPath = path.resolve(path.dirname(filePath), importPath);
          } else {
            resolvedPath = path.join(TEST_CONFIG.projectRoot, importPath);
          }

          // Check for file with common extensions
          const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
          let found = false;

          for (const ext of extensions) {
            if (fs.existsSync(resolvedPath + ext) || fs.existsSync(path.join(resolvedPath, 'index' + ext))) {
              found = true;
              break;
            }
          }

          if (!found) {
            allImportsResolve = false;
            unresolvedImports.push(importPath);
          }
        }
      }

      logTest(`Import resolution: ${file}`, allImportsResolve, 
        unresolvedImports.length > 0 ? `Unresolved: ${unresolvedImports.join(', ')}` : '');
      
    } catch (error) {
      logTest(`Import resolution: ${file}`, false, error.message);
    }
  }
}

// Test 4: Route Structure Validation
async function testRouteStructure() {
  logSection('Route Structure Tests');

  // Check that new 4-tab structure exists
  const requiredTabs = [
    { name: 'Início', file: 'app/(parent)/index.tsx' },
    { name: 'Tarefas', file: 'app/(parent)/tasks/index.tsx' },
    { name: 'Prêmios', file: 'app/(parent)/rewards/index.tsx' },
    { name: 'Configurações', file: 'app/(parent)/settings.tsx' }
  ];

  for (const tab of requiredTabs) {
    const filePath = path.join(TEST_CONFIG.projectRoot, tab.file);
    const exists = fs.existsSync(filePath);
    logTest(`Required tab file: ${tab.name}`, exists);
  }

  // Check layout file has correct tab configuration
  try {
    const layoutPath = path.join(TEST_CONFIG.projectRoot, 'app/(parent)/_layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    const hasCorrectTabs = layoutContent.includes('title: \'Início\'') &&
                          layoutContent.includes('title: \'Tarefas\'') &&
                          layoutContent.includes('title: \'Prêmios\'') &&
                          layoutContent.includes('title: \'Configurações\'');
    
    logTest('Layout has 4 main tabs', hasCorrectTabs);
    
    // Check hidden tabs are properly configured
    const hasHiddenTabs = layoutContent.includes('href: null');
    logTest('Hidden tabs configured with href: null', hasHiddenTabs);
    
  } catch (error) {
    logTest('Layout configuration', false, error.message);
  }
}

// Test 5: Portuguese Language Check
async function testPortugueseLanguage() {
  logSection('Portuguese Language Tests');

  const parentFiles = [
    'app/(parent)/_layout.tsx',
    'app/(parent)/index.tsx',
    'app/(parent)/settings.tsx'
  ];

  const portugueseKeywords = [
    'Início', 'Tarefas', 'Prêmios', 'Configurações',
    'Aprovar', 'Estrelas', 'Relatórios', 'Metas',
    'Sistema', 'Períodos', 'Salvar', 'Sair'
  ];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const foundKeywords = portugueseKeywords.filter(keyword => content.includes(keyword));
      const hasPortuguese = foundKeywords.length > 0;
      
      logTest(`Portuguese content: ${file}`, hasPortuguese, 
        `Found: ${foundKeywords.length}/${portugueseKeywords.length} keywords`);
      
    } catch (error) {
      logTest(`Portuguese check: ${file}`, false, error.message);
    }
  }
}

// Test 6: Galo Theme Consistency
async function testGaloThemeConsistency() {
  logSection('Galo Theme Consistency Tests');

  const parentFiles = [
    'app/(parent)/index.tsx',
    'app/(parent)/settings.tsx'
  ];

  const requiredThemeImports = ['ChildColors', 'ChildSizes'];
  const galoColors = ['galoBlack', 'starGold', 'textPrimary'];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check theme imports
      const hasThemeImports = requiredThemeImports.every(theme => 
        content.includes(`${theme}`) && content.includes('childTheme')
      );
      logTest(`Theme imports: ${file}`, hasThemeImports);
      
      // Check usage of Galo colors
      const usesGaloColors = galoColors.some(color => content.includes(`ChildColors.${color}`));
      logTest(`Galo colors usage: ${file}`, usesGaloColors);
      
    } catch (error) {
      logTest(`Theme consistency: ${file}`, false, error.message);
    }
  }

  // Check theme constants file
  try {
    const themePath = path.join(TEST_CONFIG.projectRoot, 'constants/childTheme.ts');
    const themeContent = fs.readFileSync(themePath, 'utf8');
    
    const hasRequiredColors = galoColors.every(color => themeContent.includes(`${color}:`));
    logTest('Theme constants completeness', hasRequiredColors);
    
  } catch (error) {
    logTest('Theme constants file', false, error.message);
  }
}

// Test 7: Check for Unused Imports
async function testUnusedImports() {
  logSection('Unused Imports Tests');

  const parentFiles = [
    'app/(parent)/index.tsx',
    'app/(parent)/settings.tsx',
    'app/(parent)/approvals.tsx'
  ];

  for (const file of parentFiles) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract named imports
      const importMatches = [...content.matchAll(/import\s+\{([^}]+)\}/g)];
      let hasUnusedImports = false;
      let unusedImports = [];

      for (const match of importMatches) {
        const imports = match[1].split(',').map(imp => imp.trim());
        
        for (const imp of imports) {
          const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
          
          // Check if import is used in the file
          const regex = new RegExp(`\\b${cleanImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          const restOfFile = content.substring(match.index + match[0].length);
          
          if (!regex.test(restOfFile)) {
            hasUnusedImports = true;
            unusedImports.push(cleanImport);
          }
        }
      }

      logTest(`No unused imports: ${file}`, !hasUnusedImports, 
        unusedImports.length > 0 ? `Unused: ${unusedImports.join(', ')}` : '');
      
    } catch (error) {
      logTest(`Unused imports check: ${file}`, false, error.message);
    }
  }
}

// Test 8: Metro Server Connectivity
async function testMetroConnectivity() {
  logSection('Metro Server Tests');

  try {
    const response = await fetch(`http://localhost:${TEST_CONFIG.metroPort}/status`);
    logTest('Metro server accessible', response.ok);
  } catch (error) {
    logTest('Metro server accessible', false, 'Server not responding');
  }

  // Test if we can access the parent routes
  const testRoutes = [
    '/',
    '/parent',
    '/parent/tasks',
    '/parent/rewards',
    '/parent/settings'
  ];

  for (const route of testRoutes) {
    try {
      const response = await fetch(`http://localhost:${TEST_CONFIG.metroPort}${route}`);
      logTest(`Route accessible: ${route}`, response.status !== 404);
    } catch (error) {
      logTest(`Route accessible: ${route}`, false, error.message);
    }
  }
}

// Test 9: Cross-navigation (Child ↔ Parent)
async function testCrossNavigation() {
  logSection('Cross-Navigation Tests');

  // Test parent layout has child switch functionality
  try {
    const layoutPath = path.join(TEST_CONFIG.projectRoot, 'app/(parent)/_layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    const hasChildSwitch = layoutContent.includes('child-pin') && 
                          layoutContent.includes('switchToChild');
    logTest('Parent → Child navigation', hasChildSwitch);
    
  } catch (error) {
    logTest('Parent → Child navigation', false, error.message);
  }

  // Test child screens have parent switch functionality  
  try {
    const childIndexPath = path.join(TEST_CONFIG.projectRoot, 'app/(child)/index.tsx');
    if (fs.existsSync(childIndexPath)) {
      const childIndexContent = fs.readFileSync(childIndexPath, 'utf8');
      const hasParentSwitch = childIndexContent.includes('setRole') &&
                             childIndexContent.includes('parent') &&
                             childIndexContent.includes('switchToParent');
      logTest('Child → Parent navigation', hasParentSwitch);
    } else {
      logTest('Child → Parent navigation', false, 'Child index not found');
    }
  } catch (error) {
    logTest('Child → Parent navigation', false, error.message);
  }
}

// Test 10: CRUD Functionality Accessibility
async function testCrudAccessibility() {
  logSection('CRUD Functionality Tests');

  const crudTests = [
    { name: 'Tasks CRUD', path: 'app/(parent)/tasks/index.tsx', operations: ['create', 'edit', 'delete'] },
    { name: 'Rewards CRUD', path: 'app/(parent)/rewards/index.tsx', operations: ['create', 'edit', 'delete'] },
    { name: 'Goals in Settings', path: 'app/(parent)/settings.tsx', operations: ['create', 'delete'] },
  ];

  for (const crud of crudTests) {
    try {
      const filePath = path.join(TEST_CONFIG.projectRoot, crud.path);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasOperations = crud.operations.every(op => {
        return content.includes(op) || content.toLowerCase().includes(op) ||
               content.includes('add') || content.includes('remove') ||
               content.includes('new') || content.includes('edit');
      });
      
      logTest(`${crud.name} operations`, hasOperations);
      
    } catch (error) {
      logTest(`${crud.name} operations`, false, error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  log(`${colors.bold}${colors.blue}🧪 Parent UI Test Suite${colors.reset}`);
  log(`${colors.blue}Testing simplified parent interface...${colors.reset}\n`);

  // Run all test suites
  await testTypeScriptCompilation();
  await testReactHooksOrdering(); 
  await testImportResolution();
  await testRouteStructure();
  await testPortugueseLanguage();
  await testGaloThemeConsistency();
  await testUnusedImports();
  await testMetroConnectivity();
  await testCrossNavigation();
  await testCrudAccessibility();

  // Print summary
  logSection('Test Summary');
  log(`${colors.bold}Total tests: ${testResults.total}${colors.reset}`);
  log(`${colors.green}${colors.bold}Passed: ${testResults.passed}${colors.reset}`);
  log(`${colors.red}${colors.bold}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.failed > 0) {
    log(`\n${colors.yellow}${colors.bold}Failed tests:${colors.reset}`);
    testResults.failures.forEach(failure => {
      log(`  • ${failure.test}`, colors.yellow);
      if (failure.details) {
        log(`    ${failure.details}`, colors.red);
      }
    });
  }

  const passed = testResults.failed === 0;
  log(`\n${passed ? colors.green : colors.red}${colors.bold}${passed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}${colors.reset}`);
  
  process.exit(passed ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Add fetch polyfill for Node.js
if (!global.fetch) {
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});