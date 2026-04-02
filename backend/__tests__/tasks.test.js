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

describe('Tasks API', () => {
  it('GET /api/tasks returns empty array initially', async () => {
    const res = await request(app).get('/api/tasks').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  let createdTaskId;

  it('POST /api/tasks creates task with id, isActive=true, parsed recurrence', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', authCookie())
      .send({
        name: 'Brush teeth',
        starValue: 2,
        recurrence: { type: 'daily' },
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe('Brush teeth');
    expect(res.body.starValue).toBe(2);
    expect(res.body.isActive).toBe(true);
    expect(res.body.recurrence).toEqual({ type: 'daily' });
    createdTaskId = res.body.id;
  });

  it('POST /api/tasks with specific_days recurrence — days persisted correctly', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', authCookie())
      .send({
        name: 'Weekend task',
        recurrence: { type: 'specific_days', days: [0, 6] },
      });
    expect(res.status).toBe(201);
    expect(res.body.recurrence.type).toBe('specific_days');
    expect(res.body.recurrence.days).toEqual([0, 6]);
  });

  it('POST /api/tasks with optional fields — all persisted', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', authCookie())
      .send({
        name: 'Full task',
        startTime: '08:00',
        endTime: '09:00',
        category: 'morning',
        icon: '🦷',
      });
    expect(res.status).toBe(201);
    expect(res.body.startTime).toBe('08:00');
    expect(res.body.endTime).toBe('09:00');
    expect(res.body.category).toBe('morning');
    expect(res.body.icon).toBe('🦷');
  });

  it('POST /api/tasks without optional fields — fields are null', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', authCookie())
      .send({ name: 'Minimal task' });
    expect(res.status).toBe(201);
    expect(res.body.startTime).toBeNull();
    expect(res.body.endTime).toBeNull();
    expect(res.body.category).toBeNull();
    expect(res.body.icon).toBeNull();
  });

  it('GET /api/tasks after POST returns created task', async () => {
    const res = await request(app).get('/api/tasks').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    const found = res.body.find(t => t.id === createdTaskId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Brush teeth');
  });

  it('PUT /api/tasks/:id updates name and starValue', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Cookie', authCookie())
      .send({ name: 'Brush teeth (updated)', starValue: 3 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Brush teeth (updated)');
    expect(res.body.starValue).toBe(3);
  });

  it('PUT /api/tasks/:id with isActive=false', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Cookie', authCookie())
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('PUT /api/tasks/:id with recurrence update', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Cookie', authCookie())
      .send({ recurrence: { type: 'weekly', days: [1, 3, 5] } });
    expect(res.status).toBe(200);
    expect(res.body.recurrence).toEqual({ type: 'weekly', days: [1, 3, 5] });
  });

  it('DELETE /api/tasks/:id removes the task', async () => {
    const res = await request(app).delete(`/api/tasks/${createdTaskId}`).set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const listRes = await request(app).get('/api/tasks').set('Cookie', authCookie());
    const found = listRes.body.find(t => t.id === createdTaskId);
    expect(found).toBeUndefined();
  });

  it('PUT /api/tasks/nonexistent → 404', async () => {
    const res = await request(app)
      .put('/api/tasks/nonexistent-id-xyz')
      .set('Cookie', authCookie())
      .send({ name: 'Does not matter' });
    expect(res.status).toBe(404);
  });
});
