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
    return `${parentErrors.length} errors:\n${parentErrors.slice(0, 3).join('\n')}`;
  }
  return true;
});

// ============================================================
// 2. File size requirements
// ============================================================
test('Size: parent index.tsx under 300 lines', () => {
  const code = readFile('app/(parent)/index.tsx');
  const lines = code.split('\n').length;
  if (lines >= 300) return `${lines} lines (must be < 300)`;
  return true;
});

test('Size: parent manage.tsx under 300 lines', () => {
  const code = readFile('app/(parent)/manage.tsx');
  const lines = code.split('\n').length;
  if (lines >= 300) return `${lines} lines (must be < 300)`;
  return true;
});

// ============================================================
// 3. Layout Structure (2-tab)
// ============================================================
test('Layout: 2-tab Tabs structure', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!layout.includes('<Tabs')) return 'No Tabs component';
  if (!layout.includes('name="index"')) return 'No index tab';
  if (!layout.includes('name="manage"')) return 'No manage tab';
  if (!layout.includes('title: \'Hoje\'')) return 'No Hoje title';
  if (!layout.includes('title: \'Gerenciar\'')) return 'No Gerenciar title';
  
  return true;
});

test('Layout: icons for both tabs', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!layout.includes('clipboard-list')) return 'No clipboard icon for Hoje';
  if (!layout.includes('cog')) return 'No cog icon for Gerenciar';
  
  return true;
});

test('Layout: hidden routes for deep linking', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!layout.includes('href: null')) return 'No hidden routes';
  if (!layout.includes('name="tasks"')) return 'No hidden tasks route';
  if (!layout.includes('name="rewards"')) return 'No hidden rewards route';
  
  return true;
});

test('Layout: child mode switch button', () => {
  const layout = readFile('app/(parent)/_layout.tsx');
  
  if (!layout.includes('switchToChild')) return 'No switchToChild function';
  if (!layout.includes('account-child')) return 'No child icon';
  if (!layout.includes('headerRight')) return 'No header right component';
  
  return true;
});

// ============================================================
// 4. Hoje Tab (index.tsx) - Simplified Dashboard
// ============================================================
test('Hoje: star balance and tasks stats', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('starBalance')) return 'No star balance display';
  if (!index.includes('completedCount')) return 'No completed count';
  if (!index.includes('totalTasks')) return 'No total tasks';
  if (!index.includes('statsContainer')) return 'No stats container';
  
  return true;
});

test('Hoje: pending approvals inline', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Aguardando Aprovação')) return 'No approvals section';
  if (!index.includes('pendingCompletions')) return 'No pending completions';
  if (!index.includes('handleApprove')) return 'No approve handler';
  if (!index.includes('handleReject')) return 'No reject handler';
  if (!index.includes('approvalCard')) return 'No approval card styling';
  
  return true;
});

test('Hoje: approve/reject buttons', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('✅')) return 'No approve button emoji';
  if (!index.includes('❌')) return 'No reject button emoji';
  if (!index.includes('approveButton')) return 'No approve button styling';
  if (!index.includes('rejectButton')) return 'No reject button styling';
  
  return true;
});

test('Hoje: quick actions', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Ações Rápidas')) return 'No quick actions section';
  if (!index.includes('Nova Tarefa')) return 'No new task action';
  if (!index.includes('Novo Prêmio')) return 'No new reward action';
  if (!index.includes('tasks/new')) return 'No task creation route';
  if (!index.includes('rewards/new')) return 'No reward creation route';
  
  return true;
});

test('Hoje: today tasks overview', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Tarefas de Hoje')) return 'No tasks overview section';
  if (!index.includes('taskCard')) return 'No task card styling';
  if (!index.includes('taskCardCompleted')) return 'No completed task styling';
  if (!index.includes('taskCardPending')) return 'No pending task styling';
  
  return true;
});

test('Hoje: empty state for no tasks', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Nenhuma tarefa para hoje')) return 'No empty tasks message';
  if (!index.includes('emptyCard')) return 'No empty card styling';
  if (!index.includes('Gerenciar Tarefas')) return 'No manage tasks button in empty state';
  
  return true;
});

// ============================================================
// 5. Gerenciar Tab (manage.tsx) - Already exists, test structure
// ============================================================
test('Gerenciar: exists and has correct structure', () => {
  const managePath = path.join(ROOT, 'app/(parent)/manage.tsx');
  if (!fs.existsSync(managePath)) return 'manage.tsx does not exist';
  
  const manage = readFile('app/(parent)/manage.tsx');
  if (!manage.includes('export default function ManageScreen')) return 'No ManageScreen export';
  
  return true;
});

