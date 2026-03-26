'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Trust Apache reverse proxy (needed for req.secure and X-Forwarded-Proto)
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.PUBLIC_URL || 'https://rotinadoatleticano.duckdns.org',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(authMiddleware);

// ── Routes ────────────────────────────────────────────────────────
const { sseHandler } = require('./sse');

// Auth (public routes inside handle their own auth check)
app.use('/api/auth', require('./routes/auth'));

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

// Canguru
app.use('/api/canguru', require('./routes/canguru'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

module.exports = app;
