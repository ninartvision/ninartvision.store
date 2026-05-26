// Orchestrates the Order lifecycle. The HTTP controllers call into this
// service — they never touch the repository or model directly. The
// service is also the thing that subscribes to payment events so the
// order status follows payment state changes automatically.

import { NotFoundError } from '../../lib/errors.js';
import { createOrder, withStatus } from './order.model.js';

/**
 * @param {{
 *   repository: import('./order.repository.js').OrderRepository,
 *   paymentEvents?: import('node:events').EventEmitter,
 *   logger?: { info: Function, warn: Function, error: Function },
 * }} deps
 */
export function createOrderService({ repository, paymentEvents, logger }) {
  /** @param {import('./order.model.js').OrderInput} input */
  async function create(input) {
    const order = createOrder(input);
    await repository.save(order);
    logger?.info({ orderId: order.id, totalMinor: order.totalMinor }, 'order_created');
    return order;
  }

  async function get(id) {
    const order = await repository.findById(id);
    if (!order) throw new NotFoundError(`Order ${id} not found`);
    return order;
  }

  async function listForCustomer(customerId) {
    return repository.listByCustomer(customerId);
  }

  /** @param {string} id @param {import('./order.types.js').OrderStatus} next */
  async function transition(id, next) {
    const current = await get(id);
    const updated = withStatus(current, next);
    await repository.save(updated);
    logger?.info({ orderId: id, from: current.status, to: next }, 'order_status_changed');
    return updated;
  }

  // Wire payment events → order status. This is what keeps payment
  // concerns out of the HTTP layer: a TBC webhook lands, the payment
  // service emits `payment.succeeded`, and the order silently moves
  // from `awaiting_payment` to `paid` here.
  if (paymentEvents) {
    paymentEvents.on('payment.succeeded', async ({ orderId }) => {
      try {
        const order = await repository.findById(orderId);
        if (!order) return;
        if (order.status === 'awaiting_payment' || order.status === 'pending') {
          await repository.save(withStatus(order, 'paid'));
          logger?.info({ orderId }, 'order_marked_paid_via_payment_event');
        }
      } catch (err) {
        logger?.error({ err, orderId }, 'order_payment_succeeded_handler_failed');
      }
    });

    paymentEvents.on('payment.failed', async ({ orderId }) => {
      logger?.warn({ orderId }, 'payment_failed_for_order');
    });
  }

  return { create, get, listForCustomer, transition };
}
