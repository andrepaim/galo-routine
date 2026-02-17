#!/usr/bin/env node
/**
 * Test suite for simplified Star Routine parent UI
 * Tests the new 2-tab structure: Hoje + Gerenciar
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
test('TypeScript: parent screens compile without errors', () => {
  const output = run('npx tsc --noEmit 2>&1 || true');
  const parentErrors = output.split('\n').filter(l => 
    l.includes('app/(parent)/') && l.includes('error TS')
  );
  if (parentErrors.length > 0) {
    return `${parentErrors.length} errors:\n${parentErrors.join('\n')}`;
  }
  return true;
});

// ============================================================
// 2. Layout Structure (2-tab)
// ============================================================
test('Layout: 2-tab structure (Hoje + Gerenciar)', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!layout.includes('name="index"')) return 'No index tab';
  if (!layout.includes('name="manage"')) return 'No manage tab';
  if (!layout.includes('Hoje')) return 'No Hoje title';
  if (!layout.includes('Gerenciar')) return 'No Gerenciar title';
  
  // Should hide other tabs
  if (!layout.includes('href: null')) return 'Old tabs not hidden';
  
  return true;
});

test('Layout: child switch button exists', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  if (!layout.includes('switchToChild')) return 'No child switch function';
  if (!layout.includes('child-pin')) return 'No child-pin route';
  return true;
});

// ============================================================
// 3. Hoje Tab (Dashboard)
// ============================================================
test('Hoje: dashboard shows key stats', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('starBalance')) return 'No star balance';
  if (!index.includes('completedCount')) return 'No completed count';
  if (!index.includes('totalTasks')) return 'No total tasks';
  
  return true;
});

test('Hoje: pending approvals section', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Aguardando Aprovação')) return 'No approvals section title';
  if (!index.includes('ApprovalCard')) return 'No ApprovalCard component';
  if (!index.includes('handleApprove')) return 'No approve handler';
  if (!index.includes('handleReject')) return 'No reject handler';
  
  return true;
});

test('Hoje: quick task creation', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Tarefa Rápida')) return 'No quick task section';
  if (!index.includes('addTask')) return 'No addTask call';
  
  return true;
});

test('Hoje: default tasks initialization', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('DEFAULT_TASKS')) return 'No default tasks defined';
  if (!index.includes('Escovar os dentes')) return 'No teeth brushing task';
  if (!index.includes('Fazer lição de casa')) return 'No homework task';
  
  return true;
});

// ============================================================
// 4. Gerenciar Tab (Management)
// ============================================================
test('Gerenciar: manage.tsx exists', () => {
  const managePath = path.join(ROOT, 'app/(parent)/manage.tsx');
  if (!fs.existsSync(managePath)) return 'manage.tsx does not exist';
  
  const manage = readFile('app/(parent)/manage.tsx');
  if (!manage.includes('export default function ManageScreen')) return 'No ManageScreen export';
  
  return true;
});

test('Gerenciar: tasks and rewards sections', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('Tarefas')) return 'No tasks section';
  if (!manage.includes('Prêmios')) return 'No rewards section';
  if (!manage.includes('tasksExpanded')) return 'No collapsible tasks';
  if (!manage.includes('rewardsExpanded')) return 'No collapsible rewards';
  
  return true;
});

test('Gerenciar: task management actions', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('Nova Tarefa')) return 'No new task button';
  if (!manage.includes('Gerenciar Todas')) return 'No manage all tasks button';
  if (!manage.includes('TaskCard')) return 'No TaskCard component';
  
  return true;
});

test('Gerenciar: reward management actions', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('Novo Prêmio')) return 'No new reward button';
  if (!manage.includes('Gerenciar Todos')) return 'No manage all rewards button';
  if (!manage.includes('RewardCard')) return 'No RewardCard component';
  
  return true;
});

test('Gerenciar: default rewards initialization', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('DEFAULT_REWARDS')) return 'No default rewards';
  if (!manage.includes('30min de videogame')) return 'No videogame reward';
  if (!manage.includes('Sorvete')) return 'No ice cream reward';
  
  return true;
});

// ============================================================
// 5. Store Integration
// ============================================================
test('Stores: correct store methods used', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  // Check for correct task store methods
  if (!index.includes('addTask')) return 'index.tsx not using addTask';
  if (!manage.includes('subscribe:')) return 'manage.tsx not using subscribe alias';
  if (!manage.includes('toggleTask')) return 'manage.tsx not using toggleTask';
  
  // Check for correct reward store methods  
  if (!manage.includes('addReward')) return 'manage.tsx not using addReward';
  if (!manage.includes('toggleReward')) return 'manage.tsx not using toggleReward';
  
  return true;
});

// ============================================================
// 6. Portuguese Language
// ============================================================
test('Language: Portuguese throughout both tabs', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  const indexPtStrings = ['Estrelas', 'Tarefas de hoje', 'Aguardando Aprovação', 'Tarefa Rápida'];
  const managePtStrings = ['Tarefas', 'Prêmios', 'Nova Tarefa', 'Novo Prêmio'];
  
  const indexMissing = indexPtStrings.filter(s => !index.includes(s));
  const manageMissing = managePtStrings.filter(s => !manage.includes(s));
  
  if (indexMissing.length > 0) return `Index missing: ${indexMissing.join(', ')}`;
  if (manageMissing.length > 0) return `Manage missing: ${manageMissing.join(', ')}`;
  
  return true;
});

// ============================================================
// 7. Galo Theme
// ============================================================
test('Theme: Galo colors used consistently', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!index.includes('ChildColors.galoBlack')) return 'No galoBlack in index';
  if (!index.includes('ChildColors.starGold')) return 'No starGold in index';
  if (!manage.includes('ChildColors.galoBlack')) return 'No galoBlack in manage';
  if (!manage.includes('ChildColors.starGold')) return 'No starGold in manage';
  if (!layout.includes('ChildColors.starGold')) return 'No starGold in layout';
  
  return true;
});

// ============================================================
// 8. Navigation
// ============================================================
test('Navigation: correct routing patterns', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!index.includes("router.push('/(parent)/manage')")) return 'No navigation to manage';
  if (!manage.includes("router.push('/(parent)/tasks/")) return 'No navigation to task details';
  if (!manage.includes("router.push('/(parent)/rewards/")) return 'No navigation to reward details';
  
  return true;
});

// ============================================================
// 9. Components Integration
// ============================================================
test('Components: required components imported', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!index.includes('ApprovalCard')) return 'No ApprovalCard in index';
  if (!manage.includes('TaskCard')) return 'No TaskCard in manage';
  if (!manage.includes('RewardCard')) return 'No RewardCard in manage';
  
  return true;
});

// ============================================================
// 10. Animations
// ============================================================
test('Animations: simple animations present', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!index.includes('FadeInUp')) return 'No FadeInUp in index';
  if (!manage.includes('FadeInUp')) return 'No FadeInUp in manage';
  if (!index.includes('react-native-reanimated')) return 'No reanimated in index';
  if (!manage.includes('react-native-reanimated')) return 'No reanimated in manage';
  
  return true;
});

// ============================================================
// 11. No Championship Features
// ============================================================
test('Simplified: no championship features in parent', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  const championshipFeatures = ['championship', 'match', 'closeDay', 'DayClosureModal'];
  const found = championshipFeatures.filter(feat => index.includes(feat));
  
  if (found.length > 0) return `Championship features found: ${found.join(', ')}`;
  return true;
});

// ============================================================
// 12. Empty States
// ============================================================
test('States: proper empty states', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!index.includes('Nenhuma tarefa criada')) return 'No empty tasks message in index';
  if (!manage.includes('Nenhuma tarefa ativa')) return 'No empty tasks message in manage';
  if (!manage.includes('Nenhum prêmio ativo')) return 'No empty rewards message in manage';
  
  return true;
});

// ============================================================
// 13. Bundle Compilation
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
// RESULTS
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('  STAR ROUTINE — SIMPLIFIED PARENT UI TEST SUITE');
console.log('='.repeat(60) + '\n');

results.forEach(r => console.log(r));

console.log('\n' + '-'.repeat(60));
console.log(`  TOTAL: ${passed + failed} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log('-'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);