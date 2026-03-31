'use strict';

/** Map of familyId → Set of SSE response objects */
const clientsByFamily = new Map();

/**
 * Broadcast an invalidation event to SSE clients for a specific family.
 * @param {string} collection - e.g. 'tasks', 'periods', 'family', etc.
 * @param {string} familyId - the family to notify
 */
function broadcast(collection, familyId) {
  const payload = `data: ${JSON.stringify({ type: 'invalidate', collection })}\n\n`;
  const clients = familyId ? (clientsByFamily.get(familyId) || new Set()) : new Set();
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (_) {
      clientsByFamily.get(familyId)?.delete(res);
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

  const familyId = req.user?.familyId || '_anonymous';
  if (!clientsByFamily.has(familyId)) {
    clientsByFamily.set(familyId, new Set());
  }
  clientsByFamily.get(familyId).add(res);

  // Ping every 30s to keep alive
  const ping = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    } catch (_) {
      clearInterval(ping);
      clientsByFamily.get(familyId)?.delete(res);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(ping);
    clientsByFamily.get(familyId)?.delete(res);
  });
}

module.exports = { broadcast, sseHandler };
