// End-to-end smoke test using only built-in node:test + the HTTP module.
// No supertest, no jest — keeps the dependency tree small. We:
//   1. boot the real Express app on an ephemeral port,
//   2. create an order via POST /v1/orders,
//   3. initiate a manual payment for it,
//   4. assert the payment came back with the canonical status + redirectUrl,
//   5. assert the order moved to "awaiting_payment".

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildApp } from '../src/app.js';

/** @param {http.Server} server */
function listenAsync(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function jsonRequest(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: data
          ? { 'content-type': 'application/json', 'content-length': data.length }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = raw;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            /* leave as raw string */
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

test('orders → payments (manual provider) happy path', async (t) => {
  const { app } = buildApp();
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  // 1) Health check
  const health = await jsonRequest(port, 'GET', '/v1/healthz');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  // 2) Providers endpoint — manual must be registered
  const providersRes = await jsonRequest(port, 'GET', '/v1/providers');
  assert.equal(providersRes.status, 200);
  const manual = providersRes.body.providers.find((p) => p.name === 'manual');
  assert.ok(manual && manual.enabled, 'manual provider should be registered and enabled');

  // 3) Create an order
  const orderRes = await jsonRequest(port, 'POST', '/v1/orders', {
    currency: 'GEL',
    items: [{ productId: 'svaneti', title: 'Svaneti — Original', quantity: 1, unitAmountMinor: 25000 }],
    shippingMinor: 500,
    shipping: { name: 'Test', email: 'test@example.com', phone: '+995579388833', address: '1 Rustaveli Ave' },
  });
  assert.equal(orderRes.status, 201, `unexpected status: ${JSON.stringify(orderRes.body)}`);
  assert.equal(orderRes.body.order.status, 'pending');
  assert.equal(orderRes.body.order.totalMinor, 25500);

  const orderId = orderRes.body.order.id;

  // 4) Initiate a payment (no provider specified → falls back to manual)
  const payRes = await jsonRequest(port, 'POST', '/v1/payments', {
    orderId,
    returnUrl: 'https://ninartvision.store/sale/shop.html?paid=1',
  });
  assert.equal(payRes.status, 201, `unexpected status: ${JSON.stringify(payRes.body)}`);
  assert.equal(payRes.body.payment.provider, 'manual');
  assert.equal(payRes.body.payment.status, 'requires_action');
  assert.ok(payRes.body.payment.redirectUrl, 'manual provider should return an instructions URL');

  // 5) Order should have moved to awaiting_payment
  const after = await jsonRequest(port, 'GET', `/v1/orders/${orderId}`);
  assert.equal(after.status, 200);
  assert.equal(after.body.order.status, 'awaiting_payment');
});

test('refuses to create order without items', async (t) => {
  const { app } = buildApp();
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const res = await jsonRequest(port, 'POST', '/v1/orders', { currency: 'GEL', items: [] });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'validation_error');
});

test('payment for unknown order returns 404', async (t) => {
  const { app } = buildApp();
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const res = await jsonRequest(port, 'POST', '/v1/payments', {
    orderId: 'ord_does_not_exist',
    returnUrl: 'https://example.com/return',
  });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'not_found');
});

test('unknown provider in webhook URL returns 404', async (t) => {
  const { app } = buildApp();
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const res = await jsonRequest(port, 'POST', '/v1/webhooks/madeup', { hello: 'world' });
  assert.equal(res.status, 404);
});
