#!/usr/bin/env node
/**
 * migrate-from-firebase.mjs
 * Exports all Firestore data to SQLite via the local REST API.
 * Run once: node scripts/migrate-from-firebase.mjs
 */

import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || join(__dirname, '..', 'serviceAccount.json');
const FAMILY_ID = process.env.FAMILY_ID;
const DB_PATH = join(__dirname, '..', 'galo-routine.db');

// ── Firebase init ─────────────────────────────────────────────────
const admin = require('firebase-admin');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const firestore = admin.firestore();

// ── SQLite init ───────────────────────────────────────────────────
const db = new Database(DB_PATH);

// ── Helpers ───────────────────────────────────────────────────────
function toIso(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    if (val._seconds !== undefined) return new Date(val._seconds * 1000).toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (val.seconds !== undefined) return new Date(val.seconds * 1000).toISOString();
  }
  return String(val);
}

function toBool(val, defaultVal = false) {
  if (val === undefined || val === null) return defaultVal ? 1 : 0;
  return val ? 1 : 0;
}

// ── Migration functions ───────────────────────────────────────────

async function migrateFamily() {
  console.log('[Family] Fetching...');
  const snap = await firestore.doc(`families/${FAMILY_ID}`).get();
  if (!snap.exists) {
    console.log('[Family] Not found in Firestore, skipping');
    return;
  }
  const d = snap.data();
  
  // Ensure the row exists (may have been bootstrapped by the server)
  db.prepare(`
    INSERT OR REPLACE INTO families
      (id, parent_name, child_name, child_pin, star_balance, lifetime_stars_earned,
       current_streak, best_streak, last_streak_date, settings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    FAMILY_ID,
    d.parentName || '',
    d.childName || '',
    d.childPin || '',
    d.starBalance ?? 0,
    d.lifetimeStarsEarned ?? 0,
    d.currentStreak ?? 0,
    d.bestStreak ?? 0,
    d.lastStreakDate ?? null,
    JSON.stringify(d.settings || {}),
  );
  console.log(`[Family] Migrated (starBalance=${d.starBalance}, childName=${d.childName})`);
}

async function migrateTasks() {
  console.log('[Tasks] Fetching...');
  const snap = await firestore.collection(`families/${FAMILY_ID}/tasks`).get();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks
      (id, family_id, name, description, star_value, icon, is_active, recurrence, start_time, end_time, category, requires_proof)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const doc of snap.docs) {
    const t = doc.data();
    stmt.run(
      doc.id, FAMILY_ID,
      t.name || '',
      t.description || '',
      t.starValue ?? 1,
      t.icon ?? null,
      toBool(t.isActive, true),
      JSON.stringify(t.recurrence || {}),
      t.startTime ?? null,
      t.endTime ?? null,
      t.category ?? null,
      toBool(t.requiresProof, false),
    );
    count++;
  }
  console.log(`[Tasks] Migrated ${count} tasks`);
}

async function migratePeriods() {
  console.log('[Periods] Fetching...');
  const snap = await firestore.collection(`families/${FAMILY_ID}/periods`).orderBy('startDate', 'desc').get();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO periods
      (id, family_id, start_date, end_date, status, star_budget, stars_earned, stars_pending, thresholds, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const doc of snap.docs) {
    const p = doc.data();
    stmt.run(
      doc.id, FAMILY_ID,
      toIso(p.startDate),
      toIso(p.endDate),
      p.status || 'active',
      p.starBudget ?? 0,
      p.starsEarned ?? 0,
      p.starsPending ?? 0,
      JSON.stringify(p.thresholds || {}),
      p.outcome ?? null,
    );
    count++;
  }
  console.log(`[Periods] Migrated ${count} periods`);
  return snap.docs.map(d => d.id);
}

async function migrateCompletions(periodIds) {
  console.log(`[Completions] Fetching for ${periodIds.length} periods...`);
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO completions
      (id, family_id, period_id, task_id, task_name, task_star_value, date, status, completed_at, reviewed_at, rejection_reason, on_time_bonus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let total = 0;
  for (const periodId of periodIds) {
    const snap = await firestore
      .collection(`families/${FAMILY_ID}/periods/${periodId}/completions`)
      .get();
    
    for (const doc of snap.docs) {
      const c = doc.data();
      stmt.run(
        doc.id, FAMILY_ID, periodId,
        c.taskId || '',
        c.taskName || '',
        c.taskStarValue ?? 1,
        toIso(c.date) ?? new Date().toISOString(),
        c.status || 'pending',
        toIso(c.completedAt) ?? new Date().toISOString(),
        toIso(c.reviewedAt) ?? null,
        c.rejectionReason ?? null,
        toBool(c.onTimeBonus, false),
      );
      total++;
    }
  }
  console.log(`[Completions] Migrated ${total} completions`);
}

async function migrateRewards() {
  console.log('[Rewards] Fetching...');
  const snap = await firestore.collection(`families/${FAMILY_ID}/rewards`).get();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO rewards
      (id, family_id, name, description, star_cost, icon, is_active, availability, quantity, requires_approval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const doc of snap.docs) {
    const r = doc.data();
    stmt.run(
      doc.id, FAMILY_ID,
      r.name || '',
      r.description || '',
      r.starCost ?? 1,
      r.icon || '',
      toBool(r.isActive, true),
      r.availability || 'unlimited',
      r.quantity ?? null,
      toBool(r.requiresApproval, true),
    );
    count++;
  }
  console.log(`[Rewards] Migrated ${count} rewards`);
}

async function migrateRedemptions() {
  console.log('[Redemptions] Fetching...');
  const snap = await firestore.collection(`families/${FAMILY_ID}/redemptions`).get();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO redemptions
      (id, family_id, reward_id, reward_name, star_cost, redeemed_at, status, fulfilled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const doc of snap.docs) {
    const r = doc.data();
    stmt.run(
      doc.id, FAMILY_ID,
      r.rewardId || '',
      r.rewardName || '',
      r.starCost ?? 0,
      toIso(r.redeemedAt) ?? new Date().toISOString(),
      r.status || 'pending',
      toIso(r.fulfilledAt) ?? null,
    );
    count++;
  }
  console.log(`[Redemptions] Migrated ${count} redemptions`);
}

async function migrateGaloSchedule() {
  console.log('[GaloSchedule] Fetching...');
  try {
    const snap = await firestore.doc(`families/${FAMILY_ID}/galoSchedule/current`).get();
    if (!snap.exists) {
      console.log('[GaloSchedule] No current doc found, skipping');
      return;
    }
    const data = snap.data();
    db.prepare(`
      INSERT OR REPLACE INTO galo_schedule (family_id, data) VALUES (?, ?)
    `).run(FAMILY_ID, JSON.stringify(data));
    console.log('[GaloSchedule] Migrated (matches:', data.matches?.length ?? 0, ')');
  } catch (err) {
    console.log('[GaloSchedule] Error:', err.message);
  }
}

async function migrateGaloNewsState() {
  console.log('[GaloNewsState] Fetching...');
  try {
    const snap = await firestore.doc(`families/${FAMILY_ID}/galoSchedule/newsState`).get();
    if (!snap.exists) {
      console.log('[GaloNewsState] No doc found, skipping');
      return;
    }
    const data = snap.data();
    const shownIds = data.shownIds || [];
    db.prepare(`
      INSERT OR REPLACE INTO galo_news_state (family_id, shown_ids) VALUES (?, ?)
    `).run(FAMILY_ID, JSON.stringify(shownIds));
    console.log(`[GaloNewsState] Migrated (${shownIds.length} shown IDs)`);
  } catch (err) {
    console.log('[GaloNewsState] Error:', err.message);
  }
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Starting Firebase → SQLite migration`);
  console.log(`   Family: ${FAMILY_ID}`);
  console.log(`   DB: ${DB_PATH}\n`);

  await migrateFamily();
  await migrateTasks();
  const periodIds = await migratePeriods();
  await migrateCompletions(periodIds);
  await migrateRewards();
  await migrateRedemptions();
  await migrateGaloSchedule();
  await migrateGaloNewsState();

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
