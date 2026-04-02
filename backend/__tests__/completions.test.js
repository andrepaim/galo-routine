'use strict';

process.env.DB_PATH = ':memory:';
process.env.FAMILY_ID = 'test-family-id';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { authCookie } = require('./helpers');

const FAMILY_ID = 'test-family-id';
const PERIOD_ID = 'test-period-001';
const PERIOD_ID_2 = 'test-period-002';

beforeAll(() => {
  db.prepare(
    "INSERT INTO families (id, parent_name, child_name, child_pin, star_balance) VALUES (?, ?, ?, ?, ?)"
  ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 0);

  // Create two periods for isolation test
  db.prepare(
    "INSERT INTO periods (id, family_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)"
  ).run(PERIOD_ID, FAMILY_ID, '2026-02-01T00:00:00.000Z', '2026-02-28T23:59:59.000Z', 'active');
  db.prepare(
    "INSERT INTO periods (id, family_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)"
  ).run(PERIOD_ID_2, FAMILY_ID, '2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.000Z', 'completed');

  // Create tasks referenced by completions (route validates task exists)
  db.prepare(
    "INSERT INTO tasks (id, family_id, name, star_value, is_active) VALUES (?, ?, ?, ?, ?)"
  ).run('task-abc', FAMILY_ID, 'Brush teeth', 2, 1);
  db.prepare(
    "INSERT INTO tasks (id, family_id, name, star_value, is_active) VALUES (?, ?, ?, ?, ?)"
  ).run('task-xyz', FAMILY_ID, 'Other task', 1, 1);
  db.prepare(
    "INSERT INTO tasks (id, family_id, name, star_value, is_active) VALUES (?, ?, ?, ?, ?)"
  ).run('task-bonus', FAMILY_ID, 'Early task', 1, 1);
});

describe('Completions API', () => {
  it('GET /api/completions/:periodId returns empty array initially', async () => {
    const res = await request(app).get(`/api/completions/${PERIOD_ID}`).set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  let completionId;

  it('POST /api/completions/:periodId creates a completion', async () => {
    const res = await request(app)
      .post(`/api/completions/${PERIOD_ID}`)
      .set('Cookie', authCookie())
      .send({
        taskId: 'task-abc',
        taskName: 'Brush teeth',
        taskStarValue: 2,
        date: '2026-02-10',
        status: 'pending',
        completedAt: '2026-02-10T08:00:00.000Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.taskId).toBe('task-abc');
    expect(res.body.taskName).toBe('Brush teeth');
    expect(res.body.periodId).toBe(PERIOD_ID);
    expect(res.body.status).toBe('pending');
    completionId = res.body.id;
  });

  it('POST same id twice is idempotent (upsert), still 201', async () => {
    // Post with explicit id to force collision
    const explicit = {
      id: 'fixed-id-001',
      taskId: 'task-abc',
      taskName: 'Brush teeth',
      taskStarValue: 2,
      date: '2026-02-10',
      completedAt: '2026-02-10T08:00:00.000Z',
    };
    const res1 = await request(app)
      .post(`/api/completions/${PERIOD_ID}`)
      .set('Cookie', authCookie())
      .send(explicit);
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post(`/api/completions/${PERIOD_ID}`)
      .set('Cookie', authCookie())
      .send({ ...explicit, taskStarValue: 5 }); // overwrite with different value
    expect(res2.status).toBe(201);
    expect(res2.body.taskStarValue).toBe(2); // server validates against actual task star_value
  });

  it('GET /api/completions/:periodId returns only that period completions', async () => {
    // Add one to period2
    await request(app)
      .post(`/api/completions/${PERIOD_ID_2}`)
      .set('Cookie', authCookie())
      .send({
        taskId: 'task-xyz',
        taskName: 'Other task',
        date: '2026-01-15',
        completedAt: '2026-01-15T08:00:00.000Z',
      });

    const res = await request(app).get(`/api/completions/${PERIOD_ID}`).set('Cookie', authCookie());
    expect(res.status).toBe(200);
    const ids = res.body.map(c => c.periodId);
    ids.forEach(id => expect(id).toBe(PERIOD_ID));
  });

  it('PUT /api/completions/:periodId/:id updates status and reviewedAt', async () => {
    const res = await request(app)
      .put(`/api/completions/${PERIOD_ID}/${completionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.reviewedAt).toBeTruthy(); // server sets reviewedAt automatically on approval
  });

  it('PUT /api/completions/:periodId/:id with rejected and rejectionReason', async () => {
    const res = await request(app)
      .put(`/api/completions/${PERIOD_ID}/${completionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'rejected', rejectionReason: 'not done properly' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.rejectionReason).toBe('not done properly');
  });

  it('POST with onTimeBonus=true persists it', async () => {
    const res = await request(app)
      .post(`/api/completions/${PERIOD_ID}`)
      .set('Cookie', authCookie())
      .send({
        taskId: 'task-bonus',
        taskName: 'Early task',
        date: '2026-02-12',
        completedAt: '2026-02-12T07:00:00.000Z',
        onTimeBonus: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.onTimeBonus).toBe(true);
  });
});
