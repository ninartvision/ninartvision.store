// THE contract every payment provider implements. This file is JSDoc-only
// so it has zero runtime cost — TypeScript users can use it via
// `@implements`, plain-JS editors get autocomplete via @typedef.
//
// When you add TBC, BOG, Stripe, Adyen, PayPal, anything: copy
// providers/manual.provider.js as a template, implement these methods,
// register the module in payments/index.js. Nothing else has to change.

/**
 * @typedef {Object} CreateChargeInput
 * @property {import('../domain/orders/order.types.js').Order} order
 * @property {number} amountMinor                                // total to charge, in tetri / cents
 * @property {import('../domain/orders/order.types.js').Currency} currency
 * @property {string} returnUrl                                  // where the bank redirects the user after checkout
 * @property {string} webhookUrl                                 // where the bank POSTs status updates
 * @property {string} idempotencyKey                             // safe to forward to the bank if it supports it
 * @property {Record<string, string>=} metadata
 *
 * @typedef {Object} CreateChargeResult
 * @property {string} providerRef                                // bank-side transaction id
 * @property {string|null=} redirectUrl                          // hosted checkout URL; null for non-redirect flows
 * @property {import('../domain/payments/payment.status.js').PaymentStatusValue} status
 * @property {unknown=} raw                                      // verbatim bank response, kept for audit
 *
 * @typedef {Object} GetStatusInput
 * @property {string} providerRef
 *
 * @typedef {Object} StatusResult
 * @property {import('../domain/payments/payment.status.js').PaymentStatusValue} status
 * @property {number=} capturedAmountMinor
 * @property {unknown=} raw
 *
 * @typedef {Object} ParseWebhookInput
 * @property {Record<string, string|string[]|undefined>} headers
 * @property {Buffer} rawBody                                    // raw bytes — required for HMAC verification
 *
 * @typedef {Object} ParseWebhookResult
 * @property {string} providerRef
 * @property {import('../domain/payments/payment.status.js').PaymentStatusValue} status
 * @property {number=} capturedAmountMinor
 * @property {unknown=} raw
 *
 * @typedef {Object} RefundInput
 * @property {string} providerRef
 * @property {number=} amountMinor                               // partial refund when set; full when omitted
 *
 * @typedef {Object} CancelInput
 * @property {string} providerRef
 *
 * @typedef {Object} PaymentProvider
 * @property {string} name                                       // unique id used in env and URLs
 * @property {boolean} enabled                                   // false → registry refuses to register it
 * @property {(input: CreateChargeInput)  => Promise<CreateChargeResult>}  createCharge
 * @property {(input: GetStatusInput)     => Promise<StatusResult>}        getStatus
 * @property {(input: ParseWebhookInput)  => Promise<ParseWebhookResult>}  parseWebhook
 * @property {((input: RefundInput) => Promise<StatusResult>)=}            refund
 * @property {((input: CancelInput) => Promise<StatusResult>)=}            cancel
 */

export {}; // marker so this file is a module
