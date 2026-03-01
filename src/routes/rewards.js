'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { nanoid } = require('nanoid');

const FAMILY_ID = process.env.FAMILY_ID;

function rowToReward(row) {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    description: row.description,
    starCost: row.star_cost,
    icon: row.icon,
    isActive: row.is_active === 1,
    availability: row.availability,
    quantity: row.quantity,
    requiresApproval: row.requires_approval === 1,
  };
}

// GET /api/rewards
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM rewards WHERE family_id = ?').all(FAMILY_ID);
  res.json(rows.map(rowToReward));
});

// POST /api/rewards
router.post('/', (req, res) => {
  const r = req.body;
  const id = r.id || nanoid();
  db.prepare(`
    INSERT INTO rewards (id, family_id, name, description, star_cost, icon, is_active, availability, quantity, requires_approval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, FAMILY_ID,
    r.name || '',
    r.description || '',
    r.starCost ?? r.star_cost ?? 1,
    r.icon || '',
    (r.isActive ?? r.is_active ?? true) ? 1 : 0,
    r.availability || 'unlimited',
    r.quantity ?? null,
    (r.requiresApproval ?? r.requires_approval ?? true) ? 1 : 0,
  );
  broadcast('rewards');
  const row = db.prepare('SELECT * FROM rewards WHERE id = ?').get(id);
  res.status(201).json(rowToReward(row));
});

// PUT /api/rewards/:id
router.put('/:id', (req, res) => {
  const r = req.body;
  const updates = [];
  const params = [];

  if (r.name !== undefined) { updates.push('name = ?'); params.push(r.name); }
  if (r.description !== undefined) { updates.push('description = ?'); params.push(r.description); }
  if (r.starCost !== undefined) { updates.push('star_cost = ?'); params.push(r.starCost); }
  if (r.star_cost !== undefined && r.starCost === undefined) { updates.push('star_cost = ?'); params.push(r.star_cost); }
  if (r.icon !== undefined) { updates.push('icon = ?'); params.push(r.icon); }
  if (r.isActive !== undefined) { updates.push('is_active = ?'); params.push(r.isActive ? 1 : 0); }
  if (r.availability !== undefined) { updates.push('availability = ?'); params.push(r.availability); }
  if ('quantity' in r) { updates.push('quantity = ?'); params.push(r.quantity ?? null); }
  if (r.requiresApproval !== undefined) { updates.push('requires_approval = ?'); params.push(r.requiresApproval ? 1 : 0); }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE rewards SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  broadcast('rewards');
  const row = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToReward(row));
});

// DELETE /api/rewards/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM rewards WHERE id = ? AND family_id = ?').run(req.params.id, FAMILY_ID);
  broadcast('rewards');
  res.json({ ok: true });
});

module.exports = router;
