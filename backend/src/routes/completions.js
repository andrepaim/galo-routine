'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { broadcast } = require('../sse');

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

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
  ).all(req.user.familyId, req.params.periodId);
  res.json(rows.map(rowToCompletion));
});

// POST /api/completions/:periodId
router.post('/', (req, res) => {
  const c = req.body;
  const id = c.id || `${c.taskId ?? c.task_id}_${(c.date || new Date().toISOString()).slice(0, 10)}`;

  // Bug 5: Validate star value against actual task definition
  const taskId = c.taskId ?? c.task_id;
  const task = db.prepare(
    'SELECT star_value FROM tasks WHERE id = ? AND family_id = ?'
  ).get(taskId, req.user.familyId);
  if (!task) return res.status(400).json({ error: 'Task not found' });
  const validStarValue = task.star_value;

  // Bug 10: Always start as pending — only parent can approve via PUT
  db.prepare(`
    INSERT OR REPLACE INTO completions
      (id, family_id, period_id, task_id, task_name, task_star_value, date, status, completed_at, reviewed_at, rejection_reason, on_time_bonus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.familyId, req.params.periodId,
    taskId,
    c.taskName ?? c.task_name ?? '',
    validStarValue,
    toIso(c.date) ?? new Date().toISOString(),
    'pending',
    toIso(c.completedAt ?? c.completed_at) ?? new Date().toISOString(),
    null,
    null,
    (c.onTimeBonus ?? c.on_time_bonus ?? false) ? 1 : 0,
  );
  broadcast('completions', req.user.familyId);
  const row = db.prepare('SELECT * FROM completions WHERE id = ?').get(id);
  res.status(201).json(rowToCompletion(row));
});

// PUT /api/completions/:periodId/:completionId
router.put('/:completionId', (req, res) => {
  const c = req.body;
  const familyId = req.user.familyId;

  // Bug 4: Atomic approval — credit stars in a single transaction
  if (c.status === 'approved') {
    const completion = db.prepare(
      'SELECT * FROM completions WHERE id = ? AND family_id = ?'
    ).get(req.params.completionId, familyId);
    if (!completion) return res.status(404).json({ error: 'Not found' });

    // Idempotent: already approved
    if (completion.status === 'approved') {
      return res.json(rowToCompletion(completion));
    }

    const txn = db.transaction(() => {
      db.prepare(
        'UPDATE completions SET status = ?, reviewed_at = ? WHERE id = ? AND family_id = ?'
      ).run('approved', new Date().toISOString(), req.params.completionId, familyId);

      const stars = completion.task_star_value || 0;
      if (stars > 0) {
        db.prepare(
          'UPDATE families SET star_balance = star_balance + ?, lifetime_stars_earned = lifetime_stars_earned + ? WHERE id = ?'
        ).run(stars, stars, familyId);
      }
    });
    txn();

    broadcast('completions', familyId);
    broadcast('family', familyId);
    const row = db.prepare('SELECT * FROM completions WHERE id = ?').get(req.params.completionId);
    return res.json(rowToCompletion(row));
  }

  // Generic update for rejection / other fields
  const updates = [];
  const params = [];

  // Bug 10: Validate status values
  if (c.status !== undefined) {
    if (!VALID_STATUSES.includes(c.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    updates.push('status = ?'); params.push(c.status);
  }
  if (c.reviewedAt !== undefined || c.reviewed_at !== undefined) {
    updates.push('reviewed_at = ?'); params.push(toIso(c.reviewedAt ?? c.reviewed_at));
  }
  if ('rejectionReason' in c || 'rejection_reason' in c) {
    updates.push('rejection_reason = ?'); params.push(c.rejectionReason ?? c.rejection_reason ?? null);
  }
  if (c.onTimeBonus !== undefined) { updates.push('on_time_bonus = ?'); params.push(c.onTimeBonus ? 1 : 0); }

  if (updates.length > 0) {
    // Bug 6: Include family_id in WHERE clause
    params.push(req.params.completionId, familyId);
    db.prepare(`UPDATE completions SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`).run(...params);
  }

  broadcast('completions', familyId);
  const row = db.prepare('SELECT * FROM completions WHERE id = ? AND family_id = ?').get(req.params.completionId, familyId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToCompletion(row));
});

module.exports = router;
