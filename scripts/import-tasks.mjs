#!/usr/bin/env node
/**
 * scripts/import-tasks.mjs
 * Deletes all existing tasks and imports Vitor's routine from Fun Routine app.
 */

import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

function readEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    return Object.fromEntries(
      readFileSync(envPath, 'utf8').split('\n')
        .filter(l => l.includes('='))
        .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
    );
  } catch { return {}; }
}
const env = readEnv();
const FIREBASE_API_KEY  = env.VITE_FIREBASE_API_KEY;
const FIREBASE_PROJECT  = env.VITE_FIREBASE_PROJECT_ID || 'star-routine';
const FIREBASE_EMAIL    = 'andrepaim@gmail.com';
const FIREBASE_PASSWORD = 'vitimdograu';
const FAMILY_ID         = 'EXmCPl8hrnOYDzrPewHoXlGa5762';

const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

// ── Tasks to import ───────────────────────────────────────────────────────────
// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

const TASKS = [
  // ── WEEKDAYS COMMON (Mon–Fri = [1,2,3,4,5]) ──────────────────────────────
  {
    name: 'Hora do almoço',
    description: '',
    starValue: 1,
    category: 'meals',
    startTime: '13:00', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Assistir TV',
    description: 'Parar sem o pai pedir',
    starValue: 1,
    category: 'rest',
    startTime: '13:20', endTime: '14:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Sem o pai pedir',
    starValue: 1,
    category: 'hygiene',
    startTime: '13:20', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Fazer a lição',
    description: 'Fazer dever e estudar',
    starValue: 1,
    category: 'study',
    startTime: '14:30', endTime: '15:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Assistir TV',
    description: '',
    starValue: 1,
    category: 'rest',
    startTime: '16:30', endTime: '17:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Futsal do vitão',
    description: '',
    starValue: 1,
    category: 'exercise',
    startTime: '18:40', endTime: '19:40',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Hora do banho',
    description: 'Tomar banho sozinho e trocar de roupa',
    starValue: 1,
    category: 'hygiene',
    startTime: '19:00', endTime: '19:15',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Fazer uma leitura',
    description: 'No fim de semana é duas estrelas',
    starValue: 1,
    category: 'study',
    startTime: '19:30', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [1,2,3,4,5] },
    isActive: true,
  },
  {
    name: 'Hora do jantar',
    description: 'Jantar sozinho e comer tudo',
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
    starValue: 1,
    category: 'extracurricular',
    startTime: '15:40', endTime: '16:40',
    recurrence: { type: 'specific_days', days: [1,3] }, // Mon, Wed
    isActive: true,
  },
  {
    name: 'Aula de programação',
    description: 'Fazer direitinho',
    starValue: 1,
    category: 'extracurricular',
    startTime: '15:40', endTime: '16:40',
    recurrence: { type: 'specific_days', days: [2] }, // Tue
    isActive: true,
  },
  {
    name: 'Aula de piano',
    description: 'Fazer direitinho',
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
    starValue: 1,
    category: 'meals',
    startTime: '08:00', endTime: '09:00',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Escovar dentes, limpar olhos e pentear cabelo',
    starValue: 1,
    category: 'hygiene',
    startTime: '09:00', endTime: '09:45',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Tomar café da manhã',
    description: 'Café sem os pais pedirem, colocar prato e copo na pia',
    starValue: 1,
    category: 'meals',
    startTime: '09:20', endTime: '09:45',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Andar com o cachorro',
    description: '',
    starValue: 2,
    category: 'exercise',
    startTime: '10:00', endTime: '10:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora de brincar',
    description: 'Brincar com os colegas da rua',
    starValue: 4,
    category: 'rest',
    startTime: '10:00', endTime: '18:00',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do almoço',
    description: '',
    starValue: 1,
    category: 'meals',
    startTime: '12:30', endTime: '13:35',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Escovar os dentes',
    description: 'Sem o pai pedir',
    starValue: 1,
    category: 'hygiene',
    startTime: '13:20', endTime: '13:20',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do banho',
    description: 'Tomar banho sozinho e trocar de roupa',
    starValue: 1,
    category: 'hygiene',
    startTime: '19:00', endTime: '19:15',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Fazer uma leitura',
    description: 'No fim de semana é duas estrelas',
    starValue: 2,
    category: 'study',
    startTime: '19:30', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
  {
    name: 'Hora do jantar',
    description: 'Jantar sozinho e comer tudo',
    starValue: 1,
    category: 'meals',
    startTime: '20:00', endTime: '20:30',
    recurrence: { type: 'specific_days', days: [0,6] },
    isActive: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getIdToken() {
  const res = await httpsRequest(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: FIREBASE_EMAIL, password: FIREBASE_PASSWORD, returnSecureToken: true }
  );
  if (!res.body.idToken) throw new Error(`Auth failed: ${JSON.stringify(res.body)}`);
  return res.body.idToken;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number' && Number.isInteger(val)) return { integerValue: String(val) };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, toFirestoreValue(v)])
        )
      }
    };
  }
  return { stringValue: String(val) };
}

function taskToFirestore(task) {
  return {
    fields: Object.fromEntries(
      Object.entries(task)
        .filter(([k]) => k !== 'id')
        .map(([k, v]) => [k, toFirestoreValue(v)])
    )
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔑 Authenticating...');
  const token = await getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const collectionPath = `${FIRESTORE}/families/${FAMILY_ID}/tasks`;

  // 1. List existing tasks
  console.log('📋 Fetching existing tasks...');
  const listRes = await httpsRequest(collectionPath, { method: 'GET', headers });
  const existing = listRes.body.documents || [];
  console.log(`   Found ${existing.length} existing tasks`);

  // 2. Delete each existing task
  if (existing.length > 0) {
    console.log('🗑️  Deleting existing tasks...');
    for (const doc of existing) {
      const docUrl = `https://firestore.googleapis.com/v1/${doc.name}`;
      await httpsRequest(docUrl, { method: 'DELETE', headers });
      process.stdout.write('.');
    }
    console.log(`\n   Deleted ${existing.length} tasks`);
  }

  // 3. Import new tasks
  console.log(`\n📥 Importing ${TASKS.length} tasks...`);
  let imported = 0;
  for (const task of TASKS) {
    const res = await httpsRequest(
      collectionPath,
      { method: 'POST', headers },
      taskToFirestore(task)
    );
    if (res.status === 200) {
      process.stdout.write('✓');
      imported++;
    } else {
      process.stdout.write('✗');
      console.error(`\nFailed: ${JSON.stringify(res.body)}`);
    }
  }

  console.log(`\n\n✅ Done! Imported ${imported}/${TASKS.length} tasks`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
