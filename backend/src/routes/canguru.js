'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');
const { randomUUID } = require('crypto');

// familyId from req.user || 'EXmCPl8hrnOYDzrPewHoXlGa5762';

// POST /api/canguru/session — save a completed quiz session + credit stars
router.post('/session', (req, res) => {
  try {
    const { mode, correct, wrong, skipped, score, starsEarned } = req.body;
    if (!mode) return res.status(400).json({ error: 'mode required' });

    const id = randomUUID();
    const now = new Date().toISOString();
    const date = now.slice(0, 10);
    const total = (correct || 0) + (wrong || 0) + (skipped || 0);

    db.prepare(`
      INSERT INTO canguru_sessions (id, family_id, date, mode, total_questions, correct, wrong, skipped, score, stars_earned, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.familyId, date, mode, total, correct || 0, wrong || 0, skipped || 0, score || 0, starsEarned || 0, now);

    // Credit stars if earned
    if (starsEarned > 0) {
      db.prepare(`
        UPDATE families SET star_balance = star_balance + ?, lifetime_stars_earned = lifetime_stars_earned + ? WHERE id = ?
      `).run(starsEarned, starsEarned, req.user.familyId);
      broadcast('family');
    }

    const session = db.prepare('SELECT * FROM canguru_sessions WHERE id = ?').get(id);
    res.json({ ok: true, session });
  } catch (err) {
    console.error('[canguru] POST /session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/canguru/sessions — last 10 sessions
router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT * FROM canguru_sessions WHERE family_id = ? ORDER BY completed_at DESC LIMIT 10
    `).all(req.user.familyId);
    res.json({ sessions });
  } catch (err) {
    console.error('[canguru] GET /sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/canguru/stats — aggregate stats
router.get('/stats', (req, res) => {
  try {
    const totalSessions = db.prepare('SELECT COUNT(*) as n FROM canguru_sessions WHERE family_id = ?').get(req.user.familyId).n;
    const bestScore = db.prepare('SELECT MAX(score) as n FROM canguru_sessions WHERE family_id = ?').get(req.user.familyId).n || 0;
    const avgRow = db.prepare('SELECT AVG(correct) as n FROM canguru_sessions WHERE family_id = ?').get(req.user.familyId);
    const avgCorrect = avgRow.n ? Math.round(avgRow.n * 10) / 10 : 0;
    const lastSession = db.prepare('SELECT * FROM canguru_sessions WHERE family_id = ? ORDER BY completed_at DESC LIMIT 1').get(req.user.familyId) || null;
    res.json({ totalSessions, bestScore, avgCorrect, lastSession });
  } catch (err) {
    console.error('[canguru] GET /stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
