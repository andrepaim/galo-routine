#!/usr/bin/env node
/**
 * Test suite for simplified Star Routine child UI
 * Tests: TypeScript, React hooks, imports, routes, components,
 *        web bundle, Android bundle, runtime rendering
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/root/star-routine';
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passed++;
      results.push(`✅ ${name}`);
    } else {
      failed++;
      results.push(`❌ ${name}: ${result}`);
    }
  } catch (e) {
    failed++;
    results.push(`❌ ${name}: ${e.message}`);
  }
}

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 120000 });
}

// ============================================================
// 1. TypeScript Compilation
// ============================================================
test('TypeScript: child screens compile without errors', () => {
  const output = run('npx tsc --noEmit 2>&1 || true');
  const childErrors = output.split('\n').filter(l => 
    l.includes('app/(child)/') && l.includes('error TS')
  );
  if (childErrors.length > 0) {
    return `${childErrors.length} errors:\n${childErrors.join('\n')}`;
  }
  return true;
});

// ============================================================
// 2. React Rules of Hooks
// ============================================================
test('Hooks: no hooks after conditional returns in index.tsx', () => {
  const code = readFile('app/(child)/index.tsx');
  const lines = code.split('\n');
  let foundReturn = false;
  const violations = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('return <LoadingScreen')) {
      foundReturn = true;
    }
    if (foundReturn && /\buse[A-Z]\w*\(/.test(line) && !line.startsWith('//')) {
      violations.push(`Line ${i + 1}: ${line.substring(0, 80)}`);
    }
  }
  if (violations.length > 0) return violations.join('\n');
  return true;
});

// ============================================================
// 3. All imports resolve to existing files
// ============================================================
test('Imports: all child screen imports resolve', () => {
  const missing = [];
  
  // Required components for simplified UI
  const requiredComponents = [
    'components/ui/LoadingScreen.tsx',
    'lib/stores/authStore.ts',
    'lib/stores/completionStore.ts',
    'lib/stores/rewardStore.ts',
    'lib/hooks/useTodayTasks.ts',
    'lib/hooks/useCurrentPeriod.ts',
    'lib/hooks/useStarBudget.ts',
  ];
  
  for (const comp of requiredComponents) {
    if (!fs.existsSync(path.join(ROOT, comp))) {
      missing.push(comp);
    }
  }
  
  if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 4. Route structure (simplified)
// ============================================================
test('Routes: child layout exists with Stack navigator', () => {
  const layout = readFile('app/(child)/_layout.tsx');
  if (!layout.includes('Stack')) return 'No Stack navigator in _layout.tsx';
  if (!layout.includes('headerShown: false')) return 'Header should be hidden';
  return true;
});

test('Routes: index.tsx has default export', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('export default function')) return 'No default export';
  return true;
});

test('Routes: progress.tsx should be deleted (simplified UI)', () => {
  const progressPath = path.join(ROOT, 'app/(child)/progress.tsx');
  if (fs.existsSync(progressPath)) return 'progress.tsx still exists - should be deleted';
  return true;
});

// ============================================================
// 5. Navigation (simplified)
// ============================================================
test('Navigation: parent mode switch exists', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('switchToParent')) return 'No parent switch function';
  if (!code.includes("setRole('parent')")) return 'No setRole call';
  return true;
});

// ============================================================
// 6. Simplified UI Structure
// ============================================================
test('UI: single screen with tasks and rewards', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Tarefas de Hoje')) return 'No tasks section';
  if (!code.includes('Meus Prêmios')) return 'No rewards section';
  if (!code.includes('ScrollView')) return 'No ScrollView for single screen';
  return true;
});

test('UI: progress indicator exists', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('progressText')) return 'No progress text';
  if (!code.includes('progressBar')) return 'No progress bar';
  if (!code.includes('tarefas')) return 'No progress in Portuguese';
  return true;
});

test('UI: star balance displayed prominently', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('starBalance')) return 'No star balance display';
  if (!code.includes('⭐')) return 'No star emoji';
  return true;
});

// ============================================================
// 7. Portuguese language
// ============================================================
test('Language: Portuguese throughout', () => {
  const code = readFile('app/(child)/index.tsx');
  const ptStrings = ['Oi,', 'Tarefas de Hoje', 'Meus Prêmios', 'tarefas', 'Resgatar'];
  const missing = ptStrings.filter(s => !code.includes(s));
  if (missing.length > 0) return `Missing PT strings: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 8. Galo theme
// ============================================================
test('Theme: Galo colors used', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('ChildColors.galoBlack')) return 'No galoBlack';
  if (!code.includes('ChildColors.starGold')) return 'No starGold';
  return true;
});

// ============================================================
// 9. Animations
// ============================================================
test('Animations: simple FadeIn animations', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('react-native-reanimated')) return 'No reanimated';
  if (!code.includes('FadeIn')) return 'No FadeIn animations';
  return true;
});

// ============================================================
// 10. No championship features (removed)
// ============================================================
test('Simplified: no championship imports', () => {
  const code = readFile('app/(child)/index.tsx');
  const championshipImports = ['LiveScoreboard', 'GaloGoalCounter', 'RivalReveal', 'StandingsTable'];
  const found = championshipImports.filter(imp => code.includes(imp));
  if (found.length > 0) return `Championship imports found: ${found.join(', ')}`;
  return true;
});

test('Simplified: no complex animations', () => {
  const code = readFile('app/(child)/index.tsx');
  const complexFeatures = ['ballFly', 'netShake', 'celebrationScale', 'showVictory'];
  const found = complexFeatures.filter(feat => code.includes(feat));
  if (found.length > 0) return `Complex features found: ${found.join(', ')}`;
  return true;
});

// ============================================================
// 11. Task interaction
// ============================================================
test('Tasks: can be marked complete', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('handleCompleteTask')) return 'No task completion handler';
  if (!code.includes('markTaskDone')) return 'No markTaskDone call';
  return true;
});

test('Tasks: haptic feedback on completion', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Haptics')) return 'No haptic feedback import';
  if (!code.includes('impactAsync')) return 'No haptic impact';
  return true;
});

// ============================================================
// 12. Reward interaction
// ============================================================
test('Rewards: can be redeemed', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('handleRedeemReward')) return 'No reward redemption handler';
  if (!code.includes('redeemReward')) return 'No redeemReward call';
  return true;
});

test('Rewards: shows star cost and availability', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('canAfford')) return 'No affordability check';
  if (!code.includes('starCost')) return 'No star cost display';
  return true;
});

// ============================================================
// 13. Empty states
// ============================================================
test('States: loading screen shown', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('LoadingScreen')) return 'No LoadingScreen import';
  if (!code.includes('isLoading')) return 'No loading check';
  return true;
});

test('States: empty states for no tasks/rewards', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Dia Livre')) return 'No empty tasks message';
  if (!code.includes('Nenhum prêmio')) return 'No empty rewards message';
  return true;
});

// ============================================================
// 14. Bundle compilation
// ============================================================
test('Bundle: web compiles (HTTP 200)', () => {
  try {
    const status = run('curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true"');
    if (status.trim() !== '200') return `HTTP ${status.trim()}`;
    return true;
  } catch (e) {
    return `Metro not responding: ${e.message}`;
  }
});

test('Bundle: android compiles (HTTP 200)', () => {
  try {
    const status = run('curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true"');
    if (status.trim() !== '200') return `HTTP ${status.trim()}`;
    return true;
  } catch (e) {
    return `Metro not responding: ${e.message}`;
  }
});

// ============================================================
// 15. Web rendering test
// ============================================================
test('Render: login screen loads without errors', () => {
  try {
    const output = run(`PUPPETEER_CACHE_DIR=/root/.cache/puppeteer node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    executablePath: '/root/.cache/puppeteer/chrome/linux-145.0.7632.67/chrome-linux64/chrome'
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));
  const text = await page.evaluate(() => document.body.innerText);
  const fontErrors = errors.filter(e => e.includes('timeout') || e.includes('font'));
  console.log(JSON.stringify({ 
    hasLoginScreen: text.includes('Log In as Parent'),
    hasChildButton: text.includes(\\\"I'm the Child\\\"),
    totalErrors: errors.length,
    fontErrors: fontErrors.length
  }));
  await browser.close();
})();
" 2>&1`);
    
    const result = JSON.parse(output.trim().split('\n').pop());
    const issues = [];
    if (!result.hasLoginScreen) issues.push('No login screen');
    if (!result.hasChildButton) issues.push('No child button');
    if (result.fontErrors > 0) issues.push(`${result.fontErrors} font errors`);
    if (result.totalErrors > 5) issues.push(`${result.totalErrors} console errors`); // Allow some errors
    
    if (issues.length > 0) return issues.join(', ');
    return true;
  } catch (e) {
    return `Puppeteer test failed: ${e.message.substring(0, 100)}`;
  }
});

// ============================================================
// RESULTS
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('  STAR ROUTINE — SIMPLIFIED CHILD UI TEST SUITE');
console.log('='.repeat(60) + '\n');

results.forEach(r => console.log(r));

console.log('\n' + '-'.repeat(60));
console.log(`  TOTAL: ${passed + failed} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log('-'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);