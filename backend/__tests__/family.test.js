'use strict';

process.env.DB_PATH = ':memory:';
process.env.FAMILY_ID = 'test-family-id';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { authCookie } = require('./helpers');

const FAMILY_ID = 'test-family-id';

describe('Family API', () => {
  describe('GET /api/family', () => {
    it('returns null when family row does not exist', async () => {
      const res = await request(app).get('/api/family').set('Cookie', authCookie());
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it('returns existing family data', async () => {
      // Insert a known family row
      db.prepare('DELETE FROM families WHERE id = ?').run(FAMILY_ID);
      db.prepare(
        "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
      ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 10);

      const res = await request(app).get('/api/family').set('Cookie', authCookie());
      expect(res.status).toBe(200);
      expect(res.body.parentName).toBe('Andre');
      expect(res.body.childName).toBe('Vitor');
      expect(res.body.starBalance).toBe(10);
    });
  });

  describe('PUT /api/family', () => {
    beforeEach(() => {
      // Ensure row exists
      const row = db.prepare('SELECT id FROM families WHERE id = ?').get(FAMILY_ID);
      if (!row) {
        db.prepare(
          "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
        ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 0);
      }
    });

    it('updates parentName and returns updated family', async () => {
      const res = await request(app)
        .put('/api/family')
        .set('Cookie', authCookie())
        .send({ parentName: 'NewParent' });
      expect(res.status).toBe(200);
      expect(res.body.parentName).toBe('NewParent');
    });

    it('persists settings as JSON (merged with defaults)', async () => {
      const res = await request(app)
        .put('/api/family')
        .set('Cookie', authCookie())
        .send({ settings: { periodType: 'weekly' } });
      expect(res.status).toBe(200);
      expect(res.body.settings.periodType).toBe('weekly');
      // Settings are merged with defaults, so extra keys are present
      expect(res.body.settings).toHaveProperty('rewardThresholdPercent');
    });

    it('returns 200 and ok:true with empty body (no-op)', async () => {
      const res = await request(app)
        .put('/api/family')
        .set('Cookie', authCookie())
        .send({});
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('PUT /api/family/increment', () => {
    beforeEach(() => {
      db.prepare('DELETE FROM families WHERE id = ?').run(FAMILY_ID);
      db.prepare(
        "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
      ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 0);
    });

    it('increments starBalance by 5', async () => {
      const res = await request(app)
        .put('/api/family/increment')
        .set('Cookie', authCookie())
        .send({ field: 'starBalance', amount: 5 });
      expect(res.status).toBe(200);
      expect(res.body.starBalance).toBe(5);
    });

    it('decrements starBalance by 3', async () => {
      // First set to 10
      db.prepare('UPDATE families SET star_balance = 10 WHERE id = ?').run(FAMILY_ID);
      const res = await request(app)
        .put('/api/family/increment')
        .set('Cookie', authCookie())
        .send({ field: 'starBalance', amount: -3 });
      expect(res.status).toBe(200);
      expect(res.body.starBalance).toBe(7);
    });

    it('returns 400 for invalid field', async () => {
      const res = await request(app)
        .put('/api/family/increment')
        .set('Cookie', authCookie())
        .send({ field: 'childName', amount: 1 });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
