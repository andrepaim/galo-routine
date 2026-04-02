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

  it('GET /api/periods returns all periods ordered by start_date DESC', async () => {
    const res = await request(app).get('/api/periods').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Verify descending order by start_date
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].startDate >= res.body[i].startDate).toBe(true);
    }
  });

  it('PUT /api/periods/:id with nonexistent id returns 404', async () => {
    const res = await request(app)
      .put('/api/periods/nonexistent-period-xyz')
      .set('Cookie', authCookie())
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
  });

  describe('POST /api/periods/:id/complete', () => {
    let completePeriodId;

    beforeAll(() => {
      // Create an active period for completion testing
      completePeriodId = 'complete-test-period';
      db.prepare(
        "INSERT INTO periods (id, family_id, start_date, end_date, status, star_budget, thresholds) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(completePeriodId, FAMILY_ID, '2026-03-01T00:00:00.000Z', '2026-03-31T23:59:59.000Z', 'active', 20,
        JSON.stringify({ rewardPercent: 0.8, penaltyPercent: 0.3 }));

      // Create a task and approved completions worth 18 stars (90% of budget=20 -> reward)
      db.prepare(
        "INSERT INTO tasks (id, family_id, name, star_value, is_active) VALUES (?, ?, ?, ?, ?)"
      ).run('task-complete-test', FAMILY_ID, 'Test task', 6, 1);

      for (let i = 0; i < 3; i++) {
        db.prepare(
          `INSERT INTO completions (id, family_id, period_id, task_id, task_name, task_star_value, date, status, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(`comp-${i}`, FAMILY_ID, completePeriodId, 'task-complete-test', 'Test task', 6,
          `2026-03-${10 + i}`, 'approved', `2026-03-${10 + i}T08:00:00.000Z`);
      }
    });

    it('completes a period, calculates starsEarned and outcome', async () => {
      const res = await request(app)
        .post(`/api/periods/${completePeriodId}/complete`)
        .set('Cookie', authCookie());
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.starsEarned).toBe(18); // 3 completions * 6 stars
      expect(res.body.outcome).toBe('reward'); // 18/20 = 90% >= 80%
      expect(res.body.starsPending).toBe(0);
    });

    it('is idempotent — completing again returns same result', async () => {
      const res = await request(app)
        .post(`/api/periods/${completePeriodId}/complete`)
        .set('Cookie', authCookie());
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('returns 404 for nonexistent period', async () => {
      const res = await request(app)
        .post('/api/periods/nonexistent-xyz/complete')
        .set('Cookie', authCookie());
      expect(res.status).toBe(404);
    });

    it('assigns penalty outcome when stars are low', async () => {
      const lowPeriodId = 'low-stars-period';
      db.prepare(
        "INSERT INTO periods (id, family_id, start_date, end_date, status, star_budget, thresholds) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(lowPeriodId, FAMILY_ID, '2026-04-01T00:00:00.000Z', '2026-04-30T23:59:59.000Z', 'active', 100,
        JSON.stringify({ rewardPercent: 0.8, penaltyPercent: 0.3 }));

      // Only 10 stars earned out of 100 budget = 10% < 30% -> penalty
      db.prepare(
        `INSERT INTO completions (id, family_id, period_id, task_id, task_name, task_star_value, date, status, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('comp-low', FAMILY_ID, lowPeriodId, 'task-complete-test', 'Test task', 10,
        '2026-04-10', 'approved', '2026-04-10T08:00:00.000Z');

      const res = await request(app)
        .post(`/api/periods/${lowPeriodId}/complete`)
        .set('Cookie', authCookie());
      expect(res.status).toBe(200);
      expect(res.body.outcome).toBe('penalty');
    });
  });
});
