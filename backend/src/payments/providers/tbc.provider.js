// TBC Bank payment provider — SCAFFOLD ONLY.
//
// What's done for you:
//   • Module already wired into the registry; the HTTP routes, idempotency,
//     event emission, webhook signature verification helpers, and config
//     plumbing are all production-ready.
//   • Required env keys are documented in backend/.env.example
//     (TBC_API_BASE, TBC_MERCHANT_ID, TBC_CLIENT_ID, TBC_CLIENT_SECRET,
//     TBC_API_KEY, TBC_CLIENT_CERT_PEM, TBC_CLIENT_KEY_PEM,
//     TBC_WEBHOOK_SECRET). The provider self-disables when they're empty.
//
// What you need to do when you receive merchant credentials:
//
//   1. createCharge:
//        POST {apiBase}/v1/tpay/payments
//        Auth depends on contract — OAuth2 client_credentials, an API key,
//        or mTLS. Pick the right branch in `authHeaders()` below.
//        Body fields TBC expects (current docs):
//          - amount: { currency, total }       // total as decimal string
//          - returnurl
//          - extra: idempotencyKey / merchantPaymentId
//          - callbackUrl                       // pass `input.webhookUrl`
//        Map TBC's response:
//          payId  → providerRef
//          links.find(rel==='approval').uri → redirectUrl
//          status → PaymentStatus (see mapTbcStatus below)
//
//   2. getStatus:
//        GET {apiBase}/v1/tpay/payments/{providerRef}
//        Map `status` through the same mapTbcStatus helper.
//
//   3. parseWebhook:
//        TBC signs callbacks with `Signature: hmac-sha256=<hex>` over the
//        raw request body. Use `verifyHmacSha256({...})` (already
//        imported) with `secret = cfg.webhookSecret`.
//        Body shape: { payId, status, amount, ... } — map to the
//        ParseWebhookResult shape below.
//
//   4. refund / cancel: optional. Add when the business needs them.

import { NotImplementedError } from '../../lib/errors.js';
import { PaymentStatus } from '../../domain/payments/payment.status.js';
import { verifyHmacSha256 } from '../utils/signature.js';

/**
 * Map TBC's status strings to our canonical PaymentStatus. The keys here
 * are pulled straight from TBC's docs — adjust them when their schema
 * changes; the rest of the codebase doesn't care about the mapping
 * because everything else only sees the canonical enum.
 *
 * @param {string} tbcStatus
 * @returns {import('../../domain/payments/payment.status.js').PaymentStatusValue}
 */
export function mapTbcStatus(tbcStatus) {
  switch ((tbcStatus || '').toLowerCase()) {
    case 'created':
    case 'pending':
      return PaymentStatus.RequiresAction;
    case 'in_progress':
    case 'processing':
      return PaymentStatus.Processing;
    case 'succeeded':
    case 'success':
    case 'completed':
    case 'captured':
      return PaymentStatus.Succeeded;
    case 'failed':
    case 'rejected':
    case 'error':
      return PaymentStatus.Failed;
    case 'cancelled':
    case 'canceled':
    case 'expired':
      return PaymentStatus.Cancelled;
    case 'refunded':
      return PaymentStatus.Refunded;
    default:
      return PaymentStatus.Processing;
  }
}

/**
 * @param {ReturnType<typeof import('../../config/index.js').config.payments.tbc>} cfg
 * @returns {import('../provider.interface.js').PaymentProvider}
 */
export function createTbcProvider(cfg) {
  return {
    name: 'tbc',
    enabled: cfg.enabled,

    async createCharge(_input) {
      // TODO(tbc): translate `_input` into TBC's /v1/tpay/payments request
      // body, call the gateway with auth headers built from cfg, then
      // return the normalised CreateChargeResult described above.
      throw new NotImplementedError(
        'TBC createCharge is not implemented yet. ' +
          'Wire it up against the /v1/tpay/payments endpoint — see this file\'s top comment.',
      );
    },

    async getStatus(_input) {
      throw new NotImplementedError(
        'TBC getStatus is not implemented yet. Call GET /v1/tpay/payments/{providerRef} and map via mapTbcStatus().',
      );
    },

    async parseWebhook({ headers, rawBody }) {
      // The verification helper is ready — the only thing missing is the
      // body schema, which the live docs will fix in stone. Until then,
      // we verify signature so even the placeholder is safe to expose.
      const sigHeader = headers['signature'] ?? headers['x-tbc-signature'];
      const provided = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
      const sig = (provided || '').replace(/^hmac-sha256=/i, '').trim();
      verifyHmacSha256({ rawBody, secret: cfg.webhookSecret, providedSignatureHex: sig });

      throw new NotImplementedError(
        'TBC parseWebhook is not implemented yet. Parse the verified JSON body and map the status via mapTbcStatus().',
      );
    },
  };
}
