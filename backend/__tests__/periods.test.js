'use strict';

process.env.DB_PATH = ':memory:';
process.env.FAMILY_ID = 'test-family-id';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { authCookie } = require('./helpers');

const FAMILY_ID = 'test-family-id';

beforeAll(() => {
  db.prepare(
    "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
  ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 0);
});

describe('Periods API', () => {
  it('GET /api/periods returns empty array initially', async () => {
    const res = await request(app).get('/api/periods').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/periods/active returns null initially', async () => {
    const res = await request(app).get('/api/periods/active').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  let periodId;

  it('POST /api/periods creates a period with ISO date strings', async () => {
    const res = await request(app)
      .post('/api/periods')
      .set('Cookie', authCookie())
      .send({
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-28T23:59:59.000Z',
        status: 'active',
        starBudget: 50,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.startDate).toBe('2026-02-01T00:00:00.000Z');
    expect(res.body.endDate).toBe('2026-02-28T23:59:59.000Z');
    expect(res.body.status).toBe('active');
    expect(res.body.starBudget).toBe(50);
    periodId = res.body.id;
  });

  it('GET /api/periods/active returns the active period', async () => {
    const res = await request(app).get('/api/periods/active').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body.id).toBe(periodId);
    expect(res.body.status).toBe('active');
  });

  it('GET /api/periods/active with multiple periods returns only active one', async () => {
    // Create a completed period
    await request(app)
      .post('/api/periods')
      .set('Cookie', authCookie())
      .send({
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.000Z',
        status: 'completed',
      });

    const res = await request(app).get('/api/periods/active').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(res.body.id).toBe(periodId);
  });

  it('PUT /api/periods/:id updates status and outcome', async () => {
    const res = await request(app)
      .put(`/api/periods/${periodId}`)
      .set('Cookie', authCookie())
      .send({ status: 'completed', outcome: 'reward' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.outcome).toBe('reward');
  });

  it('GET /api/periods/active returns null after period completed', async () => {
    const res = await request(app).get('/api/periods/active').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});
