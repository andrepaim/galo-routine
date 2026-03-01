'use strict';

process.env.DB_PATH = ':memory:';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns 200 with { ok: true }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
