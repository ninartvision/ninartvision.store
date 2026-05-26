import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { config } from '../../config/index.js';

/** @param {{ paymentsController: ReturnType<typeof import('./payments.controller.js').createPaymentsController> }} deps */
export function createPaymentsRouter({ paymentsController }) {
  const router = Router();

  // Initiating a payment is the most abuse-prone endpoint — rate limit
  // it tighter than the rest, on top of the global limiter.
  router.post(
    '/',
    rateLimit({ windowMs: 60_000, max: Math.max(10, Math.floor(config.rateLimit.max / 4)) }),
    authenticate({ required: false }),
    paymentsController.initiate,
  );

  router.get('/:id', authenticate({ required: false }), paymentsController.getById);
  router.post('/:id/refresh', authenticate({ required: false }), paymentsController.refresh);

  return router;
}
