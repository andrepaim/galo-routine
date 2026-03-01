'use strict';

process.env.DB_PATH = ':memory:';
jest.resetModules();

const request = require('supertest');
const app = require('../src/app');
const http = require('http');

describe('SSE /api/events', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('returns 200 with Content-Type: text/event-stream', (done) => {
    const req = http.get(`http://127.0.0.1:${port}/api/events`, (res) => {
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
      req.destroy();
      done();
    });
    req.on('error', (err) => {
      if (err.code === 'ECONNRESET') return; // expected after destroy
      done(err);
    });
  });

  it('response headers include cache-control: no-cache', (done) => {
    const req = http.get(`http://127.0.0.1:${port}/api/events`, (res) => {
      expect(res.headers['cache-control']).toMatch(/no-cache/);
      req.destroy();
      done();
    });
    req.on('error', (err) => {
      if (err.code === 'ECONNRESET') return;
      done(err);
    });
  });
});
