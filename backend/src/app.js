// Builds the Express app and its dependency graph. Exported as a pure
// factory (no listen()) so tests can boot a fresh instance per spec
// without port conflicts. `server.js` is the only thing that calls
// `.listen()`.
//
// Composition pattern: every collaborator is built once, here, and
// passed down explicitly. No file imports a singleton — that's what
// keeps the system testable and the dependency graph easy to reason
// about as it grows.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { rateLimit } from './middleware/rateLimit.js';
import { createV1Router } from './api/v1/index.js';

import { createInMemoryOrderRepository } from './domain/orders/order.repository.js';
import { createOrderService } from './domain/orders/order.service.js';
import { createInMemoryPaymentRepository } from './domain/payments/payment.repository.js';
import { createPaymentService } from './domain/payments/payment.service.js';
import { createPaymentProviderRegistry } from './payments/index.js';

/**
 * Build an Express app along with the domain graph it serves.
 * `overrides` lets tests swap in fakes — pass nothing in production.
 *
 * @param {{
 *   orderRepository?: import('./domain/orders/order.repository.js').OrderRepository,
 *   paymentRepository?: import('./domain/payments/payment.repository.js').PaymentRepository,
 *   providers?: import('./payments/index.js').PaymentProviderRegistry,
 * }} [overrides]
 */
export function buildApp(overrides = {}) {
  const orderRepository = overrides.orderRepository ?? createInMemoryOrderRepository();
  const paymentRepository = overrides.paymentRepository ?? createInMemoryPaymentRepository();
  const providers = overrides.providers ?? createPaymentProviderRegistry(config.payments);

  const paymentService = createPaymentService({
    payments: paymentRepository,
    orders: orderRepository,
    providers,
    defaultProvider: config.payments.defaultProvider,
    webhookBaseUrl: config.payments.webhookBaseUrl,
    logger,
  });

  const orderService = createOrderService({
    repository: orderRepository,
    paymentEvents: paymentService.events,
    logger,
  });

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.isProduction ? 1 : false);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ reqId: req.id }),
      // Webhook bodies can be noisy and may contain payment data; keep
      // the log at "info" level but redact bodies entirely.
      serializers: { req: (req) => ({ id: req.id, method: req.method, url: req.url }) },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // curl / server-to-server
        if (config.webOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: false,
      maxAge: 86_400,
    }),
  );

  // Global JSON parser for non-webhook routes. Webhook routes mount their
  // own raw-body parser that preserves the exact bytes the bank sent.
  app.use((req, res, next) => {
    if (req.path.startsWith('/v1/webhooks/')) return next();
    return express.json({ limit: '1mb' })(req, res, next);
  });

  app.use(rateLimit(config.rateLimit));

  app.use('/v1', createV1Router({ orderService, paymentService, providers }));

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'not_found', message: `Route ${req.method} ${req.originalUrl} not found`, requestId: req.id },
    });
  });

  app.use(errorHandler);

  return { app, orderService, paymentService, providers };
}
