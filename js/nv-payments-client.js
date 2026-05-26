/**
 * nv-payments-client.js
 *
 * Tiny, additive client for the Ninart Vision payments backend.
 *
 * IMPORTANT: This module is intentionally a NO-OP until you set
 *   window.NV_BACKEND_API_BASE = "https://api.example.com"; (no trailing slash)
 * BEFORE this script runs. The current production site doesn't have a live
 * backend yet — checkout goes through WhatsApp — so leaving NV_BACKEND_API_BASE
 * unset is the safe production default. Once the backend is reachable, set the
 * base URL (e.g. via an inline snippet in <head>) and the helper becomes active.
 *
 * Public API (all methods are async and never throw — they return
 * `{ ok: true, ... }` on success or `{ ok: false, code, message, missing? }`
 * on failure, so callers can render result UI without try/catch):
 *
 *   nvPayments.isConfigured()                                  -> boolean
 *   nvPayments.listProviders()                                 -> { ok, providers, defaultProvider }
 *   nvPayments.initiate({ orderId, provider, returnUrl, ... }) -> { ok, redirectUrl, payment }
 *   nvPayments.refreshStatus(orderId)                          -> { ok, status, payment }
 *
 * Contract notes:
 *  - The helper never reads or writes secrets. It only talks to your backend.
 *  - It never crashes the page; all failures are returned, not thrown.
 *  - It honors a `requestId` from the server and exposes it on the result
 *    so the cart UI can surface a "reference: …" string for support tickets.
 */

(function (global) {
  'use strict';

  var DEFAULT_TIMEOUT_MS = 15000;

  function getBase() {
    var b = global.NV_BACKEND_API_BASE;
    if (typeof b !== 'string' || !b) return '';
    return b.replace(/\/+$/, '');
  }

  function isConfigured() {
    return Boolean(getBase());
  }

  function abortableFetch(url, options, timeoutMs) {
    options = options || {};
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (ctl) options.signal = ctl.signal;
    var timer = setTimeout(function () {
      if (ctl) {
        try { ctl.abort(); } catch (_) {}
      }
    }, timeoutMs || DEFAULT_TIMEOUT_MS);
    return fetch(url, options).finally(function () { clearTimeout(timer); });
  }

  function notConfigured() {
    return {
      ok: false,
      code: 'backend_not_configured',
      message: 'Payments backend is not configured for this build. Set window.NV_BACKEND_API_BASE before this script runs.'
    };
  }

  /**
   * Parse the standardized AppError envelope from the backend.
   * Expected on non-2xx: { error: { code, message, details? }, requestId? }
   */
  function parseError(res, body) {
    var requestId = (body && body.requestId) || res.headers.get('x-request-id') || null;
    var err = (body && body.error) || {};
    return {
      ok: false,
      code: err.code || ('http_' + res.status),
      message: err.message || ('Request failed with status ' + res.status),
      details: err.details || null,
      requestId: requestId,
      status: res.status
    };
  }

  function parseSuccess(res, body) {
    var requestId = (body && body.requestId) || res.headers.get('x-request-id') || null;
    return { ok: true, requestId: requestId, status: res.status, body: body };
  }

  function jsonFetch(path, options) {
    var base = getBase();
    if (!base) return Promise.resolve(notConfigured());

    options = options || {};
    options.headers = Object.assign(
      { 'Accept': 'application/json' },
      options.body ? { 'Content-Type': 'application/json' } : {},
      options.headers || {}
    );
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
    options.credentials = options.credentials || 'omit';

    return abortableFetch(base + path, options)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return res.ok ? parseSuccess(res, body) : parseError(res, body);
        });
      })
      .catch(function (err) {
        // Network / abort / DNS — always surface as a clean rejection
        // object instead of letting it bubble into the caller's UI.
        return {
          ok: false,
          code: err && err.name === 'AbortError' ? 'timeout' : 'network_error',
          message: (err && err.message) || 'Network error reaching payments backend',
          requestId: null
        };
      });
  }

  function listProviders() {
    return jsonFetch('/v1/providers', { method: 'GET' }).then(function (r) {
      if (!r.ok) return r;
      var body = r.body || {};
      return {
        ok: true,
        providers: body.providers || [],
        defaultProvider: body.defaultProvider || null,
        requestId: r.requestId
      };
    });
  }

  /**
   * Initiate a payment. The backend will perform currency validation,
   * select the provider, and return either a hosted-checkout URL
   * (`redirectUrl`) or an inline payment payload — depending on provider.
   *
   * Required fields: orderId, provider.
   * Recommended: returnUrl (e.g. `https://ninartvision.store/pay-status.html?orderId=…`).
   */
  function initiate(input) {
    if (!input || !input.orderId || !input.provider) {
      return Promise.resolve({
        ok: false,
        code: 'validation_error',
        message: 'initiate() requires orderId and provider'
      });
    }
    return jsonFetch('/v1/payments', {
      method: 'POST',
      body: input
    }).then(function (r) {
      if (!r.ok) return r;
      var body = r.body || {};
      return {
        ok: true,
        payment: body.payment || null,
        redirectUrl: body.redirectUrl || null,
        requestId: r.requestId
      };
    });
  }

  function refreshStatus(orderId) {
    if (!orderId) {
      return Promise.resolve({
        ok: false,
        code: 'validation_error',
        message: 'refreshStatus() requires orderId'
      });
    }
    var path = '/v1/payments/' + encodeURIComponent(orderId);
    return jsonFetch(path, { method: 'GET' }).then(function (r) {
      if (!r.ok) return r;
      var body = r.body || {};
      var p = body.payment || {};
      return {
        ok: true,
        status: p.status || 'pending',
        payment: p,
        requestId: r.requestId
      };
    });
  }

  global.nvPayments = {
    isConfigured: isConfigured,
    listProviders: listProviders,
    initiate: initiate,
    refreshStatus: refreshStatus
  };
})(typeof window !== 'undefined' ? window : this);
