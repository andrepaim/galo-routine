'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { nanoid } = require('nanoid');



function rowToTask(row) {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    description: row.description,
    starValue: row.star_value,
    icon: row.icon,
    isActive: row.is_active === 1,
    recurrence: JSON.parse(row.recurrence || '{}'),
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    requiresProof: row.requires_proof === 1,
  };
}

// GET /api/tasks
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks WHERE family_id = ?').all(req.user.familyId);
  res.json(rows.map(rowToTask));
});

// POST /api/tasks
router.post('/', (req, res) => {
  const t = req.body;
  const id = t.id || nanoid();
  db.prepare(`
    INSERT INTO tasks (id, family_id, name, description, star_value, icon, is_active, recurrence, start_time, end_time, category, requires_proof)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.familyId,
    t.name || '',
    t.description || '',
    t.starValue ?? t.star_value ?? 1,
    t.icon ?? null,
    (t.isActive ?? t.is_active ?? true) ? 1 : 0,
    JSON.stringify(t.recurrence || {}),
    t.startTime ?? t.start_time ?? null,
    t.endTime ?? t.end_time ?? null,
    t.category ?? null,
    (t.requiresProof ?? t.requires_proof ?? false) ? 1 : 0,
  );
  broadcast('tasks', req.user.familyId);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(rowToTask(row));
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const t = req.body;
  const updates = [];
  const params = [];

  if (t.name !== undefined) { updates.push('name = ?'); params.push(t.name); }
  if (t.description !== undefined) { updates.push('description = ?'); params.push(t.description); }
  if (t.starValue !== undefined) { updates.push('star_value = ?'); params.push(t.starValue); }
  if (t.star_value !== undefined && t.starValue === undefined) { updates.push('star_value = ?'); params.push(t.star_value); }
  if (t.icon !== undefined) { updates.push('icon = ?'); params.push(t.icon); }
  if (t.isActive !== undefined) { updates.push('is_active = ?'); params.push(t.isActive ? 1 : 0); }
  if (t.recurrence !== undefined) { updates.push('recurrence = ?'); params.push(JSON.stringify(t.recurrence)); }
  if ('startTime' in t) { updates.push('start_time = ?'); params.push(t.startTime ?? null); }
  if ('endTime' in t) { updates.push('end_time = ?'); params.push(t.endTime ?? null); }
  if ('category' in t) { updates.push('category = ?'); params.push(t.category ?? null); }
  if (t.requiresProof !== undefined) { updates.push('requires_proof = ?'); params.push(t.requiresProof ? 1 : 0); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  broadcast('tasks', req.user.familyId);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToTask(row));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND family_id = ?').run(req.params.id, req.user.familyId);
  broadcast('tasks', req.user.familyId);
  res.json({ ok: true });
});

module.exports = router;
