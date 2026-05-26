import { Router } from 'express';
import { rawJsonBody } from '../../middleware/rawBody.js';

/** @param {{ webhooksController: ReturnType<typeof import('./webhooks.controller.js').createWebhooksController> }} deps */
export function createWebhooksRouter({ webhooksController }) {
  const router = Router();

  // Webhook routes use raw-body capture so HMAC signatures verify
  // against the exact bytes the bank sent. The global JSON parser is
  // NOT applied here — provider.parseWebhook is responsible for
  // interpreting the body (after signature check).
  router.post('/:provider', rawJsonBody({ limit: '256kb' }), webhooksController.receive);

  return router;
}
