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

  // Provider directory. Lists every known provider (manual / tbc / bog),
  // whether it's currently configured, what env keys are still missing,
  // and which currencies it accepts. The storefront uses this to decide
  // which payment buttons to render. Operators can curl it to confirm
  // "TBC is ready" once they paste credentials in.
  router.get('/providers', (_req, res) => {
    res.json({
      providers: providers.describe(),
    });
  });

  return router;
}
