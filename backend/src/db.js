'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'galo-routine.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  parent_name TEXT NOT NULL DEFAULT '',
  child_name TEXT NOT NULL DEFAULT '',
  child_pin TEXT NOT NULL DEFAULT '',
  star_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_stars_earned INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_streak_date TEXT,
  settings TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  picture TEXT,
  created_at TEXT NOT NULL,
  family_id TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  star_value INTEGER NOT NULL DEFAULT 1,
  icon TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  recurrence TEXT NOT NULL DEFAULT '{}',
  start_time TEXT,
  end_time TEXT,
  category TEXT,
  requires_proof INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS periods (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  star_budget INTEGER NOT NULL DEFAULT 0,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  stars_pending INTEGER NOT NULL DEFAULT 0,
  thresholds TEXT NOT NULL DEFAULT '{}',
  outcome TEXT
);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_star_value INTEGER NOT NULL DEFAULT 1,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TEXT NOT NULL,
  reviewed_at TEXT,
  rejection_reason TEXT,
  on_time_bonus INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  star_cost INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  availability TEXT NOT NULL DEFAULT 'unlimited',
  quantity INTEGER,
  requires_approval INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  star_cost INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  fulfilled_at TEXT
);

CREATE TABLE IF NOT EXISTS galo_schedule (
  family_id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS galo_news_state (
  family_id TEXT PRIMARY KEY,
  shown_ids TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS canguru_sessions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mode TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  stars_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL
);
`);

module.exports = db;
