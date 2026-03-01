#!/usr/bin/env node
/**
 * scripts/import-tasks-admin.mjs
 * Deletes all existing tasks and imports Vitor's routine.
 * Requires: serviceAccount.json at repo root (gitignored)
 * Run: node scripts/import-tasks-admin.mjs
 */

import http from 'http';

// ── Config ────────────────────────────────────────────────────────────────────

const FAMILY_ID = 'EXmCPl8hrnOYDzrPewHoXlGa5762'; // kept for reference, API ignores it
const API_BASE = 'http://127.0.0.1:3200/api';

// ── REST API helpers ──────────────────────────────────────────────────────────

function apiRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 3200,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve(d ? JSON.parse(d) : {}); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Tasks to import ───────────────────────────────────────────────────────────
// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

const TASKS = [
  // ── WEEKDAYS COMMON (Mon–Fri) ─────────────────────────────────────────────
  {
    name: 'Hora do almoço',
    description: '',
    icon: '🍽️',
    starValue: 1,
    category: 'meals',
    startTime: '13:00', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Assistir TV',
    description: 'Parar sem o pai pedir',
    icon: '📺',
    starValue: 1,
    category: 'rest',
    startTime: '13:20', endTime: '14:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Sem o pai pedir',
    icon: '🦷',
    starValue: 1,
    category: 'hygiene',
    startTime: '13:20', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Fazer a lição',
    description: 'Fazer dever e estudar',
    icon: '📚',
    starValue: 1,
    category: 'study',
    startTime: '14:30', endTime: '15:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Assistir TV',
    description: '',
    icon: '📺',
    starValue: 1,
    category: 'rest',
    startTime: '16:30', endTime: '17:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Futsal do vitão',
    description: '',
    icon: '⚽',
    starValue: 1,
    category: 'exercise',
    startTime: '18:40', endTime: '19:40',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Hora do banho',
    description: 'Tomar banho sozinho e trocar de roupa',
    icon: '🚿',
    starValue: 1,
    category: 'hygiene',
    startTime: '19:00', endTime: '19:15',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Fazer uma leitura',
    description: 'No fim de semana é duas estrelas',
    icon: '📖',
    starValue: 1,
    category: 'study',
    startTime: '19:30', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Hora do jantar',
    description: 'Jantar sozinho e comer tudo',
    icon: '🍽️',
    starValue: 1,
    category: 'meals',
    startTime: '20:00', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },

  // ── DAY-SPECIFIC CLASSES (15:40–16:40) ────────────────────────────────────
  {
    name: 'Aula de inglês',
    description: 'Fazer direitinho',
    icon: '🇺🇸',
    starValue: 1,
    category: 'extracurricular',
    startTime: '15:40', endTime: '16:40',
    recurrence: { type: 'specific_days', days: [1,3] }, // Mon, Wed
    isActive: true,
  },
  {
    name: 'Aula de programação',
    description: 'Fazer direitinho',
    icon: '💻',
    starValue: 1,
    category: 'extracurricular',
    startTime: '15:40', endTime: '16:40',
    recurrence: { type: 'specific_days', days: [2] }, // Tue
    isActive: true,
  },
  {
    name: 'Aula de piano',
    description: 'Fazer direitinho',
    icon: '🎹',
    starValue: 1,
    category: 'extracurricular',
    startTime: '15:40', endTime: '16:40',
    recurrence: { type: 'specific_days', days: [4] }, // Thu
    isActive: true,
  },

  // ── WEEKEND (Sat & Sun = [0,6]) ───────────────────────────────────────────
  {
    name: 'Tomar café da manhã',
    description: '',
    icon: '☕',
    starValue: 1,
    category: 'meals',
    startTime: '08:00', endTime: '09:00',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Escovar dentes, limpar olhos e pentear cabelo',
    icon: '🪥',
    starValue: 1,
    category: 'hygiene',
    startTime: '09:00', endTime: '09:45',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Tomar café da manhã',
    description: 'Café sem os pais pedirem, colocar prato e copo na pia',
    icon: '☕',
    starValue: 1,
    category: 'meals',
    startTime: '09:20', endTime: '09:45',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Andar com o cachorro',
    description: '',
    icon: '🐕',
    starValue: 2,
    category: 'exercise',
    startTime: '10:00', endTime: '10:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora de brincar',
    description: 'Brincar com os colegas da rua',
    icon: '🏃',
    starValue: 4,
    category: 'rest',
    startTime: '10:00', endTime: '18:00',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do almoço',
    description: '',
    icon: '🍽️',
    starValue: 1,
    category: 'meals',
    startTime: '12:30', endTime: '13:35',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Sem o pai pedir',
    icon: '🦷',
    starValue: 1,
    category: 'hygiene',
    startTime: '13:20', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do banho',
    description: 'Tomar banho sozinho e trocar de roupa',
    icon: '🚿',
    starValue: 1,
    category: 'hygiene',
    startTime: '19:00', endTime: '19:15',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Fazer uma leitura',
    description: 'No fim de semana é duas estrelas',
    icon: '📖',
    starValue: 2,
    category: 'study',
    startTime: '19:30', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do jantar',
    description: 'Jantar sozinho e comer tudo',
    icon: '🍽️',
    starValue: 1,
    category: 'meals',
    startTime: '20:00', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Delete existing tasks
  console.log('📋 Fetching existing tasks...');
  const existing = await apiRequest('/tasks', 'GET');
  console.log(`   Found ${existing.length} existing tasks`);

  if (existing.length > 0) {
    console.log('🗑️  Deleting existing tasks...');
    await Promise.all(existing.map((t) => apiRequest(`/tasks/${t.id}`, 'DELETE')));
    console.log(`   ✅ Deleted ${existing.length} tasks`);
  }

  // 2. Import new tasks
  console.log(`\n📥 Importing ${TASKS.length} tasks...`);
  await Promise.all(TASKS.map((task) => apiRequest('/tasks', 'POST', { ...task, description: task.description || '' })));

  console.log(`✅ Done! Imported ${TASKS.length} tasks via REST API`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
