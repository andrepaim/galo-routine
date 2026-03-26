'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { createToken, COOKIE, MAX_AGE } = require('../middleware/auth');

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

function getFamilyId(req) {
  return req.user?.familyId;
}

// GET /api/family — returns family, or null if user has no family yet
router.get('/', (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.json(null);

  let row = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  if (!row) return res.json(null);
  res.json(rowToFamily(row));
});

// POST /api/family — create a new family for this user (onboarding)
router.post('/', (req, res) => {
  const { parentName, childName, childPin } = req.body;
  if (!parentName || !childName || !childPin) {
    return res.status(400).json({ error: 'parentName, childName, childPin required' });
  }

  const { nanoid } = require('nanoid');
  const familyId = nanoid();

  db.prepare(`INSERT INTO families (id, parent_name, child_name, child_pin) VALUES (?, ?, ?, ?)`)
    .run(familyId, parentName, childName, childPin);

  // Link family to user
  db.prepare('UPDATE users SET family_id = ? WHERE id = ?')
    .run(familyId, req.user.userId);

  // Re-issue JWT with familyId
  const newToken = createToken({
    userId: req.user.userId,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    familyId,
  });
  res.cookie(COOKIE, newToken, { maxAge: MAX_AGE * 1000, httpOnly: true, secure: true, sameSite: 'lax', path: '/' });

  const row = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  res.json(rowToFamily(row));
});

// PUT /api/family
router.put('/', (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(401).json({ error: 'No family' });

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

  params.push(familyId);
  db.prepare(`UPDATE families SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  broadcast('family');
  const row = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  res.json(rowToFamily(row));
});

// PUT /api/family/increment
router.put('/increment', (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(401).json({ error: 'No family' });

  const { field, amount } = req.body;
  const fieldMap = {
    starBalance: 'star_balance',
    lifetimeStarsEarned: 'lifetime_stars_earned',
    currentStreak: 'current_streak',
    bestStreak: 'best_streak',
  };
  const col = fieldMap[field] || field;
  const validCols = ['star_balance', 'lifetime_stars_earned', 'current_streak', 'best_streak'];
  if (!validCols.includes(col)) return res.status(400).json({ error: 'Invalid field' });

  db.prepare(`UPDATE families SET ${col} = ${col} + ? WHERE id = ?`).run(amount, familyId);
  broadcast('family');
  const row = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  res.json(rowToFamily(row));
});

module.exports = router;
