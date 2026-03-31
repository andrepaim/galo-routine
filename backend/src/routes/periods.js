'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { nanoid } = require('nanoid');



function rowToPeriod(row) {
  return {
    id: row.id,
    familyId: row.family_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    starBudget: row.star_budget,
    starsEarned: row.stars_earned,
    starsPending: row.stars_pending,
    thresholds: JSON.parse(row.thresholds || '{}'),
    outcome: row.outcome,
  };
}

// GET /api/periods/active  — must come before /:id
router.get('/active', (req, res) => {
  const row = db.prepare("SELECT * FROM periods WHERE family_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1").get(req.user.familyId);
  res.json(row ? rowToPeriod(row) : null);
});

// GET /api/periods
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM periods WHERE family_id = ? ORDER BY start_date DESC').all(req.user.familyId);
  res.json(rows.map(rowToPeriod));
});

// POST /api/periods
router.post('/', (req, res) => {
  const p = req.body;
  const id = p.id || nanoid();
  
  // Convert Timestamp objects to ISO strings if needed
  const toIso = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._seconds) return new Date(val._seconds * 1000).toISOString();
    if (val.toDate) return val.toDate().toISOString();
    return String(val);
  };

  db.prepare(`
    INSERT INTO periods (id, family_id, start_date, end_date, status, star_budget, stars_earned, stars_pending, thresholds, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.familyId,
    toIso(p.startDate ?? p.start_date),
    toIso(p.endDate ?? p.end_date),
    p.status || 'active',
    p.starBudget ?? p.star_budget ?? 0,
    p.starsEarned ?? p.stars_earned ?? 0,
    p.starsPending ?? p.stars_pending ?? 0,
    JSON.stringify(p.thresholds || {}),
    p.outcome ?? null,
  );
  broadcast('periods', req.user.familyId);
  const row = db.prepare('SELECT * FROM periods WHERE id = ?').get(id);
  res.status(201).json(rowToPeriod(row));
});

// PUT /api/periods/:id
router.put('/:id', (req, res) => {
  const p = req.body;
  const updates = [];
  const params = [];

  const toIso = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val._seconds) return new Date(val._seconds * 1000).toISOString();
    if (val.toDate) return val.toDate().toISOString();
    return String(val);
  };

  if (p.startDate !== undefined || p.start_date !== undefined) {
    updates.push('start_date = ?'); params.push(toIso(p.startDate ?? p.start_date));
  }
  if (p.endDate !== undefined || p.end_date !== undefined) {
    updates.push('end_date = ?'); params.push(toIso(p.endDate ?? p.end_date));
  }
  if (p.status !== undefined) { updates.push('status = ?'); params.push(p.status); }
  if (p.starBudget !== undefined) { updates.push('star_budget = ?'); params.push(p.starBudget); }
  if (p.starsEarned !== undefined) { updates.push('stars_earned = ?'); params.push(p.starsEarned); }
  if (p.starsPending !== undefined) { updates.push('stars_pending = ?'); params.push(p.starsPending); }
  if (p.thresholds !== undefined) { updates.push('thresholds = ?'); params.push(JSON.stringify(p.thresholds)); }
  if ('outcome' in p) { updates.push('outcome = ?'); params.push(p.outcome ?? null); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE periods SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  broadcast('periods', req.user.familyId);
  const row = db.prepare('SELECT * FROM periods WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToPeriod(row));
});

// POST /api/periods/:id/complete — atomically complete a period (Bug 9)
router.post('/:id/complete', (req, res) => {
  const period = db.prepare(
    'SELECT * FROM periods WHERE id = ? AND family_id = ?'
  ).get(req.params.id, req.user.familyId);
  if (!period) return res.status(404).json({ error: 'Not found' });
  if (period.status === 'completed') {
    return res.json(rowToPeriod(period)); // idempotent
  }

  const completions = db.prepare(
    "SELECT task_star_value FROM completions WHERE period_id = ? AND family_id = ? AND status = 'approved'"
  ).all(req.params.id, req.user.familyId);

  const starsEarned = completions.reduce((sum, c) => sum + c.task_star_value, 0);
  const thresholds = JSON.parse(period.thresholds || '{}');
  const budget = period.star_budget || 1;
  const pct = starsEarned / budget;

  let outcome = 'neutral';
  if (pct >= (thresholds.rewardPercent || 0.8)) outcome = 'reward';
  else if (pct < (thresholds.penaltyPercent || 0.3)) outcome = 'penalty';

  db.prepare(
    'UPDATE periods SET status = ?, outcome = ?, stars_earned = ?, stars_pending = 0 WHERE id = ? AND family_id = ?'
  ).run('completed', outcome, starsEarned, req.params.id, req.user.familyId);

  broadcast('periods', req.user.familyId);
  const row = db.prepare('SELECT * FROM periods WHERE id = ?').get(req.params.id);
  res.json(rowToPeriod(row));
});

module.exports = router;
