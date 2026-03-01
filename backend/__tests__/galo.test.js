'use strict';

process.env.DB_PATH = ':memory:';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const FAMILY_ID = 'test-family-id';

beforeAll(() => {
  db.prepare(
    "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
  ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 0);
});

describe('Galo API', () => {
  describe('Schedule', () => {
    it('GET /api/galo/schedule returns null when empty', async () => {
      const res = await request(app).get('/api/galo/schedule');
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it('PUT /api/galo/schedule stores data', async () => {
      const res = await request(app)
        .put('/api/galo/schedule')
        .send({ data: { matches: [], suggestedRewards: [] } });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('GET /api/galo/schedule after PUT returns the data object', async () => {
      const res = await request(app).get('/api/galo/schedule');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ matches: [], suggestedRewards: [] });
    });

    it('PUT /api/galo/schedule twice overwrites (upsert)', async () => {
      await request(app)
        .put('/api/galo/schedule')
        .send({ data: { matches: [{ id: 1 }], suggestedRewards: [] } });

      const res = await request(app).get('/api/galo/schedule');
      expect(res.body.matches).toEqual([{ id: 1 }]);
    });
  });

  describe('News State', () => {
    it('GET /api/galo/news-state returns { shownIds: [] } when empty', async () => {
      const res = await request(app).get('/api/galo/news-state');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ shownIds: [] });
    });

    it('PUT /api/galo/news-state stores shownIds', async () => {
      const res = await request(app)
        .put('/api/galo/news-state')
        .send({ shownIds: ['id1', 'id2'] });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('GET /api/galo/news-state after PUT returns the shownIds', async () => {
      const res = await request(app).get('/api/galo/news-state');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ shownIds: ['id1', 'id2'] });
    });

    it('PUT /api/galo/news-state twice overwrites', async () => {
      await request(app)
        .put('/api/galo/news-state')
        .send({ shownIds: ['id3', 'id4', 'id5'] });

      const res = await request(app).get('/api/galo/news-state');
      expect(res.body.shownIds).toEqual(['id3', 'id4', 'id5']);
    });
  });
});
