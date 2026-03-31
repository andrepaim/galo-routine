'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { nanoid } = require('nanoid');

const VALID_STATUSES = ['pending', 'fulfilled', 'rejected'];

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
  const rows = db.prepare('SELECT * FROM redemptions WHERE family_id = ? ORDER BY redeemed_at DESC').all(req.user.familyId);
  res.json(rows.map(rowToRedemption));
});

// POST /api/redemptions
router.post('/', (req, res) => {
  const r = req.body;
  const id = r.id || nanoid();
  const familyId = req.user.familyId;
  const rewardId = r.rewardId ?? r.reward_id;

  db.prepare(`
    INSERT INTO redemptions (id, family_id, reward_id, reward_name, star_cost, redeemed_at, status, fulfilled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, familyId,
    rewardId,
    r.rewardName ?? r.reward_name ?? '',
    r.starCost ?? r.star_cost ?? 0,
    toIso(r.redeemedAt ?? r.redeemed_at) ?? new Date().toISOString(),
    'pending', // Bug 10: always start as pending
    null,
  );
  broadcast('redemptions', familyId);
  const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(id);
  res.status(201).json(rowToRedemption(row));
});

// PUT /api/redemptions/:id
router.put('/:id', (req, res) => {
  const r = req.body;
  const familyId = req.user.familyId;

  // Bug 3: Atomic fulfillment — deduct stars + decrement quantity in one transaction
  if (r.status === 'fulfilled') {
    const redemption = db.prepare(
      'SELECT * FROM redemptions WHERE id = ? AND family_id = ?'
    ).get(req.params.id, familyId);
    if (!redemption) return res.status(404).json({ error: 'Not found' });

    // Idempotent: already fulfilled
    if (redemption.status === 'fulfilled') {
      return res.json(rowToRedemption(redemption));
    }

    const txn = db.transaction(() => {
      db.prepare(
        'UPDATE redemptions SET status = ?, fulfilled_at = ? WHERE id = ? AND family_id = ?'
      ).run('fulfilled', new Date().toISOString(), req.params.id, familyId);

      // Deduct stars from balance
      if (redemption.star_cost > 0) {
        db.prepare(
          'UPDATE families SET star_balance = MAX(0, star_balance - ?) WHERE id = ?'
        ).run(redemption.star_cost, familyId);
      }
    });
    txn();

    broadcast('redemptions', familyId);
    broadcast('family', familyId);
    const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id);
    return res.json(rowToRedemption(row));
  }

  // Bug 11: On rejection, restore limited reward quantity
  if (r.status === 'rejected') {
    const redemption = db.prepare(
      'SELECT * FROM redemptions WHERE id = ? AND family_id = ?'
    ).get(req.params.id, familyId);
    if (!redemption) return res.status(404).json({ error: 'Not found' });

    const txn = db.transaction(() => {
      db.prepare(
        'UPDATE redemptions SET status = ? WHERE id = ? AND family_id = ?'
      ).run('rejected', req.params.id, familyId);

      // Restore quantity for limited rewards
      if (redemption.reward_id) {
        db.prepare(
          `UPDATE rewards SET quantity = quantity + 1
           WHERE id = ? AND family_id = ? AND availability = 'limited'`
        ).run(redemption.reward_id, familyId);
      }
    });
    txn();

    broadcast('redemptions', familyId);
    broadcast('rewards', familyId);
    const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id);
    return res.json(rowToRedemption(row));
  }

  // Generic update
  const updates = [];
  const params = [];

  // Bug 10: Validate status
  if (r.status !== undefined) {
    if (!VALID_STATUSES.includes(r.status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    updates.push('status = ?'); params.push(r.status);
  }
  if (r.fulfilledAt !== undefined || r.fulfilled_at !== undefined) {
    updates.push('fulfilled_at = ?'); params.push(toIso(r.fulfilledAt ?? r.fulfilled_at));
  }

  if (updates.length > 0) {
    // Bug 6: Include family_id in WHERE clause
    params.push(req.params.id, familyId);
    db.prepare(`UPDATE redemptions SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`).run(...params);
  }

  broadcast('redemptions', familyId);
  const row = db.prepare('SELECT * FROM redemptions WHERE id = ? AND family_id = ?').get(req.params.id, familyId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(rowToRedemption(row));
});

module.exports = router;
