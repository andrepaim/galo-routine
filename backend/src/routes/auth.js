'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { google } = require('googleapis');
const db = require('../db');
const { createToken, verifyToken, COOKIE, MAX_AGE } = require('../middleware/auth');

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || 'andrepaim@gmail.com,saraplemos@gmail.com')
  .split(',').map(e => e.trim()).filter(Boolean);

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://rotinadoatleticano.duckdns.org';
const REDIRECT_URI = `${PUBLIC_URL}/api/auth/google/callback`;

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

// Hashes child PIN the same way as the frontend
function hashPin(pin) {
  let hash = 0;
  const str = `star-routine-pin-${pin}-salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// GET /api/auth/google — redirect to consent screen
router.get('/google', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
  });
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  res.cookie('oauth_state', state, { maxAge: 600_000, httpOnly: true, secure: isSecure, sameSite: 'lax' });
  res.redirect(url);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;

  if (!storedState || storedState !== state) {
    return res.status(400).send('Invalid OAuth state');
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userinfo } = await oauth2.userinfo.get();

    const email = userinfo.email;
    if (!ALLOWED_EMAILS.includes(email)) {
      return res.status(403).send('Access denied. This app is private.');
    }

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(userinfo.id);
    if (!user) {
      const { nanoid } = require('nanoid');
      const userId = nanoid();
      db.prepare(`
        INSERT INTO users (id, google_id, email, name, picture, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, userinfo.id, email, userinfo.name, userinfo.picture, new Date().toISOString());
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else {
      // Update name/picture in case they changed
      db.prepare('UPDATE users SET name = ?, picture = ? WHERE id = ?')
        .run(userinfo.name, userinfo.picture, user.id);
    }

    // Auto-link pre-seeded families by email
    if (!user.family_id) {
      const PRESEEDED = {
        'saraplemos@gmail.com': '_ocxDr5OTFBonrJqXJfO4',
        'andrepaim@gmail.com': 'EXmCPl8hrnOYDzrPewHoXlGa5762',
      };
      const preseededFamilyId = PRESEEDED[email];
      if (preseededFamilyId) {
        const family = db.prepare('SELECT id FROM families WHERE id = ?').get(preseededFamilyId);
        if (family) {
          db.prepare('UPDATE users SET family_id = ? WHERE id = ?').run(preseededFamilyId, user.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
        }
      }
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      familyId: user.family_id || null,
    });

    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    res
      .cookie(COOKIE, token, { maxAge: MAX_AGE * 1000, httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/' })
      .clearCookie('oauth_state')
      .send(`<!DOCTYPE html><html><head><meta charset="utf-8">
<script>window.location.replace('/');</script>
</head><body><p>Redirecting...</p></body></html>`);
  } catch (err) {
    console.error('[auth] OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE];
  const user = token ? verifyToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({
    userId: user.userId,
    email: user.email,
    name: user.name,
    picture: user.picture,
    familyId: user.familyId,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' }).json({ ok: true });
});

// POST /api/auth/verify-pin (child PIN — scoped to authenticated family)
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.json({ valid: false });

  // Get familyId from session token if available, else from query
  const token = req.cookies?.[COOKIE];
  const sessionUser = token ? verifyToken(token) : null;
  const familyId = sessionUser?.familyId;

  if (!familyId) return res.json({ valid: false });

  const row = db.prepare('SELECT child_pin FROM families WHERE id = ?').get(familyId);
  if (!row || !row.child_pin) return res.json({ valid: false });

  const hashed = hashPin(String(pin));
  const valid = hashed === row.child_pin || String(pin) === row.child_pin;
  res.json({ valid });
});

module.exports = router;
