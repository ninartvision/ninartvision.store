// Single logger instance used everywhere. Centralised so log format,
// redaction rules, and transport can be evolved in one place.
//
// `pino` was picked because it's the de-facto Node logger (low overhead,
// JSON-by-default), but the rest of the codebase only depends on the
// `{ debug, info, warn, error, child }` shape — so swapping in winston
// or a vendor SDK is a one-file change.

import pino from 'pino';
import { config } from '../config/index.js';

const isPretty = !config.isProduction;

export const logger = pino({
  level: config.logLevel,
  base: { service: 'ninartvision-api', env: config.nodeEnv },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      '*.clientSecret',
      '*.apiKey',
      '*.webhookSecret',
      '*.serviceAccount',
    ],
    censor: '[redacted]',
  },
  transport: isPretty
    ? {
        target: 'pino/file',
        options: { destination: 1 },
      }
    : undefined,
});
