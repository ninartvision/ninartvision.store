#!/usr/bin/env node
//
// Preflight: prints which payment providers will be enabled given the
// current .env, without booting the server or making any network calls.
// Intended use: deployment runbook — after pasting fresh TBC / BOG
// credentials into the host's secret store, run
//
//     npm run --prefix backend check:env
//
// and confirm the provider you intended to enable now shows ✓ READY.
//
// Exit code:
//   0 — every provider is in the state you'd expect (manual on, banks may
//       be enabled or disabled depending on whether keys are set)
//   1 — the configured default provider can't be served (would 5xx in prod)
//
// This script must stay side-effect-free; it's safe to run in CI as a
// gate without leaking secrets into logs (it prints var NAMES only).

import process from 'node:process';
import { config, describePaymentsReadiness } from '../src/config/index.js';

const readiness = describePaymentsReadiness(config);

const sep = '─'.repeat(64);
const lines = [];
lines.push(sep);
lines.push(' Ninart Vision · backend payment readiness');
lines.push(sep);
lines.push(`  Node env             : ${config.nodeEnv}`);
lines.push(`  Public API URL       : ${config.publicApiUrl}`);
lines.push(`  Webhook callback URL : ${readiness.webhookBaseUrl}/v1/webhooks/{provider}`);
lines.push(`  Default provider     : ${readiness.defaultProvider}`
  + (readiness.defaultProviderWasAutoPicked ? '  (auto-picked)' : '  (PAYMENTS_DEFAULT_PROVIDER)'));
lines.push(sep);
for (const p of readiness.providers) {
  if (p.enabled) {
    lines.push(`  ✓ ${p.name.padEnd(8)} READY    · currencies: ${p.supportedCurrencies.join(', ')}`);
  } else {
    lines.push(`  ✗ ${p.name.padEnd(8)} DISABLED · missing:    ${p.missing.join(', ') || '(unknown)'}`);
  }
}
lines.push(sep);

const defaultCfg = readiness.providers.find((p) => p.name === readiness.defaultProvider);
const defaultOk = Boolean(defaultCfg?.enabled);
if (!defaultOk) {
  lines.push(`  ! Default provider "${readiness.defaultProvider}" is not enabled.`);
  lines.push('    Either set the missing env vars listed above, or change');
  lines.push('    PAYMENTS_DEFAULT_PROVIDER to a provider that is ready.');
  lines.push(sep);
}

// `process.stdout.write` (not console.log) so output stays single-block
// when piped into deployment dashboards.
process.stdout.write(lines.join('\n') + '\n');
process.exit(defaultOk ? 0 : 1);
