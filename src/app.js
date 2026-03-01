'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────
const { sseHandler } = require('./sse');

// SSE event stream
app.get('/api/events', sseHandler);

// Family
app.use('/api/family', require('./routes/family'));

// Tasks
app.use('/api/tasks', require('./routes/tasks'));

// Periods
app.use('/api/periods', require('./routes/periods'));

// Completions (nested under period)
const completionsRouter = require('./routes/completions');
app.use('/api/completions/:periodId', completionsRouter);

// Rewards
app.use('/api/rewards', require('./routes/rewards'));

// Redemptions
app.use('/api/redemptions', require('./routes/redemptions'));

// Galo
app.use('/api/galo', require('./routes/galo'));

// Auth
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

module.exports = app;
