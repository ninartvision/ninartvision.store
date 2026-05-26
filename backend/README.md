# Ninart Vision — Backend API

Provider-agnostic order & payment service for `ninartvision.store`. Built so future TBC Bank and Bank of Georgia integrations can be plugged in without rewriting the rest of the backend.

The static storefront under `/` keeps shipping to GitHub Pages — this backend lives in its own workspace and gets deployed independently (Render, Railway, Fly.io, a small VPS — anywhere that runs Node 20+).

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env       # fill in any real values you have
npm run check:env          # print which providers are READY / DISABLED
npm run dev                # http://localhost:4000
npm test                   # node:test smoke suite
```

The server boots with **zero required env vars** — the manual provider works out of the box so frontend / API integration can be tested end-to-end before any bank credentials exist.

Same scripts from the repo root, prefixed with `backend:` —
`npm run backend:install`, `backend:dev`, `backend:check:env`, `backend:test`.

---

## Folder map

```
backend/
├── package.json                 # backend deps only — root package.json is untouched
├── .env.example                 # every supported env var, documented inline
└── src/
    ├── server.js                # process lifecycle: listen, SIGTERM, exception handlers
    ├── app.js                   # buildApp() composition root — used by server.js + tests
    ├── config/                  # validated env loader, the only thing that reads process.env
    ├── lib/                     # logger, AppError hierarchy, asyncHandler, id helpers
    ├── middleware/              # requestId, auth (Firebase), rate limit, raw-body, error handler
    ├── api/v1/                  # HTTP surface (thin controllers + routers)
    │   ├── health.routes.js
    │   ├── orders.{routes,controller}.js
    │   ├── payments.{routes,controller}.js
    │   └── webhooks.{routes,controller}.js
    ├── domain/                  # business logic — no Express, no HTTP, no provider knowledge
    │   ├── orders/
    │   │   ├── order.model.js          # validation + status transitions (pure)
    │   │   ├── order.repository.js     # OrderRepository interface + in-memory impl
    │   │   ├── order.service.js        # orchestrates lifecycle, listens to payment events
    │   │   └── order.types.js
    │   └── payments/
    │       ├── payment.model.js
    │       ├── payment.status.js       # canonical PaymentStatus enum
    │       ├── payment.repository.js
    │       └── payment.service.js      # provider-agnostic façade + EventEmitter
    └── payments/                # PAYMENT INTEGRATIONS — the only place a new bank touches
        ├── index.js                    # provider registry (explicit, no auto-discovery)
        ├── provider.interface.js       # JSDoc-typed contract every provider implements
        ├── utils/
        │   ├── amount.js               # minor-unit ↔ decimal-string helpers
        │   └── signature.js            # HMAC-SHA256 + RSA-SHA256 webhook verification
        └── providers/
            ├── manual.provider.js      # real, working bank-transfer / WhatsApp fallback
            ├── tbc.provider.js         # SCAFFOLD — interface implemented, throws NotImplementedError
            └── bog.provider.js         # SCAFFOLD — same shape, ready for live wiring
