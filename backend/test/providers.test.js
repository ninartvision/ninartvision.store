// Tests that prove the "credentials arrive later" workflow:
//   1. With no bank env vars set, only `manual` is enabled but `tbc` and
//      `bog` still show up in /v1/providers with a "missing keys" list.
//   2. POSTing a payment with provider="tbc" while TBC is not configured
//      returns a 404 with a clear message naming the missing env keys —
//      not a generic 500.
//   3. The currency allowlist rejects non-GEL orders against `tbc` before
//      we ever try to call the bank.
//   4. The registry's get() distinguishes "unknown provider" from
//      "known-but-disabled provider".
//
// We avoid mocking by constructing an isolated registry from a synthetic
// payments-config slice. That keeps these tests independent of the real
// process.env on the dev machine.

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildApp } from '../src/app.js';
import { createPaymentProviderRegistry } from '../src/payments/index.js';

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
          try { parsed = raw ? JSON.parse(raw) : null; } catch { /* leave as raw string */ }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Build a payments-config slice with TBC + BOG disabled (missing keys)
 * and manual enabled. Lets us boot the app in the "no bank creds yet"
 * default state regardless of what's in the dev machine's .env.
 */
function emptyBanksPaymentsCfg() {
  return {
    defaultProvider: 'manual',
    defaultProviderWasAutoPicked: true,
    webhookBaseUrl: 'http://localhost:4000',
    manual: {
      enabled: true,
      missing: [],
      supportedCurrencies: ['GEL', 'USD', 'EUR'],
      instructionsUrl: 'https://example.com/instructions',
    },
    tbc: {
      enabled: false,
      missing: ['TBC_MERCHANT_ID', 'TBC_WEBHOOK_SECRET'],
      supportedCurrencies: ['GEL'],
      apiBase: 'https://api.tbcbank.ge',
      merchantId: '', clientId: '', clientSecret: '', apiKey: '',
      clientCertPem: '', clientKeyPem: '', webhookSecret: '',
    },
    bog: {
      enabled: false,
      missing: ['BOG_CLIENT_ID', 'BOG_CLIENT_SECRET', 'BOG_PUBLIC_KEY_PEM'],
      supportedCurrencies: ['GEL'],
      apiBase: 'https://api.bog.ge',
      clientId: '', clientSecret: '', publicKeyPem: '', webhookSecret: '',
    },
  };
}

test('GET /v1/providers lists disabled banks with their missing env keys', async (t) => {
  const providers = createPaymentProviderRegistry(emptyBanksPaymentsCfg());
  const { app } = buildApp({ providers });
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const res = await jsonRequest(port, 'GET', '/v1/providers');
  assert.equal(res.status, 200);

  const byName = Object.fromEntries(res.body.providers.map((p) => [p.name, p]));
  assert.equal(byName.manual.enabled, true, 'manual should be enabled');
  assert.equal(byName.tbc.enabled, false, 'tbc should be disabled with no env');
  assert.equal(byName.bog.enabled, false, 'bog should be disabled with no env');
  assert.ok(
    byName.tbc.missing.includes('TBC_MERCHANT_ID'),
    'tbc missing list should name TBC_MERCHANT_ID',
  );
  assert.deepEqual(byName.tbc.supportedCurrencies, ['GEL']);
  assert.ok(byName.bog.missing.length >= 1, 'bog should have at least one missing key');
});

test('payment with disabled provider returns 404 + names the missing env keys', async (t) => {
  const providers = createPaymentProviderRegistry(emptyBanksPaymentsCfg());
  const { app } = buildApp({ providers });
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const orderRes = await jsonRequest(port, 'POST', '/v1/orders', {
    currency: 'GEL',
    items: [{ productId: 'p1', title: 'Test', quantity: 1, unitAmountMinor: 10000 }],
  });
  assert.equal(orderRes.status, 201, JSON.stringify(orderRes.body));
  const orderId = orderRes.body.order.id;

  const payRes = await jsonRequest(port, 'POST', '/v1/payments', {
    orderId,
    provider: 'tbc',
    returnUrl: 'https://example.com/return',
  });
  assert.equal(payRes.status, 404);
  assert.equal(payRes.body.error.code, 'not_found');
  assert.match(
    payRes.body.error.message,
    /not configured.*TBC_MERCHANT_ID|TBC_WEBHOOK_SECRET/,
    `error should explain which env vars are missing — got: ${payRes.body.error.message}`,
  );
});

test('payment with unsupported currency for the provider returns 400', async (t) => {
  // Enable a fake "tbc" by giving it a fully populated config slice but
  // a currency allowlist that doesn't include USD; then try to charge USD.
  // Since the actual TBC createCharge throws NotImplemented, we shouldn't
  // get that far — the currency guard must fire first with a 400.
  const cfg = emptyBanksPaymentsCfg();
  cfg.tbc = {
    enabled: true,
    missing: [],
    supportedCurrencies: ['GEL'],
    apiBase: 'https://api.tbcbank.ge',
    merchantId: 'TEST', clientId: 'cid', clientSecret: 'sec', apiKey: '',
    clientCertPem: '', clientKeyPem: '', webhookSecret: 'hook',
  };
  const providers = createPaymentProviderRegistry(cfg);
  const { app } = buildApp({ providers });
  const server = http.createServer(app);
  const port = await listenAsync(server);
  t.after(() => new Promise((r) => server.close(r)));

  const orderRes = await jsonRequest(port, 'POST', '/v1/orders', {
    currency: 'USD',
    items: [{ productId: 'p1', title: 'Test', quantity: 1, unitAmountMinor: 10000 }],
  });
  assert.equal(orderRes.status, 201, JSON.stringify(orderRes.body));
  const orderId = orderRes.body.order.id;

  const payRes = await jsonRequest(port, 'POST', '/v1/payments', {
    orderId,
    provider: 'tbc',
    returnUrl: 'https://example.com/return',
  });
  assert.equal(payRes.status, 400);
  assert.equal(payRes.body.error.code, 'validation_error');
  assert.match(
    payRes.body.error.message,
    /tbc.*USD|does not accept/i,
    `currency error should mention the provider and currency — got: ${payRes.body.error.message}`,
  );
});

test('registry.describe() reports every known provider; get() distinguishes missing vs unknown', () => {
  const reg = createPaymentProviderRegistry(emptyBanksPaymentsCfg());
  const names = reg.describe().map((p) => p.name).sort();
  assert.deepEqual(names, ['bog', 'manual', 'tbc']);

  // Known but disabled — must throw a NotFound naming the env keys.
  assert.throws(
    () => reg.get('tbc'),
    (err) => /not configured/i.test(err.message) && /TBC_/.test(err.message),
  );
  // Truly unknown.
  assert.throws(
    () => reg.get('stripe'),
    (err) => /not registered/i.test(err.message),
  );
});
