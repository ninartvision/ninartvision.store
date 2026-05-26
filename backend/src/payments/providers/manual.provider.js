// Manual / "offline" payment provider — bank transfer or WhatsApp
// inquiry, the flow the storefront uses today. There is no redirect,
// no webhook; the customer is shown payment instructions and an admin
// (or a Sanity update) flips the order to `paid` later via the API.
//
// This module is intentionally simple. It exists as:
//   • a real, working reference implementation of the provider
//     contract that other providers can be cross-checked against, and
//   • a guaranteed fallback so the storefront can take orders even
//     when every bank gateway is offline.

import { makeId } from '../../lib/id.js';
import { NotImplementedError } from '../../lib/errors.js';
import { PaymentStatus } from '../../domain/payments/payment.status.js';

/**
 * @param {{ enabled: boolean, instructionsUrl: string }} cfg
 * @returns {import('../provider.interface.js').PaymentProvider}
 */
export function createManualProvider(cfg) {
  return {
    name: 'manual',
    enabled: cfg.enabled,

    async createCharge({ order }) {
      // No external call — we just mint our own reference, hand the
      // caller a `requires_action` status, and let the storefront show
      // bank-transfer instructions / open a WhatsApp inquiry.
      return {
        providerRef: makeId('manual', 16),
        redirectUrl: cfg.instructionsUrl,
        status: PaymentStatus.RequiresAction,
        raw: { orderId: order.id, instructionsUrl: cfg.instructionsUrl },
      };
    },

    async getStatus() {
      // Manual flow has no external system to poll — the status the
      // service already has on disk is authoritative.
      return { status: PaymentStatus.RequiresAction };
    },

    async parseWebhook() {
      // Manual provider exposes no webhook. If a request lands here
      // it's a misconfiguration somewhere upstream; fail loudly.
      throw new NotImplementedError('Manual provider does not accept webhooks');
    },
  };
}
