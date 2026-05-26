// Centralised, validated config. Reading `process.env` directly anywhere
// else in the codebase is a smell — import from here instead so we get
// one obvious place to evolve env contracts, defaulting and validation.
//
// Design rules:
//   • Missing optional keys disable a feature, they never crash boot.
//   • Required keys (e.g. PORT) have safe defaults so dev/CI is friction-free.
//   • Per-provider config is grouped so the provider modules can ask for
//     `config.payments.tbc` and self-disable if `enabled` is false.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function bool(value, fallback = false) {
  if (value == null) return fallback;
  const v = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function csv(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Returns the JSON content of a Firebase service account if either
 * FIREBASE_SERVICE_ACCOUNT_JSON (inline) or FIREBASE_SERVICE_ACCOUNT_PATH
 * (file path) is provided. Otherwise returns null so the auth middleware
 * gracefully no-ops.
 */
function readFirebaseServiceAccount(env) {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    try {
      return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. ' +
          'Paste the whole service-account file as a single-line string.',
      );
    }
  }
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) {
    const abs = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(__dirname, '../..', env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(abs)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH points to a file that does not exist: ${abs}`);
    }
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  }
  return null;
}

// Per-provider config builders. Each one returns:
//   {
//     enabled,                // boolean — registry refuses to register when false
//     missing: string[],      // env keys the operator still needs to fill in
//     supportedCurrencies,    // ISO-4217 allowlist; payment.service rejects others
//     ...providerSpecificCfg,
//   }
// `missing` is the single field the rest of the system uses to render a
// "TBC is not yet configured — set TBC_MERCHANT_ID, TBC_WEBHOOK_SECRET"
// message to operators. Keep keys here in sync with .env.example.

function buildTbcConfig(env) {
  const clientId = env.TBC_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.TBC_CLIENT_SECRET?.trim() ?? '';
  const apiKey = env.TBC_API_KEY?.trim() ?? '';
  const merchantId = env.TBC_MERCHANT_ID?.trim() ?? '';
  const webhookSecret = env.TBC_WEBHOOK_SECRET?.trim() ?? '';
  // TBC accepts either OAuth client creds, an API key, or merchant cert auth
  // depending on the contract you signed — we treat any one credential pair
  // as "configured" so the operator only needs whichever applies.
  const hasOAuthCreds = Boolean(clientId && clientSecret);
  const hasApiKey = Boolean(apiKey);
  const hasCertAuth = Boolean(env.TBC_CLIENT_CERT_PEM && env.TBC_CLIENT_KEY_PEM);

  /** @type {string[]} */
  const missing = [];
  if (!merchantId) missing.push('TBC_MERCHANT_ID');
  if (!hasOAuthCreds && !hasApiKey && !hasCertAuth) {
    missing.push('TBC_CLIENT_ID+TBC_CLIENT_SECRET or TBC_API_KEY or TBC_CLIENT_CERT_PEM+TBC_CLIENT_KEY_PEM');
  }
  if (!webhookSecret) missing.push('TBC_WEBHOOK_SECRET');

  return {
    enabled: missing.length === 0,
    missing,
    // TBC's e-commerce gateway primarily processes GEL; USD/EUR contracts
    // are signed per-merchant. Override via TBC_SUPPORTED_CURRENCIES when
    // your contract permits.
    supportedCurrencies: csv(env.TBC_SUPPORTED_CURRENCIES, ['GEL']),
    apiBase: env.TBC_API_BASE?.trim() || 'https://api.tbcbank.ge',
    merchantId,
    clientId,
    clientSecret,
    apiKey,
    clientCertPem: env.TBC_CLIENT_CERT_PEM || '',
    clientKeyPem: env.TBC_CLIENT_KEY_PEM || '',
    webhookSecret,
  };
}

function buildBogConfig(env) {
  const clientId = env.BOG_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.BOG_CLIENT_SECRET?.trim() ?? '';
  const publicKeyPem = env.BOG_PUBLIC_KEY_PEM ?? '';

  /** @type {string[]} */
  const missing = [];
  if (!clientId) missing.push('BOG_CLIENT_ID');
  if (!clientSecret) missing.push('BOG_CLIENT_SECRET');
  // BOG signs callbacks with RSA — we can't accept their webhooks without
  // their published public key, so treat its absence as "not ready".
  if (!publicKeyPem) missing.push('BOG_PUBLIC_KEY_PEM');

  return {
    enabled: missing.length === 0,
    missing,
    supportedCurrencies: csv(env.BOG_SUPPORTED_CURRENCIES, ['GEL']),
    apiBase: env.BOG_API_BASE?.trim() || 'https://api.bog.ge',
    clientId,
    clientSecret,
    publicKeyPem,
    webhookSecret: env.BOG_WEBHOOK_SECRET?.trim() || '',
  };
}

function buildManualConfig(env) {
  const enabled = bool(env.MANUAL_PAYMENTS_ENABLED, true);
  return {
    enabled,
    missing: enabled ? [] : ['MANUAL_PAYMENTS_ENABLED=true'],
    supportedCurrencies: csv(env.MANUAL_SUPPORTED_CURRENCIES, ['GEL', 'USD', 'EUR']),
    instructionsUrl:
      env.MANUAL_PAYMENT_INSTRUCTIONS_URL?.trim() ||
      'https://ninartvision.store/terms.html',
  };
}

/**
 * Pick a sensible default provider when PAYMENTS_DEFAULT_PROVIDER is unset.
 * Prefers explicit operator intent, then any enabled bank provider, then
 * manual. This keeps "drop in TBC env vars and restart" a single-step
 * deploy without touching PAYMENTS_DEFAULT_PROVIDER.
 *
 * @param {string|undefined} explicit
 * @param {Record<string, { enabled: boolean }>} catalog
 * @returns {string}
 */
function pickDefaultProvider(explicit, catalog) {
  if (explicit) return explicit;
  // Preference order: tbc → bog → manual. Banks take priority because
  // once they're wired up they're almost certainly what the operator
  // wants to charge with.
  for (const candidate of ['tbc', 'bog', 'manual']) {
    if (catalog[candidate]?.enabled) return candidate;
  }
  return 'manual';
}

function build(env = process.env) {
  const nodeEnv = env.NODE_ENV?.trim() || 'development';

  const firebaseServiceAccount = readFirebaseServiceAccount(env);

  const port = int(env.PORT, 4000);
  const publicApiUrl = env.PUBLIC_API_URL?.trim() || `http://localhost:${port}`;
  // Webhook URL the banks call back to. Defaults to publicApiUrl, but the
  // operator can override it independently — useful when webhooks are
  // proxied through a different host (e.g. a stable CDN-edge URL) than
  // the API serves traffic on.
  const webhookBaseUrl = env.PAYMENTS_WEBHOOK_BASE_URL?.trim() || publicApiUrl;

  const manual = buildManualConfig(env);
  const tbc = buildTbcConfig(env);
  const bog = buildBogConfig(env);
  const explicitDefault = env.PAYMENTS_DEFAULT_PROVIDER?.trim() || '';
  const defaultProvider = pickDefaultProvider(explicitDefault, { manual, tbc, bog });

  const config = {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port,
    logLevel: env.LOG_LEVEL?.trim() || 'info',
    publicApiUrl,
    webOrigins: csv(env.WEB_ORIGINS, ['http://localhost:5173']),

    rateLimit: {
      windowMs: int(env.RATE_LIMIT_WINDOW_MS, 60_000),
      max: int(env.RATE_LIMIT_MAX, 120),
    },

    auth: {
      firebase: {
        // `enabled` is what the rest of the code checks. The service account
        // JSON itself is kept inside auth/middleware boundaries so it never
        // leaks into logs or response bodies.
        enabled: Boolean(firebaseServiceAccount && (env.FIREBASE_PROJECT_ID || firebaseServiceAccount.project_id)),
        projectId: env.FIREBASE_PROJECT_ID?.trim() || firebaseServiceAccount?.project_id || '',
        serviceAccount: firebaseServiceAccount,
      },
    },

    payments: {
      defaultProvider,
      defaultProviderWasAutoPicked: !explicitDefault,
      webhookBaseUrl,
      manual,
      tbc,
      bog,
    },
  };

  // Sanity check: the default provider must be enabled, otherwise the API
  // will accept orders but every payment will 404. Fail fast and loud in
  // production; in dev/CI we tolerate it so contributors can boot the
  // server before they've populated any payment env vars.
  const defaultProviderCfg = config.payments[config.payments.defaultProvider];
  if (!defaultProviderCfg || !defaultProviderCfg.enabled) {
    if (config.isProduction) {
      throw new Error(
        `PAYMENTS_DEFAULT_PROVIDER="${config.payments.defaultProvider}" is not enabled. ` +
          'Either choose a provider whose required env keys are set, or enable the manual provider.',
      );
    }
  }
  // Explicit-but-unknown is always a fatal misconfiguration.
  if (explicitDefault && !['manual', 'tbc', 'bog'].includes(explicitDefault)) {
    throw new Error(
      `PAYMENTS_DEFAULT_PROVIDER="${explicitDefault}" is not a recognised provider. ` +
        'Valid values: manual | tbc | bog.',
    );
  }

  return Object.freeze(config);
}

/**
 * Public, side-effect-free readiness snapshot — used by /v1/providers,
 * the startup banner and `npm run check:env` to render the same data
 * without booting Express.
 *
 * @param {ReturnType<typeof build>} [cfg]
 * @returns {{
 *   defaultProvider: string,
 *   defaultProviderWasAutoPicked: boolean,
 *   webhookBaseUrl: string,
 *   providers: Array<{
 *     name: string,
 *     enabled: boolean,
 *     missing: string[],
 *     supportedCurrencies: string[],
 *   }>,
 * }}
 */
export function describePaymentsReadiness(cfg = config) {
  const snapshot = (name) => {
    const c = cfg.payments[name];
    return {
      name,
      enabled: Boolean(c?.enabled),
      missing: c?.missing ?? [],
      supportedCurrencies: c?.supportedCurrencies ?? [],
    };
  };
  return {
    defaultProvider: cfg.payments.defaultProvider,
    defaultProviderWasAutoPicked: cfg.payments.defaultProviderWasAutoPicked,
    webhookBaseUrl: cfg.payments.webhookBaseUrl,
    providers: ['manual', 'tbc', 'bog'].map(snapshot),
  };
}

export const config = build();
export { build as _buildConfigForTests };
