// Bank of Georgia payment provider — SCAFFOLD ONLY.
//
// What's done for you:
//   • Module already wired into the registry; HTTP routes, idempotency,
//     event emission, signature helpers and config plumbing are all in
//     place.
//   • Required env keys are documented in backend/.env.example
//     (BOG_API_BASE, BOG_CLIENT_ID, BOG_CLIENT_SECRET, BOG_PUBLIC_KEY_PEM,
//     BOG_WEBHOOK_SECRET). The provider self-disables when they're empty.
//
// What you need to do when you receive merchant credentials:
//
//   1. createCharge:
//        a) Get an access token: POST {apiBase}/auth/v1/token
//           with `Authorization: Basic <base64(client_id:client_secret)>`
//           and `grant_type=client_credentials`. Cache it for ~1 hour.
//        b) POST {apiBase}/payments/v1/ecommerce/orders
//           Body: { purchase_units: [{ amount: { currency_code, value }}],
//                   redirect_urls: { success, fail },
//                   external_order_id: input.idempotencyKey,
//                   capture: 'automatic' }
//           Response:
//             id  → providerRef
//             _links.redirect.href → redirectUrl
//             status → mapBogStatus(...)
//
//   2. getStatus:
//        GET {apiBase}/payments/v1/receipt/{providerRef}
//        Map order_status.key through mapBogStatus.
//
//   3. parseWebhook:
//        BOG signs callbacks with `Callback-Signature` (RSA-SHA256, base64)
//        over the raw body, verified against the published public key in
//        cfg.publicKeyPem. Use `verifyRsaSha256(...)`.
//        Body shape: { event, body: { order_id, order_status, ... } } —
//        map to ParseWebhookResult below.

import { NotImplementedError } from '../../lib/errors.js';
import { PaymentStatus } from '../../domain/payments/payment.status.js';
import { verifyRsaSha256 } from '../utils/signature.js';

/**
 * @param {string} bogStatus
 * @returns {import('../../domain/payments/payment.status.js').PaymentStatusValue}
 */
export function mapBogStatus(bogStatus) {
  switch ((bogStatus || '').toLowerCase()) {
    case 'created':
    case 'pending':
      return PaymentStatus.RequiresAction;
    case 'in_progress':
    case 'processing':
    case 'waiting':
      return PaymentStatus.Processing;
    case 'completed':
    case 'paid':
    case 'success':
      return PaymentStatus.Succeeded;
    case 'rejected':
    case 'failed':
    case 'error':
      return PaymentStatus.Failed;
    case 'cancelled':
    case 'canceled':
    case 'expired':
      return PaymentStatus.Cancelled;
    case 'refunded':
    case 'partial_refunded':
      return PaymentStatus.Refunded;
    default:
      return PaymentStatus.Processing;
  }
}

/**
 * @param {ReturnType<typeof import('../../config/index.js').config.payments.bog>} cfg
 * @returns {import('../provider.interface.js').PaymentProvider}
 */
export function createBogProvider(cfg) {
  return {
    name: 'bog',
    enabled: cfg.enabled,

    async createCharge(_input) {
      throw new NotImplementedError(
        'BOG createCharge is not implemented yet. ' +
          'Wire it up against /payments/v1/ecommerce/orders — see this file\'s top comment.',
      );
    },

    async getStatus(_input) {
      throw new NotImplementedError(
        'BOG getStatus is not implemented yet. Call GET /payments/v1/receipt/{providerRef} and map via mapBogStatus().',
      );
    },

    async parseWebhook({ headers, rawBody }) {
      const sigHeader = headers['callback-signature'] ?? headers['x-bog-signature'];
      const provided = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
      verifyRsaSha256({
        rawBody,
        publicKeyPem: cfg.publicKeyPem,
        providedSignatureBase64: provided || '',
      });

      throw new NotImplementedError(
        'BOG parseWebhook is not implemented yet. Parse the verified JSON body and map the status via mapBogStatus().',
      );
    },
  };
}
