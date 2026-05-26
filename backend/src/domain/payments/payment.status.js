// Canonical payment statuses used across the application. Provider
// modules MUST map their bank-specific states into one of these — that
// way the rest of the codebase, the database, and the public API stay
// stable even when we add a new gateway.
//
// Lifecycle:
//   requires_action → user is being redirected to the bank's checkout
//   processing      → bank is verifying / settling
//   succeeded       → money received, order can be fulfilled
//   failed          → bank rejected the transaction
//   cancelled       → user closed the checkout or we cancelled it
//   refunded        → previously-succeeded payment was reversed

export const PaymentStatus = Object.freeze({
  RequiresAction: 'requires_action',
  Processing: 'processing',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
});

/** @typedef {'requires_action'|'processing'|'succeeded'|'failed'|'cancelled'|'refunded'} PaymentStatusValue */

const TERMINAL = new Set([PaymentStatus.Succeeded, PaymentStatus.Failed, PaymentStatus.Cancelled, PaymentStatus.Refunded]);

/** @param {PaymentStatusValue} s */
export function isTerminal(s) {
  return TERMINAL.has(s);
}

/** @param {string} s */
export function assertStatus(s) {
  const ok = Object.values(PaymentStatus).includes(/** @type {any} */ (s));
  if (!ok) throw new Error(`Unknown payment status: ${s}`);
  return /** @type {PaymentStatusValue} */ (s);
}
