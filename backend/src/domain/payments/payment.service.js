// The provider-agnostic payment façade. EVERY HTTP controller and
// background worker talks to this service — they never reach into a
// specific bank module. That single rule is what makes TBC and BOG
// pluggable without rewriting the API.
//
// Responsibilities:
//   1. Look up / create the persisted Payment record.
//   2. Enforce idempotency so retries don't double-charge.
//   3. Delegate the actual bank call to whichever provider the caller
//      asked for (resolved via the registry).
//   4. Emit domain events when status changes so OrderService and
//      future side-effects (emails, Slack, fulfillment) can react.

import { EventEmitter } from 'node:events';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { newIdempotencyKey } from '../../lib/id.js';
import { applyPaymentUpdate, createPaymentRecord } from './payment.model.js';
import { PaymentStatus, isTerminal } from './payment.status.js';

/**
 * @param {{
 *   payments: import('./payment.repository.js').PaymentRepository,
 *   orders: import('../orders/order.repository.js').OrderRepository,
 *   providers: import('../../payments/index.js').PaymentProviderRegistry,
 *   defaultProvider: string,
 *   webhookBaseUrl: string,
 *   logger?: { info: Function, warn: Function, error: Function },
 * }} deps
 */
export function createPaymentService({ payments, orders, providers, defaultProvider, webhookBaseUrl, logger }) {
  const events = new EventEmitter();

  /**
   * Initiate a payment for an order.
   *
   * @param {{
   *   orderId: string,
   *   provider?: string,
   *   returnUrl: string,
   *   idempotencyKey?: string,
   *   metadata?: Record<string,string>,
   * }} input
   */
  async function initiate(input) {
    if (!input.orderId) throw new ValidationError('orderId is required');
    if (!input.returnUrl) throw new ValidationError('returnUrl is required');

    const order = await orders.findById(input.orderId);
    if (!order) throw new NotFoundError(`Order ${input.orderId} not found`);

    if (order.status !== 'pending' && order.status !== 'awaiting_payment') {
      throw new ConflictError(`Order ${order.id} is not payable (status=${order.status})`);
    }

    const providerName = input.provider || defaultProvider;
    const provider = providers.get(providerName);

    // Currency guard. TBC/BOG contracts usually allow GEL only — surface
    // that as a 400 here rather than letting the bank reject the request
    // 5 seconds later with a less actionable error. The allowlist lives
    // in config (per-provider env override) so adding USD when your
    // contract permits is a one-line .env change.
    const readiness = providers.describe().find((p) => p.name === providerName);
    const allowed = readiness?.supportedCurrencies ?? [];
    if (allowed.length && !allowed.includes(order.currency)) {
      throw new ValidationError(
        `Provider "${providerName}" does not accept ${order.currency}. ` +
          `Allowed: ${allowed.join(', ')}.`,
        { providerName, currency: order.currency, allowed },
      );
    }

    const idempotencyKey = input.idempotencyKey ?? newIdempotencyKey();
    const existing = await payments.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      logger?.info({ idempotencyKey, paymentId: existing.id }, 'payment_idempotent_replay');
      return existing;
    }

    let record = createPaymentRecord({
      orderId: order.id,
      provider: providerName,
      amountMinor: order.totalMinor,
      currency: order.currency,
      idempotencyKey,
    });
    await payments.save(record);

    // Hand off to the provider. Providers don't touch the database — they
    // return a normalised shape and we persist it here.
    const result = await provider.createCharge({
      order,
      amountMinor: order.totalMinor,
      currency: order.currency,
      returnUrl: input.returnUrl,
      webhookUrl: `${webhookBaseUrl}/v1/webhooks/${providerName}`,
      idempotencyKey,
      metadata: input.metadata ?? {},
    });

    record = applyPaymentUpdate(record, {
      providerRef: result.providerRef,
      redirectUrl: result.redirectUrl ?? null,
      status: result.status,
      providerData: result.raw ?? null,
    });
    await payments.save(record);

    // Move the order out of "pending" the moment a payment is initiated.
    const updatedOrder = { ...order, status: 'awaiting_payment', updatedAt: new Date().toISOString() };
    await orders.save(updatedOrder);

    events.emit('payment.created', { paymentId: record.id, orderId: order.id });
    if (isTerminal(record.status)) {
      _emitStatus(record);
    }
    return record;
  }

  /**
   * Refresh a payment's status from the provider — useful as a polling
   * fallback when a webhook is delayed or lost.
   */
  async function syncFromProvider(paymentId) {
    const payment = await payments.findById(paymentId);
    if (!payment) throw new NotFoundError(`Payment ${paymentId} not found`);
    if (!payment.providerRef) return payment;
    if (isTerminal(payment.status)) return payment;

    const provider = providers.get(payment.provider);
    const result = await provider.getStatus({ providerRef: payment.providerRef });
    return _applyExternalUpdate(payment, result);
  }

  /**
   * Apply a status update that originated outside of `initiate` — webhooks,
   * polling, manual admin actions. Idempotent: replaying the same terminal
   * event is a no-op.
   *
   * @param {string} providerRef
   * @param {{ status: import('./payment.status.js').PaymentStatusValue, raw?: unknown, capturedAmountMinor?: number }} update
   */
  async function applyProviderUpdate(providerRef, update) {
    const payment = await payments.findByProviderRef(providerRef);
    if (!payment) {
      logger?.warn({ providerRef }, 'webhook_for_unknown_payment');
      throw new NotFoundError('Payment not found for providerRef');
    }
    return _applyExternalUpdate(payment, update);
  }

  async function _applyExternalUpdate(payment, update) {
    if (isTerminal(payment.status) && payment.status === update.status) {
      return payment;
    }
    const next = applyPaymentUpdate(payment, {
      status: update.status,
      providerData: update.raw ?? payment.providerData,
    });
    await payments.save(next);
    _emitStatus(next);
    return next;
  }

  function _emitStatus(payment) {
    events.emit('payment.status_changed', { paymentId: payment.id, orderId: payment.orderId, status: payment.status });
    if (payment.status === PaymentStatus.Succeeded) {
      events.emit('payment.succeeded', { paymentId: payment.id, orderId: payment.orderId });
    } else if (payment.status === PaymentStatus.Failed) {
      events.emit('payment.failed', { paymentId: payment.id, orderId: payment.orderId });
    }
  }

  async function getById(id) {
    const p = await payments.findById(id);
    if (!p) throw new NotFoundError(`Payment ${id} not found`);
    return p;
  }

  return { initiate, syncFromProvider, applyProviderUpdate, getById, events };
}
