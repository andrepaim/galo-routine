'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.SESSION_SECRET || 'galo-routine-secret-change-me';
const COOKIE = 'galo_session';
const MAX_AGE = 30 * 24 * 3600; // 30 days

// Public paths that don't require auth
const PUBLIC_PATHS = [
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/health',
];

function createToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  // Allow public paths
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next();

  const token = req.cookies?.[COOKIE];
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user; // { userId, email, familyId, name, picture }
  next();
}

module.exports = { authMiddleware, createToken, verifyToken, COOKIE, MAX_AGE };
