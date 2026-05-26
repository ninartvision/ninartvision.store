// Payments controller. The frontend POSTs here to start a checkout —
// the response carries the `redirectUrl` the browser should send the
// user to (for hosted-checkout providers like TBC / BOG). Polling and
// status reads are exposed too so the storefront can show a live state
// on the "thank you" page until the webhook lands.

import { asyncHandler } from '../../lib/asyncHandler.js';
import { ValidationError } from '../../lib/errors.js';

/**
 * @param {{ paymentService: ReturnType<typeof import('../../domain/payments/payment.service.js').createPaymentService> }} deps
 */
export function createPaymentsController({ paymentService }) {
  return {
    initiate: asyncHandler(async (req, res) => {
      const { orderId, provider, returnUrl, metadata } = req.body ?? {};
      const idempotencyKey = req.get('idempotency-key') || req.body?.idempotencyKey;
      if (!orderId) throw new ValidationError('orderId is required');
      if (!returnUrl) throw new ValidationError('returnUrl is required');

      const payment = await paymentService.initiate({
        orderId,
        provider,
        returnUrl,
        idempotencyKey,
        metadata,
      });

      res.status(201).json({
        payment: {
          id: payment.id,
          status: payment.status,
          provider: payment.provider,
          redirectUrl: payment.redirectUrl,
          orderId: payment.orderId,
        },
      });
    }),

    getById: asyncHandler(async (req, res) => {
      const payment = await paymentService.getById(req.params.id);
      res.json({ payment });
    }),

    refresh: asyncHandler(async (req, res) => {
      const payment = await paymentService.syncFromProvider(req.params.id);
      res.json({ payment });
    }),
  };
}
