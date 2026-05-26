# Ninart Vision — Backend API

Provider-agnostic order & payment service for `ninartvision.store`. Built so future TBC Bank and Bank of Georgia integrations can be plugged in without rewriting the rest of the backend.

The static storefront under `/` keeps shipping to GitHub Pages — this backend lives in its own workspace and gets deployed independently (Render, Railway, Fly.io, a small VPS — anywhere that runs Node 20+).

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env       # fill in any real values you have
npm run dev                # http://localhost:4000
npm test                   # node:test smoke suite
```

The server boots with **zero required env vars** — the manual provider works out of the box so frontend / API integration can be tested end-to-end before any bank credentials exist.

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
| HTTP routes for initiate / webhook        | `/v1/payments`, `/v1/webhooks/:provider`                   | live                                   |
| Idempotency key plumbing                  | `payment.service.js` + `Idempotency-Key` header support    | live                                   |
| Webhook raw-body capture                  | `middleware/rawBody.js`                                    | live, mounted only on webhook paths    |
| TBC HMAC-SHA256 signature verification    | `payments/utils/signature.js#verifyHmacSha256`             | live; the stub calls it before throwing|
| BOG RSA-SHA256 signature verification     | `payments/utils/signature.js#verifyRsaSha256`              | live; the stub calls it before throwing|
| TBC status → canonical mapping            | `tbc.provider.js#mapTbcStatus`                             | done                                   |
| BOG status → canonical mapping            | `bog.provider.js#mapBogStatus`                             | done                                   |
| Domain event bus (order auto-marks paid)  | `payment.service.js#events` → `order.service.js`           | live                                   |

What's intentionally **not** done yet:

- The actual HTTP calls in `tbc.provider.js#createCharge` / `getStatus` and `bog.provider.js#createCharge` / `getStatus`. Each file's top comment explains exactly which endpoint, body, and response fields to map. When merchant credentials arrive, those are the only methods that need code — every surrounding concern is already handled.

---

## Production checklist

- [ ] Set `NODE_ENV=production`, `PUBLIC_API_URL=https://api.ninartvision.store`, `WEB_ORIGINS=https://ninartvision.store`.
- [ ] Configure `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT_JSON` for protected routes.
- [ ] Replace the in-memory repositories with a Postgres-backed implementation (only `order.repository.js` and `payment.repository.js` need new files — interface stays the same).
- [ ] Put the API behind a TLS-terminating reverse proxy; both TBC and BOG refuse `http://` webhook URLs.
- [ ] Swap the in-memory `rateLimit` store for Redis when running multiple replicas.
- [ ] Configure your process supervisor to forward `SIGTERM` — `server.js` does graceful shutdown.
