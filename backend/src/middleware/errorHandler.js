// Final Express error handler. Every unhandled rejection from controllers
// or domain code lands here. We:
//   • map known AppError instances to their declared status + code,
//   • surface a generic 500 for everything else (full stack stays in logs),
//   • never leak `cause`, stack, or internal messages to the client.

import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const code = isAppError ? err.code : 'internal_error';
  const expose = isAppError ? err.expose : false;

  const log = logger.child({ reqId: req.id, route: req.originalUrl, method: req.method });
  if (status >= 500) {
    log.error({ err, code }, 'request_failed');
  } else {
    log.warn({ msg: err.message, code }, 'request_rejected');
  }

  res.status(status).json({
    error: {
      code,
      message: expose ? err.message : 'Internal server error',
      details: isAppError && expose ? err.details : undefined,
      requestId: req.id,
    },
  });
}
