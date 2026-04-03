'use strict';

/**
 * Docker entrypoint for galo-routine.
 *
 * This wrapper does two things that the normal index.js doesn't:
 *   1. Serves the pre-built frontend from FRONTEND_DIST as static files,
 *      with a catch-all fallback to index.html for SPA routing.
 *   2. Binds to 0.0.0.0 instead of 127.0.0.1 so the container port is
 *      reachable from the host.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const app = require('./src/app');

// ── Serve frontend static files ─────────────────────────────────
const distDir = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(distDir));

// SPA catch-all: any non-API route serves index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

// ── Start (bind to 0.0.0.0 for Docker) ─────────────────────────
const PORT = 3200;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[galo-routine] Docker: listening on http://${HOST}:${PORT}`);
  console.log(`[galo-routine] Serving frontend from ${distDir}`);
});
