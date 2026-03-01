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

describe('Redemptions API', () => {
  it('GET /api/redemptions returns empty array initially', async () => {
    const res = await request(app).get('/api/redemptions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  let redemptionId;

  it('POST /api/redemptions creates redemption with status=pending and fulfilledAt=null', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .send({
        rewardId: 'reward-001',
        rewardName: 'Ice cream',
        starCost: 5,
        redeemedAt: '2026-02-10T15:00:00.000Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.status).toBe('pending');
    expect(res.body.fulfilledAt).toBeNull();
    expect(res.body.rewardId).toBe('reward-001');
    expect(res.body.rewardName).toBe('Ice cream');
    expect(res.body.starCost).toBe(5);
    redemptionId = res.body.id;
  });

  it('PUT /api/redemptions/:id with status=fulfilled updates fulfilledAt', async () => {
    const fulfilledAt = '2026-02-11T10:00:00.000Z';
    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .send({ status: 'fulfilled', fulfilledAt });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('fulfilled');
    expect(res.body.fulfilledAt).toBe(fulfilledAt);
  });

  it('PUT /api/redemptions/:id with status=rejected updates status', async () => {
    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
  });

  it('PUT /api/redemptions/nonexistent → 404', async () => {
    const res = await request(app)
      .put('/api/redemptions/nonexistent-id-xyz')
      .send({ status: 'fulfilled' });
    expect(res.status).toBe(404);
  });
});
