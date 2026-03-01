'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { broadcast } = require('../sse');

const FAMILY_ID = process.env.FAMILY_ID;

function rowToCompletion(row) {
  return {
    id: row.id,
    familyId: row.family_id,
    periodId: row.period_id,
    taskId: row.task_id,
    taskName: row.task_name,
    taskStarValue: row.task_star_value,
    date: row.date,
    status: row.status,
    completedAt: row.completed_at,
    reviewedAt: row.reviewed_at,
    rejectionReason: row.rejection_reason,
    onTimeBonus: row.on_time_bonus === 1,
  };
}

function toIso(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (val.toDate) return val.toDate().toISOString();
  return String(val);
}

// GET /api/completions/:periodId
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM completions WHERE family_id = ? AND period_id = ? ORDER BY completed_at DESC'
  ).all(FAMILY_ID, req.params.periodId);
  res.json(rows.map(rowToCompletion));
});

// POST /api/completions/:periodId
router.post('/', (req, res) => {
  const c = req.body;
  const id = c.id || `${c.taskId}_${(c.date || new Date().toISOString()).slice(0, 10)}`;

  // Upsert: if same completion ID already exists, ignore (idempotent)
  db.prepare(`
    INSERT OR REPLACE INTO completions
      (id, family_id, period_id, task_id, task_name, task_star_value, date, status, completed_at, reviewed_at, rejection_reason, on_time_bonus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, FAMILY_ID, req.params.periodId,
    c.taskId ?? c.task_id,
    c.taskName ?? c.task_name ?? '',
    c.taskStarValue ?? c.task_star_value ?? 1,
    toIso(c.date) ?? new Date().toISOString(),
    c.status || 'pending',
    toIso(c.completedAt ?? c.completed_at) ?? new Date().toISOString(),
    toIso(c.reviewedAt ?? c.reviewed_at) ?? null,
    c.rejectionReason ?? c.rejection_reason ?? null,
    (c.onTimeBonus ?? c.on_time_bonus ?? false) ? 1 : 0,
  );
  broadcast('completions');
  const row = db.prepare('SELECT * FROM completions WHERE id = ?').get(id);
  res.status(201).json(rowToCompletion(row));
});

// PUT /api/completions/:periodId/:id
router.put('/:completionId', (req, res) => {
  const c = req.body;
  const updates = [];
  const params = [];

  if (c.status !== undefined) { updates.push('status = ?'); params.push(c.status); }
  if (c.reviewedAt !== undefined || c.reviewed_at !== undefined) {
    updates.push('reviewed_at = ?'); params.push(toIso(c.reviewedAt ?? c.reviewed_at));
  }
  if ('rejectionReason' in c || 'rejection_reason' in c) {
    updates.push('rejection_reason = ?'); params.push(c.rejectionReason ?? c.rejection_reason ?? null);
  }
  if (c.onTimeBonus !== undefined) { updates.push('on_time_bonus = ?'); params.push(c.onTimeBonus ? 1 : 0); }

  if (updates.length > 0) {
    params.push(req.params.completionId);
    db.prepare(`UPDATE completions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  broadcast('completions');
  const row = db.prepare('SELECT * FROM completions WHERE id = ?').get(req.params.completionId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToCompletion(row));
});

module.exports = router;