```

---

## HTTP surface (v1)

All endpoints return JSON. Errors are uniform:

```json
{ "error": { "code": "validation_error", "message": "…", "requestId": "…", "details": {} } }
```

| Method & path                       | Auth                | What it does                                            |
| ----------------------------------- | ------------------- | ------------------------------------------------------- |
| `GET  /v1/healthz` / `/readyz`      | none                | Liveness / readiness for orchestrators                  |
| `GET  /v1/providers`                | none                | List enabled payment providers                          |
| `POST /v1/orders`                   | optional (guest OK) | Create order from cart                                  |
| `GET  /v1/orders/:id`               | optional            | Fetch one order (owners + guests)                       |
| `GET  /v1/orders/mine`              | **required**        | Authenticated user's order history                      |
| `POST /v1/payments`                 | optional            | Initiate payment; returns `redirectUrl` for hosted flow |
| `GET  /v1/payments/:id`             | optional            | Read stored payment                                     |
| `POST /v1/payments/:id/refresh`     | optional            | Pull live status from provider (fallback if webhook lost) |
| `POST /v1/webhooks/:provider`       | signature           | Inbound bank callbacks (TBC / BOG etc.)                 |

Auth is the same Firebase ID token the storefront already mints via client-side Google sign-in (`auth.js` at the repo root). Send `Authorization: Bearer <idToken>`. When `firebase-admin` isn't installed or `FIREBASE_*` env vars are blank, optional-auth routes silently treat the request as a guest and required-auth routes return 401.

---

## Adding a new payment provider

Everything you need lives in one folder. The HTTP layer, persistence, idempotency, event bus, signature helpers, and rate limits are already done.

### 1. Implement the contract

Drop `src/payments/providers/<name>.provider.js` exporting a function that returns the `PaymentProvider` shape from `provider.interface.js`:

```js
export function createXyzProvider(cfg) {
  return {
    name: 'xyz',
    enabled: cfg.enabled,
    async createCharge({ order, amountMinor, currency, returnUrl, webhookUrl, idempotencyKey, metadata }) {
      // 1. call the bank
      // 2. map the response into:
      return {
        providerRef: '<bank-tx-id>',
        redirectUrl: '<hosted-checkout-url-or-null>',
        status: PaymentStatus.RequiresAction,
        raw: bankResponse,
      };
    },
    async getStatus({ providerRef }) {
      // bank-status → PaymentStatus
    },
    async parseWebhook({ headers, rawBody }) {
      // 1. verify signature using helpers in payments/utils/signature.js
      // 2. parse JSON.parse(rawBody.toString('utf8'))
      // 3. return { providerRef, status, raw }
    },
  };
}
```

Optional methods: `refund({ providerRef, amountMinor? })`, `cancel({ providerRef })`.

### 2. Add config

Append a block to `src/config/index.js` (`buildXyzConfig`) and the matching env keys to `.env.example`. Convention: the provider self-disables when required credentials are blank, so the operator can flip it on later by editing env only.

### 3. Register it

One line in `src/payments/index.js`:

```js
register(createXyzProvider(config.payments.xyz));
```

Done. No HTTP route changes, no controller edits, no schema migration. The frontend selects the new provider with `POST /v1/payments { provider: 'xyz', ... }`, the webhook automatically lives at `POST /v1/webhooks/xyz`.

---

## What's already prepared for TBC / BOG specifically

| Requirement                            | Where it lives                                             | Status                                 |
| -------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Env keys (API base, creds, mTLS, secrets) | `.env.example` + `config/index.js#buildTbcConfig` / `buildBogConfig` | done                                   |
| OAuth / API-key / mTLS auth options       | `cfg.clientId / clientSecret / apiKey / clientCertPem`     | wired through, ready to use            |
| Provider registry slot                    | `payments/index.js`                                        | registered, disabled until creds set   |
| Self-disabling + visible `missing[]`      | `config/index.js` — every provider knows which keys it still needs | done; surfaced in `/v1/providers`     |
| HTTP routes for initiate / webhook        | `/v1/payments`, `/v1/webhooks/:provider`                   | live                                   |
| Idempotency key plumbing                  | `payment.service.js` + `Idempotency-Key` header support    | live                                   |
| Webhook raw-body capture                  | `middleware/rawBody.js`                                    | live, mounted only on webhook paths    |
| TBC HMAC-SHA256 signature verification    | `payments/utils/signature.js#verifyHmacSha256`             | live; the stub calls it before throwing|
| BOG RSA-SHA256 signature verification     | `payments/utils/signature.js#verifyRsaSha256`              | live; the stub calls it before throwing|
| TBC status → canonical mapping            | `tbc.provider.js#mapTbcStatus`                             | done                                   |
| BOG status → canonical mapping            | `bog.provider.js#mapBogStatus`                             | done                                   |
| Per-provider currency allowlist           | `cfg.supportedCurrencies` (default `[GEL]`)                | enforced at `paymentService.initiate()`|
| Separate webhook URL from API URL         | `PAYMENTS_WEBHOOK_BASE_URL`                                | optional; defaults to `PUBLIC_API_URL` |
| Smart default-provider auto-pick          | `config/index.js#pickDefaultProvider`                      | picks `tbc → bog → manual` when unset  |
| Operator preflight                        | `npm run check:env`                                        | done                                   |
| Boot-time readiness banner                | `server.js`                                                | done                                   |
| Domain event bus (order auto-marks paid)  | `payment.service.js#events` → `order.service.js`           | live                                   |

What's intentionally **not** done yet:

- The actual HTTP calls in `tbc.provider.js#createCharge` / `getStatus` and `bog.provider.js#createCharge` / `getStatus`. Each file's top comment explains exactly which endpoint, body, and response fields to map. When merchant credentials arrive, those are the only methods that need code — every surrounding concern is already handled.

---

## When TBC / BOG credentials arrive — runbook

