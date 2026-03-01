'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { nanoid } = require('nanoid');

const FAMILY_ID = process.env.FAMILY_ID;

function rowToRedemption(row) {
  return {
    id: row.id,
    familyId: row.family_id,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    starCost: row.star_cost,
    redeemedAt: row.redeemed_at,
    status: row.status,
    fulfilledAt: row.fulfilled_at,
  };
}

function toIso(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (val.toDate) return val.toDate().toISOString();
  return String(val);
}

// GET /api/redemptions
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM redemptions WHERE family_id = ? ORDER BY redeemed_at DESC').all(FAMILY_ID);
  res.json(rows.map(rowToRedemption));
});

// POST /api/redemptions
router.post('/', (req, res) => {
  const r = req.body;
  const id = r.id || nanoid();
  db.prepare(`
    INSERT INTO redemptions (id, family_id, reward_id, reward_name, star_cost, redeemed_at, status, fulfilled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, FAMILY_ID,
    r.rewardId ?? r.reward_id,
    r.rewardName ?? r.reward_name ?? '',
    r.starCost ?? r.star_cost ?? 0,
    toIso(r.redeemedAt ?? r.redeemed_at) ?? new Date().toISOString(),
    r.status || 'pending',
    toIso(r.fulfilledAt ?? r.fulfilled_at) ?? null,
  );
  broadcast('redemptions');
  const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(id);
  res.status(201).json(rowToRedemption(row));
});

// PUT /api/redemptions/:id
router.put('/:id', (req, res) => {
  const r = req.body;
  const updates = [];
  const params = [];

  if (r.status !== undefined) { updates.push('status = ?'); params.push(r.status); }
  if (r.fulfilledAt !== undefined || r.fulfilled_at !== undefined) {
    updates.push('fulfilled_at = ?'); params.push(toIso(r.fulfilledAt ?? r.fulfilled_at));
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE redemptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  broadcast('redemptions');
  const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToRedemption(row));
});

module.exports = router;
