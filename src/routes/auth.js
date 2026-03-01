'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

const FAMILY_ID = process.env.FAMILY_ID;

/**
 * Replicates the frontend's hashPin function from src/lib/utils/pin.ts
 */
function hashPin(pin) {
  let hash = 0;
  const str = `star-routine-pin-${pin}-salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36);
}

// POST /api/auth/verify-pin
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.json({ valid: false });

  const row = db.prepare('SELECT child_pin FROM families WHERE id = ?').get(FAMILY_ID);
  if (!row || !row.child_pin) return res.json({ valid: false });

  const storedPin = row.child_pin;
  const hashed = hashPin(String(pin));

  // Accept either hashed match or direct match (for migration period)
  const valid = hashed === storedPin || String(pin) === storedPin;
  res.json({ valid });
});

module.exports = router;