This is the full path from "the bank emailed us keys" to "live in production". No code changes required for steps 1–6 — only env-var edits.

### 1. Paste credentials into your host's secret store

For **TBC** you need three things from your merchant onboarding pack:

```
TBC_MERCHANT_ID=<your merchant id>
TBC_CLIENT_ID=<oauth client id>            # OR TBC_API_KEY=<key> if you got an api-key contract
TBC_CLIENT_SECRET=<oauth secret>           # OR mTLS pair: TBC_CLIENT_CERT_PEM + TBC_CLIENT_KEY_PEM
TBC_WEBHOOK_SECRET=<hmac shared secret>
```

For **BOG** you need:

```
BOG_CLIENT_ID=<basic-auth client id>
BOG_CLIENT_SECRET=<basic-auth secret>
BOG_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n"
```

Most hosts (Render, Fly, Railway) want the PEM as a single-line string with `\n` for newlines.

### 2. Confirm the server now sees them as READY

```bash
npm run check:env
```

Expected output:

```
✓ manual  READY    · currencies: GEL, USD, EUR
✓ tbc     READY    · currencies: GEL
✓ bog     READY    · currencies: GEL
```

If a provider still shows `DISABLED`, the printout names the exact env key(s) that are missing.

### 3. (Optional) Pick a default provider

If you want bank-first checkout without changing the storefront, leave `PAYMENTS_DEFAULT_PROVIDER` blank — the server auto-picks `tbc → bog → manual` based on which are READY. To pin it explicitly:

```
PAYMENTS_DEFAULT_PROVIDER=tbc
```

### 4. Register the webhook URL with each bank

Hand the bank's onboarding portal the URL `${PAYMENTS_WEBHOOK_BASE_URL or PUBLIC_API_URL}/v1/webhooks/<provider>`. For example:

```
https://api.ninartvision.store/v1/webhooks/tbc
https://api.ninartvision.store/v1/webhooks/bog
```

Both banks reject `http://`. Both expect a 200 response with no body content — the server already does that.

### 5. Fill in the two TODOs in each provider file

`src/payments/providers/tbc.provider.js` and `bog.provider.js` each have three methods that throw `NotImplementedError` today: `createCharge`, `getStatus`, `parseWebhook`. The top-of-file comments name the exact endpoint, request body, and response field mappings the bank documents. Implementations are typically 30–60 lines each. Everything around them (auth headers, idempotency, retries, persistence, signature verification, status mapping, event emission) is already in place.

### 6. Verify in the bank's sandbox

```bash
# 6a. Create an order
curl -s -X POST $API/v1/orders -H 'content-type: application/json' \
  -d '{"currency":"GEL","items":[{"productId":"demo","title":"Demo","quantity":1,"unitAmountMinor":10000}]}'

# 6b. Start a TBC payment for it
curl -s -X POST $API/v1/payments -H 'content-type: application/json' \
  -d '{"orderId":"<id>","provider":"tbc","returnUrl":"https://ninartvision.store/sale/shop.html?paid=1"}'

# Response → { payment: { redirectUrl: 'https://...tbc.../checkout/...' } }
# Open it in a browser, complete sandbox payment → webhook fires → order.status moves to "paid".
```

If the webhook doesn't arrive within ~30s, hit `POST /v1/payments/:id/refresh` to pull status directly (this is the production-safe fallback that lets the storefront recover from a missed webhook).

### 7. Flip the storefront over

The frontend reads `GET /v1/providers` and renders a button per enabled provider. No code change needed — once `tbc.enabled = true` in the API response, the TBC button appears.

---

## Production checklist

- [ ] Set `NODE_ENV=production`, `PUBLIC_API_URL=https://api.ninartvision.store`, `WEB_ORIGINS=https://ninartvision.store`.
- [ ] Set `PAYMENTS_WEBHOOK_BASE_URL` if your webhook host differs from the API host (otherwise omit and it falls back to `PUBLIC_API_URL`).
- [ ] Run `npm run check:env` — every provider you intend to use must show `READY`.
- [ ] Configure `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT_JSON` for protected routes.
- [ ] Replace the in-memory repositories with a Postgres-backed implementation (only `order.repository.js` and `payment.repository.js` need new files — interface stays the same).
- [ ] Put the API behind a TLS-terminating reverse proxy; both TBC and BOG refuse `http://` webhook URLs.
- [ ] Swap the in-memory `rateLimit` store for Redis when running multiple replicas.
- [ ] Configure your process supervisor to forward `SIGTERM` — `server.js` does graceful shutdown.
