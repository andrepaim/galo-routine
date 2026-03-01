'use strict';

require('dotenv').config();
const app = require('./app');

// ── Start ─────────────────────────────────────────────────────────
const PORT = 3200;
const HOST = '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`[galo-routine] Listening on http://${HOST}:${PORT}`);
});
