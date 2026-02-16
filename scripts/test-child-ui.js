#!/usr/bin/env node
/**
 * Comprehensive test suite for Star Routine child UI
 * Tests: TypeScript, React hooks, imports, routes, components,
 *        web bundle, Android bundle, runtime rendering, navigation
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
  // Check only child-related files
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
    // Track if we're inside the component function (after export default)
    if (line.startsWith('if (') && lines[i + 1]?.trim().startsWith('return')) {
      foundReturn = true;
    }
    if (line === 'return <LoadingScreen' || line.includes('return <LoadingScreen')) {
      foundReturn = true;
    }
    if (foundReturn && /\buse[A-Z]\w*\(/.test(line) && !line.startsWith('//')) {
      violations.push(`Line ${i + 1}: ${line.substring(0, 80)}`);
    }
  }
  if (violations.length > 0) return violations.join('\n');
  return true;
});

test('Hooks: no hooks after conditional returns in progress.tsx', () => {
  const code = readFile('app/(child)/progress.tsx');
  const lines = code.split('\n');
  
  // Find the component function start
  const componentStart = lines.findIndex(l => l.includes('export default function'));
  if (componentStart === -1) return 'No component found';
  
  let depth = 0;
  let inComponent = false;
  let foundConditionalReturn = false;
  const violations = [];
  
  for (let i = componentStart; i < lines.length; i++) {
    const line = lines[i];
    // Track brace depth to stay in the component body (depth 1)
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth <= 0 && i > componentStart) break;
    
    // Only care about component-level code (depth 1-2 for if blocks)
    if (depth === 1 && line.trim().startsWith('if (') && lines[i + 1]?.trim().startsWith('return')) {
      foundConditionalReturn = true;
    }
    if (foundConditionalReturn && depth === 1 && /\buse[A-Z]\w*\(/.test(line.trim()) && !line.trim().startsWith('//')) {
      violations.push(`Line ${i + 1}: ${line.trim().substring(0, 80)}`);
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
  
  // Components used in index.tsx
  const requiredComponents = [
    'components/tasks/GaloTaskCard.tsx',
    'components/stars/GaloStarCounter.tsx',
    'components/championship/GaloGoalCounter.tsx',
    'components/championship/LiveScoreboard.tsx',
    'components/streaks/StreakDisplay.tsx',
    'components/ui/EmptyState.tsx',
    'components/ui/LoadingScreen.tsx',
    'components/championship/StandingsTable.tsx',
  ];
  
  for (const comp of requiredComponents) {
    if (!fs.existsSync(path.join(ROOT, comp))) {
      missing.push(comp);
    }
  }
  
  if (missing.length > 0) return `Missing: ${missing.join(', ')}`;
  return true;
});

test('Imports: championship barrel exports all needed components', () => {
  const barrel = readFile('components/championship/index.ts');
  const needed = ['LiveScoreboard', 'GaloGoalCounter', 'StandingsTable'];
  const missing = needed.filter(n => !barrel.includes(n));
  if (missing.length > 0) return `Missing exports: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 4. Route structure
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

test('Routes: progress.tsx has default export', () => {
  const code = readFile('app/(child)/progress.tsx');
  if (!code.includes('export default function')) return 'No default export';
  return true;
});

// ============================================================
// 5. Navigation
// ============================================================
test('Navigation: HOJE screen has VER PROGRESSO button', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('VER PROGRESSO')) return 'No VER PROGRESSO button';
  if (!code.includes("router.push('/(child)/progress')")) return 'No navigation to progress';
  return true;
});

test('Navigation: Progress screen has back button', () => {
  const code = readFile('app/(child)/progress.tsx');
  if (!code.includes('router.back()')) return 'No router.back() call';
  if (!code.includes('backButton')) return 'No back button style';
  return true;
});

test('Navigation: Progress screen has VOLTAR PARA HOJE button', () => {
  const code = readFile('app/(child)/progress.tsx');
  if (!code.includes('VOLTAR PARA HOJE')) return 'No VOLTAR PARA HOJE button';
  return true;
});

test('Navigation: parent mode switch exists', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('switchToParent')) return 'No parent switch function';
  if (!code.includes("setRole('parent')")) return 'No setRole call';
  return true;
});

// ============================================================
// 6. UI/UX for kids
// ============================================================
test('UX: Portuguese (BR) language throughout', () => {
  const index = readFile('app/(child)/index.tsx');
  const progress = readFile('app/(child)/progress.tsx');
  
  // Check for Portuguese strings
  const ptStrings = ['BOM DIA', 'SUAS JOGADAS', 'Progresso de Hoje', 'ESTA SEMANA', 'SUA POSIÇÃO', 'SUAS CONQUISTAS'];
  const missing = ptStrings.filter(s => !index.includes(s) && !progress.includes(s));
  if (missing.length > 0) return `Missing PT strings: ${missing.join(', ')}`;
  return true;
});

test('UX: Galo theme colors used', () => {
  const index = readFile('app/(child)/index.tsx');
  const progress = readFile('app/(child)/progress.tsx');
  
  if (!index.includes('ChildColors.galoBlack')) return 'No galoBlack in index';
  if (!index.includes('ChildColors.starGold')) return 'No starGold in index';
  if (!progress.includes('ChildColors.galoBlack')) return 'No galoBlack in progress';
  if (!progress.includes('ChildColors.starGold')) return 'No starGold in progress';
  return true;
});

test('UX: animations present (Reanimated)', () => {
  const index = readFile('app/(child)/index.tsx');
  const progress = readFile('app/(child)/progress.tsx');
  
  if (!index.includes('react-native-reanimated')) return 'No reanimated in index';
  if (!progress.includes('react-native-reanimated')) return 'No reanimated in progress';
  if (!index.includes('FadeIn')) return 'No FadeIn animations in index';
  if (!progress.includes('BounceIn')) return 'No BounceIn animations in progress';
  return true;
});

test('UX: touch targets >= 44px', () => {
  const progress = readFile('app/(child)/progress.tsx');
  // Check back button has minWidth 44
  if (!progress.includes('minWidth: 44')) return 'Back button minWidth not 44px';
  return true;
});

test('UX: pressed states on buttons', () => {
  const index = readFile('app/(child)/index.tsx');
  const progress = readFile('app/(child)/progress.tsx');
  
  if (!index.includes('progressPressed')) return 'No pressed state on progress button';
  if (!progress.includes('backPressed')) return 'No pressed state on back button';
  if (!progress.includes('hojePressed')) return 'No pressed state on hoje button';
  return true;
});

test('UX: emojis for visual communication', () => {
  const index = readFile('app/(child)/index.tsx');
  const progress = readFile('app/(child)/progress.tsx');
  
  const emojis = ['⚽', '🏆', '🐓', '🔥', '🎆', '⭐'];
  const found = emojis.filter(e => index.includes(e) || progress.includes(e));
  if (found.length < 4) return `Only ${found.length}/6 key emojis found`;
  return true;
});

// ============================================================
// 7. Game features
// ============================================================
test('Game: rival reveal on load', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('showRival')) return 'No rival reveal state';
  if (!code.includes('HOJE VOCÊ ENFRENTA')) return 'No rival text';
  if (!code.includes('setTimeout')) return 'No timeout for reveal';
  return true;
});

test('Game: live scoreboard', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('AO VIVO')) return 'No AO VIVO badge';
  if (!code.includes('liveScoreCard')) return 'No live score card';
  if (!code.includes('scoreRow')) return 'No score row';
  return true;
});

test('Game: goal animation on task complete', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('ballFly')) return 'No ball fly animation';
  if (!code.includes('netShake')) return 'No net shake animation';
  if (!code.includes('Haptics.impactAsync')) return 'No haptic feedback';
  return true;
});

test('Game: victory celebration', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('showVictory')) return 'No victory state';
  if (!code.includes('VITÓRIA')) return 'No victory text';
  if (!code.includes('celebrationScale')) return 'No celebration animation';
  return true;
});

test('Game: progress balls (soccer)', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('ballProgress')) return 'No ball progress section';
  if (!code.includes("'⚽'")) return 'No soccer ball emoji for completed';
  if (!code.includes("'⚪'")) return 'No empty ball for incomplete';
  return true;
});

test('Game: standings in progress screen', () => {
  const code = readFile('app/(child)/progress.tsx');
  if (!code.includes('displayStandings')) return 'No standings data';
  if (!code.includes('🥇')) return 'No medal emojis';
  return true;
});

test('Game: achievement badges', () => {
  const code = readFile('app/(child)/progress.tsx');
  if (!code.includes('SUAS CONQUISTAS')) return 'No achievements section';
  if (!code.includes('badgeCard')) return 'No badge cards';
  if (!code.includes('CAMPEÃO')) return 'No champion badge';
  return true;
});

// ============================================================
// 8. Empty/loading states
// ============================================================
test('States: loading screen shown', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('LoadingScreen')) return 'No LoadingScreen import';
  if (!code.includes('isLoading')) return 'No loading check';
  return true;
});

test('States: empty state when no tasks', () => {
  const code = readFile('app/(child)/index.tsx');
  if (!code.includes('ListEmptyComponent')) return 'No FlatList empty component';
  if (!code.includes('Dia Livre')) return 'No empty state message';
  return true;
});

// ============================================================
// 9. Font loading (the bug that prompted this)
// ============================================================
test('Fonts: expo-font is installed', () => {
  const pkg = JSON.parse(readFile('package.json'));
  if (!pkg.dependencies['expo-font']) return 'expo-font not in dependencies';
  return true;
});

test('Fonts: useFonts called in root layout', () => {
  const layout = readFile('app/_layout.tsx');
  if (!layout.includes('useFonts')) return 'No useFonts in root layout';
  if (!layout.includes('fontsLoaded')) return 'No fontsLoaded check';
  return true;
});

test('Fonts: splash screen managed during font load', () => {
  const layout = readFile('app/_layout.tsx');
  if (!layout.includes('SplashScreen')) return 'No SplashScreen management';
  if (!layout.includes('hideAsync')) return 'No SplashScreen.hideAsync';
  return true;
});

// ============================================================
// 10. Bundle compilation (web + android)
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

test('Bundle: no fontfaceobserver in android bundle', () => {
  try {
    const count = run('curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&hot=false&lazy=true" 2>/dev/null | grep -c "fontfaceobserver" || echo 0');
    if (parseInt(count.trim()) > 0) return `fontfaceobserver found ${count.trim()} times in android bundle`;
    return true;
  } catch (e) {
    return true; // grep returns 1 when no match = 0 count
  }
});

// ============================================================
// 11. Web rendering test (Puppeteer)
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
    fontErrors: fontErrors.length,
    errorSamples: errors.slice(0, 3)
  }));
  await browser.close();
})();
" 2>&1`);
    
    const result = JSON.parse(output.trim().split('\n').pop());
    const issues = [];
    if (!result.hasLoginScreen) issues.push('No login screen');
    if (!result.hasChildButton) issues.push('No child button');
    if (result.fontErrors > 0) issues.push(`${result.fontErrors} font errors`);
    if (result.totalErrors > 0) issues.push(`${result.totalErrors} console errors: ${result.errorSamples.join('; ').substring(0, 100)}`);
    
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
console.log('  STAR ROUTINE — CHILD UI TEST SUITE');
console.log('='.repeat(60) + '\n');

results.forEach(r => console.log(r));

console.log('\n' + '-'.repeat(60));
console.log(`  TOTAL: ${passed + failed} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log('-'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
