// Process entrypoint. Owns the listen()/SIGTERM lifecycle and nothing
// else — everything else is constructed by buildApp(). This split means
// the test suite can spin up the same app graph without binding a port.

import http from 'node:http';
import { buildApp } from './app.js';
import { config, describePaymentsReadiness } from './config/index.js';
import { logger } from './lib/logger.js';

const { app, providers } = buildApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      publicApiUrl: config.publicApiUrl,
      webhookBaseUrl: config.payments.webhookBaseUrl,
    },
    'server_listening',
  );

  // Operator-facing summary: which providers are live, which are still
  // waiting on env vars, and which env vars are missing. Printed every
  // boot so it's the first thing you see in CI / docker logs after a
  // deploy. The structured `providers` field stays log-aggregator
  // friendly while the per-line text version is human-friendly.
  const readiness = describePaymentsReadiness(config);
  logger.info(
    {
      defaultProvider: readiness.defaultProvider,
      defaultProviderWasAutoPicked: readiness.defaultProviderWasAutoPicked,
      providers: readiness.providers,
    },
    'payment_providers_status',
  );
  for (const p of readiness.providers) {
    if (p.enabled) {
      logger.info(`  ✓ ${p.name.padEnd(8)} ready · currencies=${p.supportedCurrencies.join(',')}`);
    } else {
      logger.warn(
        `  ✗ ${p.name.padEnd(8)} disabled · set ${p.missing.join(', ') || '(unknown)'} to enable`,
      );
    }
  }
  // Cross-check that the live registry matches the config snapshot, in
  // case a future refactor introduces a divergence.
  const liveNames = providers.list().map((p) => p.name);
  logger.info({ activeProviders: liveNames }, 'payment_providers_registered');
});

function shutdown(signal) {
  logger.info({ signal }, 'shutdown_requested');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'shutdown_error');
      process.exit(1);
    }
    logger.info('shutdown_complete');
    process.exit(0);
  });
  // Failsafe — force-exit if close() hangs for any reason.
  setTimeout(() => {
    logger.warn('shutdown_forced');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandled_rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught_exception');
  // Re-throw to terminate — process supervisor (PM2, Docker, systemd…)
  // will restart us with a clean slate.
  setTimeout(() => process.exit(1), 100).unref();
});
