'use strict';

process.env.DB_PATH = ':memory:';
process.env.FAMILY_ID = 'test-family-id';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const FAMILY_ID = 'test-family-id';

describe('Family API', () => {
  describe('GET /api/family', () => {
    it('auto-creates family row if missing and returns camelCase fields', async () => {
      const res = await request(app).get('/api/family');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(FAMILY_ID);
      expect(res.body).toHaveProperty('parentName');
      expect(res.body).toHaveProperty('childName');
      expect(res.body).toHaveProperty('starBalance');
      expect(res.body).toHaveProperty('lifetimeStarsEarned');
      expect(res.body).toHaveProperty('currentStreak');
      expect(res.body).toHaveProperty('bestStreak');
      expect(res.body).toHaveProperty('settings');
    });

    it('returns existing family data', async () => {
      // Insert a known family row
      db.prepare('DELETE FROM families WHERE id = ?').run(FAMILY_ID);
      db.prepare(
        "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
      ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 10);

      const res = await request(app).get('/api/family');
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
        .send({ parentName: 'NewParent' });
      expect(res.status).toBe(200);
      expect(res.body.parentName).toBe('NewParent');
    });

    it('persists settings as JSON', async () => {
      const res = await request(app)
        .put('/api/family')
        .send({ settings: { periodType: 'weekly' } });
      expect(res.status).toBe(200);
      expect(res.body.settings).toEqual({ periodType: 'weekly' });
    });

    it('returns 200 and ok:true with empty body (no-op)', async () => {
      const res = await request(app)
        .put('/api/family')
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
        .send({ field: 'starBalance', amount: 5 });
      expect(res.status).toBe(200);
      expect(res.body.starBalance).toBe(5);
    });

    it('decrements starBalance by 3', async () => {
      // First set to 10
      db.prepare('UPDATE families SET star_balance = 10 WHERE id = ?').run(FAMILY_ID);
      const res = await request(app)
        .put('/api/family/increment')
        .send({ field: 'starBalance', amount: -3 });
      expect(res.status).toBe(200);
      expect(res.body.starBalance).toBe(7);
    });

    it('returns 400 for invalid field', async () => {
      const res = await request(app)
        .put('/api/family/increment')
        .send({ field: 'childName', amount: 1 });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
