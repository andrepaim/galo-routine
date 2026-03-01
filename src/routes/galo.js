'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { broadcast } = require('../sse');

const FAMILY_ID = process.env.FAMILY_ID;

// GET /api/galo/schedule
router.get('/schedule', (req, res) => {
  const row = db.prepare('SELECT * FROM galo_schedule WHERE family_id = ?').get(FAMILY_ID);
  if (!row) return res.json(null);
  try {
    res.json(JSON.parse(row.data));
  } catch {
    res.json(null);
  }
});

// PUT /api/galo/schedule
router.put('/schedule', (req, res) => {
  const { data } = req.body;
  const json = JSON.stringify(data || {});
  db.prepare(`
    INSERT INTO galo_schedule (family_id, data) VALUES (?, ?)
    ON CONFLICT(family_id) DO UPDATE SET data = excluded.data
  `).run(FAMILY_ID, json);
  broadcast('galoSchedule');
  res.json({ ok: true });
});

// GET /api/galo/news-state
router.get('/news-state', (req, res) => {
  const row = db.prepare('SELECT * FROM galo_news_state WHERE family_id = ?').get(FAMILY_ID);
  if (!row) return res.json({ shownIds: [] });
  try {
    res.json({ shownIds: JSON.parse(row.shown_ids) });
  } catch {
    res.json({ shownIds: [] });
  }
});

// PUT /api/galo/news-state
router.put('/news-state', (req, res) => {
  const { shownIds } = req.body;
  const json = JSON.stringify(shownIds || []);
  db.prepare(`
    INSERT INTO galo_news_state (family_id, shown_ids) VALUES (?, ?)
    ON CONFLICT(family_id) DO UPDATE SET shown_ids = excluded.shown_ids
  `).run(FAMILY_ID, json);
  broadcast('galoNewsState');
  res.json({ ok: true });
});

module.exports = router;
