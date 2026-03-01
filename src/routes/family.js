'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');

const FAMILY_ID = process.env.FAMILY_ID;

function rowToFamily(row) {
  if (!row) return null;
  return {
    id: row.id,
    parentName: row.parent_name,
    childName: row.child_name,
    childPin: row.child_pin,
    starBalance: row.star_balance,
    lifetimeStarsEarned: row.lifetime_stars_earned,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    lastStreakDate: row.last_streak_date,
    settings: JSON.parse(row.settings || '{}'),
  };
}

// GET /api/family
router.get('/', (req, res) => {
  let row = db.prepare('SELECT * FROM families WHERE id = ?').get(FAMILY_ID);
  if (!row) {
    // Bootstrap empty family row
    db.prepare(`INSERT INTO families (id) VALUES (?)`).run(FAMILY_ID);
    row = db.prepare('SELECT * FROM families WHERE id = ?').get(FAMILY_ID);
  }
  res.json(rowToFamily(row));
});

// PUT /api/family
router.put('/', (req, res) => {
  const data = req.body;
  const updates = [];
  const params = [];

  if (data.parentName !== undefined) { updates.push('parent_name = ?'); params.push(data.parentName); }
  if (data.childName !== undefined) { updates.push('child_name = ?'); params.push(data.childName); }
  if (data.childPin !== undefined) { updates.push('child_pin = ?'); params.push(data.childPin); }
  if (data.starBalance !== undefined) { updates.push('star_balance = ?'); params.push(data.starBalance); }
  if (data.lifetimeStarsEarned !== undefined) { updates.push('lifetime_stars_earned = ?'); params.push(data.lifetimeStarsEarned); }
  if (data.currentStreak !== undefined) { updates.push('current_streak = ?'); params.push(data.currentStreak); }
  if (data.bestStreak !== undefined) { updates.push('best_streak = ?'); params.push(data.bestStreak); }
  if (data.lastStreakDate !== undefined) { updates.push('last_streak_date = ?'); params.push(data.lastStreakDate); }
  if (data.settings !== undefined) { updates.push('settings = ?'); params.push(JSON.stringify(data.settings)); }

  if (updates.length === 0) return res.json({ ok: true });

  params.push(FAMILY_ID);
  db.prepare(`UPDATE families SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  broadcast('family');
  const row = db.prepare('SELECT * FROM families WHERE id = ?').get(FAMILY_ID);
  res.json(rowToFamily(row));
});

// PUT /api/family/increment
router.put('/increment', (req, res) => {
  const { field, amount } = req.body;
  const ALLOWED = ['star_balance', 'starBalance', 'lifetime_stars_earned', 'lifetimeStarsEarned',
                   'current_streak', 'currentStreak', 'best_streak', 'bestStreak'];
  
  // Map camelCase to snake_case
  const fieldMap = {
    starBalance: 'star_balance',
    lifetimeStarsEarned: 'lifetime_stars_earned',
    currentStreak: 'current_streak',
    bestStreak: 'best_streak',
  };
  const col = fieldMap[field] || field;
  
  if (!ALLOWED.includes(field) && !Object.values(fieldMap).includes(col)) {
    return res.status(400).json({ error: 'Invalid field' });
  }
  const validCols = ['star_balance', 'lifetime_stars_earned', 'current_streak', 'best_streak'];
  if (!validCols.includes(col)) return res.status(400).json({ error: 'Invalid field' });

  db.prepare(`UPDATE families SET ${col} = ${col} + ? WHERE id = ?`).run(amount, FAMILY_ID);
  broadcast('family');
  const row = db.prepare('SELECT * FROM families WHERE id = ?').get(FAMILY_ID);
  res.json(rowToFamily(row));
});

module.exports = router;
