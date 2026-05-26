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

function buildTbcConfig(env) {
  const clientId = env.TBC_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.TBC_CLIENT_SECRET?.trim() ?? '';
  const apiKey = env.TBC_API_KEY?.trim() ?? '';
  const merchantId = env.TBC_MERCHANT_ID?.trim() ?? '';
  // TBC accepts either OAuth client creds, an API key, or merchant cert auth
  // depending on the contract you signed — we treat any one credential pair
  // as "configured" so the operator only needs whichever applies.
  const hasOAuthCreds = Boolean(clientId && clientSecret);
  const hasApiKey = Boolean(apiKey);
  const hasCertAuth = Boolean(env.TBC_CLIENT_CERT_PEM && env.TBC_CLIENT_KEY_PEM);
  return {
    enabled: Boolean(merchantId && (hasOAuthCreds || hasApiKey || hasCertAuth)),
    apiBase: env.TBC_API_BASE?.trim() || 'https://api.tbcbank.ge',
    merchantId,
    clientId,
    clientSecret,
    apiKey,
    clientCertPem: env.TBC_CLIENT_CERT_PEM || '',
    clientKeyPem: env.TBC_CLIENT_KEY_PEM || '',
    webhookSecret: env.TBC_WEBHOOK_SECRET?.trim() || '',
  };
}

function buildBogConfig(env) {
  const clientId = env.BOG_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.BOG_CLIENT_SECRET?.trim() ?? '';
  return {
    enabled: Boolean(clientId && clientSecret),
    apiBase: env.BOG_API_BASE?.trim() || 'https://api.bog.ge',
    clientId,
    clientSecret,
    publicKeyPem: env.BOG_PUBLIC_KEY_PEM || '',
    webhookSecret: env.BOG_WEBHOOK_SECRET?.trim() || '',
  };
}

function buildManualConfig(env) {
  return {
    enabled: bool(env.MANUAL_PAYMENTS_ENABLED, true),
    instructionsUrl:
      env.MANUAL_PAYMENT_INSTRUCTIONS_URL?.trim() ||
      'https://ninartvision.store/terms.html',
  };
}

function build(env = process.env) {
  const nodeEnv = env.NODE_ENV?.trim() || 'development';

  const firebaseServiceAccount = readFirebaseServiceAccount(env);

  const config = {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: int(env.PORT, 4000),
    logLevel: env.LOG_LEVEL?.trim() || 'info',
    publicApiUrl: env.PUBLIC_API_URL?.trim() || `http://localhost:${int(env.PORT, 4000)}`,
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
      defaultProvider: env.PAYMENTS_DEFAULT_PROVIDER?.trim() || 'manual',
      manual: buildManualConfig(env),
      tbc: buildTbcConfig(env),
      bog: buildBogConfig(env),
    },
  };

  // Sanity check: the default provider must be enabled, otherwise the API
  // will accept orders but every payment will 404. Fail fast and loud here
  // rather than later in production traffic.
  const defaultProviderCfg = config.payments[config.payments.defaultProvider];
  if (!defaultProviderCfg || !defaultProviderCfg.enabled) {
    if (config.isProduction) {
      throw new Error(
        `PAYMENTS_DEFAULT_PROVIDER="${config.payments.defaultProvider}" is not enabled. ` +
          'Either choose a provider whose required env keys are set, or enable the manual provider.',
      );
    }
  }

  return Object.freeze(config);
}

export const config = build();
export { build as _buildConfigForTests };
