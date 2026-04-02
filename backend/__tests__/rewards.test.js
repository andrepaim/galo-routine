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

describe('Rewards API', () => {
  it('GET /api/rewards returns empty array initially', async () => {
    const res = await request(app).get('/api/rewards').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  let rewardId;

  it('POST /api/rewards creates reward with id and correct fields', async () => {
    const res = await request(app)
      .post('/api/rewards')
      .set('Cookie', authCookie())
      .send({
        name: 'Ice cream',
        description: 'One scoop',
        starCost: 5,
        icon: '🍦',
        isActive: true,
        availability: 'unlimited',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe('Ice cream');
    expect(res.body.starCost).toBe(5);
    expect(res.body.isActive).toBe(true);
    expect(res.body.availability).toBe('unlimited');
    rewardId = res.body.id;
  });

  it('POST /api/rewards with limited availability and quantity', async () => {
    const res = await request(app)
      .post('/api/rewards')
      .set('Cookie', authCookie())
      .send({
        name: 'Movie night',
        starCost: 20,
        availability: 'limited',
        quantity: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.availability).toBe('limited');
    expect(res.body.quantity).toBe(2);
  });

  it('PUT /api/rewards/:id updates fields', async () => {
    const res = await request(app)
      .put(`/api/rewards/${rewardId}`)
      .set('Cookie', authCookie())
      .send({ name: 'Ice cream (large)', starCost: 8 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ice cream (large)');
    expect(res.body.starCost).toBe(8);
  });

  it('PUT /api/rewards/:id toggles isActive to false', async () => {
    const res = await request(app)
      .put(`/api/rewards/${rewardId}`)
      .set('Cookie', authCookie())
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('DELETE /api/rewards/:id soft-deletes reward (sets isActive=false)', async () => {
    const res = await request(app).delete(`/api/rewards/${rewardId}`).set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const listRes = await request(app).get('/api/rewards').set('Cookie', authCookie());
    const found = listRes.body.find(r => r.id === rewardId);
    expect(found).toBeDefined();
    expect(found.isActive).toBe(false);
  });

  it('PUT /api/rewards/nonexistent → 404', async () => {
    const res = await request(app)
      .put('/api/rewards/nonexistent-reward-id')
      .set('Cookie', authCookie())
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});
