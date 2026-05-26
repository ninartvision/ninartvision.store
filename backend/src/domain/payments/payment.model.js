// Payment aggregate. Mirrors the Order model's "pure data + small
// helpers" pattern — no provider imports, no I/O. Provider modules
// produce the raw fields, the service writes them through here.

import { newPaymentId } from '../../lib/id.js';
import { PaymentStatus } from './payment.status.js';

/**
 * @typedef {Object} Payment
 * @property {string}  id
 * @property {string}  orderId
 * @property {string}  provider
 * @property {string|null} providerRef
 * @property {number}  amountMinor
 * @property {import('../orders/order.types.js').Currency} currency
 * @property {import('./payment.status.js').PaymentStatusValue} status
 * @property {string}  idempotencyKey
 * @property {string|null} redirectUrl
 * @property {unknown}  providerData
 * @property {string}  createdAt
 * @property {string}  updatedAt
 */

/**
 * @param {{
 *   orderId: string,
 *   provider: string,
 *   amountMinor: number,
 *   currency: import('../orders/order.types.js').Currency,
 *   idempotencyKey: string,
 * }} input
 * @returns {Payment}
 */
export function createPaymentRecord(input) {
  const now = new Date().toISOString();
  return {
    id: newPaymentId(),
    orderId: input.orderId,
    provider: input.provider,
    providerRef: null,
    amountMinor: input.amountMinor,
    currency: input.currency,
    status: PaymentStatus.RequiresAction,
    idempotencyKey: input.idempotencyKey,
    redirectUrl: null,
    providerData: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Apply a status / providerRef / redirectUrl update from a provider call.
 * Returns a new payment record; never mutates in place.
 *
 * @param {Payment} payment
 * @param {Partial<Pick<Payment, 'status'|'providerRef'|'redirectUrl'|'providerData'>>} patch
 * @returns {Payment}
 */
export function applyPaymentUpdate(payment, patch) {
  return {
    ...payment,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
