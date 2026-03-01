'use strict';

process.env.DB_PATH = ':memory:';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const FAMILY_ID = 'test-family-id';

// hashPin('1234') === 'bjeypx'  (computed locally to confirm)
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

const HASHED_1234 = hashPin('1234'); // 'bjeypx'

beforeAll(() => {
  // Seed family with hashed pin
  db.prepare(
    "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
  ).run(FAMILY_ID, 'Andre', 'Vitor', HASHED_1234, 0);
});

describe('Auth API', () => {
  it('POST /api/auth/verify-pin with correct hashed pin → { valid: true }', async () => {
    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('POST /api/auth/verify-pin with wrong pin → { valid: false }', async () => {
    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ pin: '9999' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('POST /api/auth/verify-pin with direct pin match (migration mode) → { valid: true }', async () => {
    // Set child_pin to plain '5678' (not hashed) to simulate migration
    db.prepare('UPDATE families SET child_pin = ? WHERE id = ?').run('5678', FAMILY_ID);

    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ pin: '5678' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);

    // Restore hashed pin
    db.prepare('UPDATE families SET child_pin = ? WHERE id = ?').run(HASHED_1234, FAMILY_ID);
  });

  it('POST /api/auth/verify-pin with empty body → { valid: false }', async () => {
    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });
});
