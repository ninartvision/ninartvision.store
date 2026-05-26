// Generic webhook controller. The bank-specific knowledge lives in each
// provider's `parseWebhook` method — this controller's only job is to
// route the inbound HTTP request to the right provider, persist the
// resulting status update, and respond with the shape the bank expects.

import { asyncHandler } from '../../lib/asyncHandler.js';
import { logger } from '../../lib/logger.js';

/**
 * @param {{
 *   paymentService: ReturnType<typeof import('../../domain/payments/payment.service.js').createPaymentService>,
 *   providers: import('../../payments/index.js').PaymentProviderRegistry,
 * }} deps
 */
export function createWebhooksController({ paymentService, providers }) {
  return {
    receive: asyncHandler(async (req, res) => {
      const providerName = req.params.provider;
      const provider = providers.get(providerName); // throws 404 for unknown providers
      const rawBody = req.rawBody ?? Buffer.from('');

      const parsed = await provider.parseWebhook({
        headers: req.headers,
        rawBody,
      });

      const updated = await paymentService.applyProviderUpdate(parsed.providerRef, parsed);

      logger.info(
        {
          provider: providerName,
          paymentId: updated.id,
          orderId: updated.orderId,
          status: updated.status,
        },
        'webhook_processed',
      );

      // Most gateways are happy with a 200 + empty body. Override per
      // provider if a different ack shape is required.
      res.status(200).json({ received: true });
    }),
  };
}
