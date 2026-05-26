// Mounts the v1 API surface. Bumping to /v2 later means adding a
// sibling file — clients keep working until they opt in.

import { Router } from 'express';
import { createHealthRouter } from './health.routes.js';
import { createOrdersRouter } from './orders.routes.js';
import { createOrdersController } from './orders.controller.js';
import { createPaymentsRouter } from './payments.routes.js';
import { createPaymentsController } from './payments.controller.js';
import { createWebhooksRouter } from './webhooks.routes.js';
import { createWebhooksController } from './webhooks.controller.js';

/**
 * @param {{
 *   orderService: ReturnType<typeof import('../../domain/orders/order.service.js').createOrderService>,
 *   paymentService: ReturnType<typeof import('../../domain/payments/payment.service.js').createPaymentService>,
 *   providers: import('../../payments/index.js').PaymentProviderRegistry,
 * }} deps
 */
export function createV1Router({ orderService, paymentService, providers }) {
  const router = Router();

  const ordersController = createOrdersController({ orderService });
  const paymentsController = createPaymentsController({ paymentService });
  const webhooksController = createWebhooksController({ paymentService, providers });

  router.use('/', createHealthRouter());
  router.use('/orders', createOrdersRouter({ ordersController }));
  router.use('/payments', createPaymentsRouter({ paymentsController }));
  router.use('/webhooks', createWebhooksRouter({ webhooksController }));

  router.get('/providers', (_req, res) => {
    res.json({
      providers: providers.list().map((p) => ({ name: p.name, enabled: p.enabled })),
    });
  });

  return router;
}