test('Gerenciar: tasks and rewards sections', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('Tarefas')) return 'No tasks section title';
  if (!manage.includes('Prêmios')) return 'No rewards section title';
  if (!manage.includes('sectionHeader')) return 'No collapsible headers';
  
  return true;
});

test('Gerenciar: uses TaskCard and RewardCard components', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('TaskCard')) return 'No TaskCard import/usage';
  if (!manage.includes('RewardCard')) return 'No RewardCard import/usage';
  
  return true;
});

test('Gerenciar: links to CRUD routes', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('tasks/new')) return 'No new task route';
  if (!manage.includes('rewards/new')) return 'No new reward route';
  if (!manage.includes('tasks/${taskId}')) return 'No task edit route';
  if (!manage.includes('rewards/${rewardId}')) return 'No reward edit route';
  
  return true;
});

// ============================================================
// 6. Hooks and Stores Usage
// ============================================================
test('Hooks: correct hooks used in index', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('useAuthStore')) return 'No useAuthStore';
  if (!index.includes('useCompletionStore')) return 'No useCompletionStore';
  if (!index.includes('useTodayTasks')) return 'No useTodayTasks';
  if (!index.includes('useCurrentPeriod')) return 'No useCurrentPeriod';
  
  return true;
});

test('Hooks: correct hooks used in manage', () => {
  const manage = readFile('app/(parent)/manage.tsx');
  
  if (!manage.includes('useTaskStore')) return 'No useTaskStore';
  if (!manage.includes('useRewardStore')) return 'No useRewardStore';
  if (!manage.includes('useAuthStore')) return 'No useAuthStore';
  
  return true;
});

// ============================================================
// 7. Portuguese Language
// ============================================================
test('Language: Portuguese in index.tsx', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  const ptStrings = [
    'Estrelas de', 'Tarefas de hoje', 'Aguardando Aprovação',
    'Ações Rápidas', 'Nova Tarefa', 'Novo Prêmio',
    'Tarefas de Hoje', 'Nenhuma tarefa para hoje'
  ];
  const missing = ptStrings.filter(s => !index.includes(s));
  
  if (missing.length > 0) return `Missing PT strings: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 8. Galo Theme
// ============================================================
test('Theme: ChildColors used throughout', () => {
  const index = readFile('app/(parent)/index.tsx');
  const manage = readFile('app/(parent)/manage.tsx');
  const layout = readFile('app/(parent)/_layout.tsx');
  
  const files = { index, manage, layout };
  const missing = [];
  
  for (const [name, content] of Object.entries(files)) {
    if (!content.includes('ChildColors.galoBlack')) missing.push(`${name}: galoBlack`);
    if (!content.includes('ChildColors.starGold')) missing.push(`${name}: starGold`);
  }
  
  if (missing.length > 0) return `Missing colors: ${missing.join(', ')}`;
  return true;
});

// ============================================================
// 9. Animations
// ============================================================
test('Animations: simple FadeIn animations', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('react-native-reanimated')) return 'No reanimated import';
  if (!index.includes('FadeIn')) return 'No FadeIn animation';
  if (!index.includes('FadeInDown')) return 'No FadeInDown animation';
  
  return true;
});

// ============================================================
// 10. Haptic Feedback
// ============================================================
test('Haptics: feedback on actions', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  if (!index.includes('Haptics')) return 'No haptics import';
  if (!index.includes('notificationAsync')) return 'No haptic notifications';
  if (!index.includes('NotificationFeedbackType.Success')) return 'No success haptic';
  if (!index.includes('NotificationFeedbackType.Warning')) return 'No warning haptic';
  
  return true;
});

// ============================================================
// 11. No Championship Features (Clean Removal)
// ============================================================
test('Simplified: no championship features', () => {
  const index = readFile('app/(parent)/index.tsx');
  
  const championshipFeatures = [
    'championship', 'match', 'closeDay', 'DayClosureModal',
    'rival', 'opponent', 'standings', 'league'
  ];
  const found = championshipFeatures.filter(feat => index.includes(feat));
  
  if (found.length > 0) return `Championship features found: ${found.join(', ')}`;
  return true;
});

// ============================================================
// 12. Required Components Available
// ============================================================
test('Components: required components exist', () => {
  const missing = [];
  
  const requiredComponents = [
    'components/ui/LoadingScreen.tsx',
    'components/tasks/TaskCard.tsx', 
    'components/rewards/RewardCard.tsx',
  ];
  
  for (const comp of requiredComponents) {
    if (!fs.existsSync(path.join(ROOT, comp))) {
      missing.push(comp);
    }
  }
  
  if (missing.length > 0) return `Missing components: ${missing.join(', ')}`;
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