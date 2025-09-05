// test/consent.middleware.test.js
const express = require('express');
const request = require('supertest');
const requireConsent = require('../middleware/requireConsent');

describe('Consent enforcement middleware', () => {
  test('granted -> 200', async () => {
    const app = express();
    const mw = requireConsent({ getConsentFor: async () => ({ granted: true }) });
    app.get('/protected', mw, (req, res) => res.json({ ok: true }));

    const res = await request(app).get('/protected').set('X-User-Id', 'u1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('revoked -> 403', async () => {
    const app = express();
    const mw = requireConsent({ getConsentFor: async () => ({ granted: false }) });
    app.get('/protected', mw, (req, res) => res.json({ ok: true }));

    const res = await request(app).get('/protected').set('X-User-Id', 'u1');
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error', 'Consent required');
  });

  test('missing user id -> 401', async () => {
    const app = express();
    const mw = requireConsent({ getConsentFor: async () => ({ granted: true }) });
    app.get('/protected', mw, (req, res) => res.json({ ok: true }));

    const res = await request(app).get('/protected'); // no header
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Missing user id');
  });
});
