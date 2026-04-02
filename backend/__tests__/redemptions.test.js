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
  ).run(FAMILY_ID, 'Andre', 'Vitor', '297xku', 50);

  // Create a limited reward for quantity-restore tests
  db.prepare(
    "INSERT INTO rewards (id, family_id, name, star_cost, is_active, availability, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run('reward-limited', FAMILY_ID, 'Movie night', 10, 1, 'limited', 3);
});

describe('Redemptions API', () => {
  it('GET /api/redemptions returns empty array initially', async () => {
    const res = await request(app).get('/api/redemptions').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  let redemptionId;

  it('POST /api/redemptions creates redemption with status=pending and fulfilledAt=null', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .set('Cookie', authCookie())
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

  it('GET /api/redemptions after POST returns created redemption', async () => {
    const res = await request(app).get('/api/redemptions').set('Cookie', authCookie());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const found = res.body.find(r => r.id === redemptionId);
    expect(found).toBeDefined();
    expect(found.rewardName).toBe('Ice cream');
  });

  it('PUT /api/redemptions/:id with status=fulfilled deducts stars from family balance', async () => {
    // Check balance before
    const familyBefore = await request(app).get('/api/family').set('Cookie', authCookie());
    const balanceBefore = familyBefore.body.starBalance;

    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'fulfilled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('fulfilled');
    expect(res.body.fulfilledAt).toBeTruthy();

    // Check balance after — should be reduced by starCost (5)
    const familyAfter = await request(app).get('/api/family').set('Cookie', authCookie());
    expect(familyAfter.body.starBalance).toBe(balanceBefore - 5);
  });

  it('PUT /api/redemptions/:id fulfillment is idempotent — does not double-deduct', async () => {
    const familyBefore = await request(app).get('/api/family').set('Cookie', authCookie());
    const balanceBefore = familyBefore.body.starBalance;

    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'fulfilled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('fulfilled');

    // Balance should not change on repeat fulfillment
    const familyAfter = await request(app).get('/api/family').set('Cookie', authCookie());
    expect(familyAfter.body.starBalance).toBe(balanceBefore);
  });

  it('PUT /api/redemptions/:id with status=rejected restores limited reward quantity', async () => {
    // Create a redemption for the limited reward
    const createRes = await request(app)
      .post('/api/redemptions')
      .set('Cookie', authCookie())
      .send({
        rewardId: 'reward-limited',
        rewardName: 'Movie night',
        starCost: 10,
        redeemedAt: '2026-02-11T15:00:00.000Z',
      });
    expect(createRes.status).toBe(201);
    const limitedRedemptionId = createRes.body.id;

    // Check reward quantity before rejection
    const quantityBefore = db.prepare('SELECT quantity FROM rewards WHERE id = ?').get('reward-limited').quantity;

    // Reject it
    const res = await request(app)
      .put(`/api/redemptions/${limitedRedemptionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');

    // Quantity should be restored (+1)
    const quantityAfter = db.prepare('SELECT quantity FROM rewards WHERE id = ?').get('reward-limited').quantity;
    expect(quantityAfter).toBe(quantityBefore + 1);
  });

  it('PUT /api/redemptions/:id with invalid status returns 400', async () => {
    const res = await request(app)
      .put(`/api/redemptions/${redemptionId}`)
      .set('Cookie', authCookie())
      .send({ status: 'bogus_status' });
    expect(res.status).toBe(400);
  });

  it('PUT /api/redemptions/nonexistent → 404', async () => {
    const res = await request(app)
      .put('/api/redemptions/nonexistent-id-xyz')
      .set('Cookie', authCookie())
      .send({ status: 'fulfilled' });
    expect(res.status).toBe(404);
  });
});
