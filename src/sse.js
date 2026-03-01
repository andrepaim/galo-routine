'use strict';

/** In-memory set of active SSE response objects */
const clients = new Set();

/**
 * Broadcast an invalidation event to all connected SSE clients.
 * @param {string} collection - e.g. 'tasks', 'periods', 'family', etc.
 */
function broadcast(collection) {
  const payload = `data: ${JSON.stringify({ type: 'invalidate', collection })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (_) {
      clients.delete(res);
    }
  }
}

/**
 * SSE handler — attach to GET /api/events
 */
function sseHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx / apache buffering off
  res.flushHeaders();

  clients.add(res);

  // Ping every 30s to keep alive
  const ping = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    } catch (_) {
      clearInterval(ping);
      clients.delete(res);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
}

module.exports = { broadcast, sseHandler };
