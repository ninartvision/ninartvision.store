// Process entrypoint. Owns the listen()/SIGTERM lifecycle and nothing
// else — everything else is constructed by buildApp(). This split means
// the test suite can spin up the same app graph without binding a port.

import http from 'node:http';
import { buildApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';

const { app } = buildApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      publicApiUrl: config.publicApiUrl,
    },
    'server_listening',
  );
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
