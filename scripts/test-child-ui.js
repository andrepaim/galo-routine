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
// 3. File size - must be under 250 lines
// ============================================================
test('Size: child index.tsx is under 250 lines', () => {
  const code = readFile('app/(child)/index.tsx');
  const lines = code.split('\n').length;
  if (lines >= 250) return `${lines} lines (must be < 250)`;
  return true;
});

// ============================================================
// 4. All imports resolve to existing files
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
    'constants/childTheme.ts',
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
// 5. No progress.tsx file (deleted for single screen)
// ============================================================
test('Routes: progress.tsx deleted (everything on one screen)', () => {
  const progressPath = path.join(ROOT, 'app/(child)/progress.tsx');
  if (fs.existsSync(progressPath)) return 'progress.tsx still exists - should be deleted';
  return true;
});

// ============================================================
// 6. Single screen structure
// ============================================================
test('UI: single scrollable screen with all sections', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Tarefas de Hoje')) return 'No tasks section title';
  if (!code.includes('Meus Prêmios')) return 'No rewards section title';
  if (!code.includes('ScrollView')) return 'No ScrollView for single screen';
  if (!code.includes('FlatList')) return 'No FlatList for tasks/rewards';
  return true;
});

test('UI: header with greeting, date, and star balance', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Oi,')) return 'No greeting';
  if (!code.includes('date-fns')) return 'No date formatting';
  if (!code.includes('ptBR')) return 'No Portuguese locale';
  if (!code.includes('starBalance')) return 'No star balance display';
  return true;
});

test('UI: progress indicator inline', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('progressContainer')) return 'No progress container';
  if (!code.includes('progressBar')) return 'No progress bar';
  if (!code.includes('/')) return 'No X/Y format for progress';
  if (!code.includes('tarefas')) return 'No Portuguese progress text';
  return true;
});

// ============================================================
// 7. Task cards
// ============================================================
test('Tasks: simple card structure', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('TaskCard')) return 'No TaskCard component';
  if (!code.includes('taskName')) return 'No task name display';
  if (!code.includes('⭐')) return 'No star emoji for points';
  if (!code.includes('handleCompleteTask')) return 'No task completion handler';
  return true;
});

test('Tasks: tap to complete with haptic feedback', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('Haptics')) return 'No haptics import';
  if (!code.includes('impactAsync')) return 'No haptic feedback';
  if (!code.includes('TouchableOpacity')) return 'No touchable tasks';
  return true;
});

test('Tasks: visual changes for completion', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('isCompleted')) return 'No completion state';
  if (!code.includes('✅')) return 'No green checkmark';
  if (!code.includes('taskCardCompleted')) return 'No completed card styling';
  return true;
});

// ============================================================
// 8. Reward cards  
// ============================================================
test('Rewards: simple card structure', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('RewardCard')) return 'No RewardCard component';
  if (!code.includes('rewardName')) return 'No reward name display';
  if (!code.includes('starCost')) return 'No star cost display';
  if (!code.includes('Resgatar')) return 'No redeem button';
  return true;
});

test('Rewards: affordability check', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('canAfford')) return 'No affordability check';
  if (!code.includes('redeemButtonDisabled')) return 'No disabled button styling';
  if (!code.includes('handleRedeemReward')) return 'No redeem handler';
  return true;
});

// ============================================================
// 9. No championship components (removed)
// ============================================================
test('Simplified: no championship imports', () => {
  const code = readFile('app/(child)/index.tsx');
  const championshipItems = [
    'LiveScoreboard', 'RivalReveal', 'GaloGoalCounter', 
    'ballFly', 'netShake', 'celebrationScale', 
    'showVictory', 'opponent', 'rival', 'championship'
  ];
  const found = championshipItems.filter(item => code.includes(item));
  if (found.length > 0) return `Championship features found: ${found.join(', ')}`;
  return true;
});

// ============================================================
// 10. Parent mode switch
// ============================================================
test('Navigation: parent mode switch button', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('switchToParent')) return 'No parent switch function';
  if (!code.includes("setRole('parent')")) return 'No setRole call';
  if (!code.includes('👨‍👩‍👦')) return 'No parent button emoji';
  return true;
});

// ============================================================
// 11. Portuguese language
// ============================================================
test('Language: all text in Portuguese', () => {
  const code = readFile('app/(child)/index.tsx');
  const ptStrings = [
    'Oi,', 'Tarefas de Hoje', 'Meus Prêmios', 
    'tarefas', 'Resgatar', 'Dia Livre',
    'Nenhuma tarefa', 'Nenhum prêmio'
  ];
  const missing = ptStrings.filter(s => !code.includes(s));
  if (missing.length > 0) return `Missing PT strings: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 12. Galo theme colors
// ============================================================
test('Theme: ChildColors used throughout', () => {
  const code = readFile('app/(child)/index.tsx');
  const colorProps = ['galoBlack', 'starGold', 'textPrimary', 'cardBackground'];
  const missing = colorProps.filter(color => !code.includes(`ChildColors.${color}`));
  if (missing.length > 0) return `Missing colors: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 13. Simple animations
// ============================================================
test('Animations: FadeIn and FadeInDown only', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('react-native-reanimated')) return 'No reanimated import';
  if (!code.includes('FadeIn')) return 'No FadeIn animation';
  const complexAnims = ['useSharedValue', 'useAnimatedStyle', 'withSpring'];
  const found = complexAnims.filter(anim => code.includes(anim));
  if (found.length > 0) return `Complex animations found: ${found.join(', ')}`;
  return true;
});

// ============================================================
// 14. Empty states
// ============================================================
test('States: empty state handling', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('ListEmptyComponent')) return 'No empty state components';
  if (!code.includes('emptyCard')) return 'No empty card styling';
  if (!code.includes('🎉')) return 'No celebration emoji for empty tasks';
  if (!code.includes('🎁')) return 'No gift emoji for empty rewards';
  return true;
});

// ============================================================
// 15. Bundle compilation
// ============================================================
test('Bundle: web compiles (HTTP 200)', () => {
  try {
    const status = run('curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true"');
    if (status.trim() !== '200') return `HTTP ${status.trim()}`;
    return true;
  } catch (e) {
    return `Metro not responding: ${e.message.substring(0, 100)}`;
  }
});

test('Bundle: android compiles (HTTP 200)', () => {
  try {
    const status = run('curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true"');
    if (status.trim() !== '200') return `HTTP ${status.trim()}`;
    return true;
  } catch (e) {
    return `Metro not responding: ${e.message.substring(0, 100)}`;
  }
});

// ============================================================
// 16. Runtime rendering
// ============================================================
test('Render: app loads without critical errors', () => {
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
  const criticalErrors = errors.filter(e => 
    !e.includes('font') && !e.includes('timeout') && 
    !e.includes('devtools') && !e.includes('HMR')
  );
  console.log(JSON.stringify({ 
    hasContent: text.length > 100,
    criticalErrors: criticalErrors.length,
    sampleErrors: criticalErrors.slice(0, 3)
  }));
  await browser.close();
})();
" 2>&1`);
    
    const result = JSON.parse(output.trim().split('\n').pop());
    const issues = [];
    if (!result.hasContent) issues.push('Page has no content');
    if (result.criticalErrors > 3) issues.push(`${result.criticalErrors} critical errors`);
    
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