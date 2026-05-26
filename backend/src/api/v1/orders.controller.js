// Orders controller. Thin: every method just adapts HTTP to the service
// and back. No business logic lives here.

import { asyncHandler } from '../../lib/asyncHandler.js';
import { ForbiddenError } from '../../lib/errors.js';

/**
 * @param {{ orderService: ReturnType<typeof import('../../domain/orders/order.service.js').createOrderService> }} deps
 */
export function createOrdersController({ orderService }) {
  return {
    create: asyncHandler(async (req, res) => {
      const order = await orderService.create({
        ...req.body,
        customerId: req.user?.uid ?? req.body?.customerId ?? null,
      });
      res.status(201).json({ order });
    }),

    getById: asyncHandler(async (req, res) => {
      const order = await orderService.get(req.params.id);
      // Authenticated users can only read their own orders. Guest orders
      // (no customerId) are addressable by id because that's how the
      // payment-return page looks them up; downgrade if you don't want
      // that behavior.
      if (order.customerId && req.user?.uid && order.customerId !== req.user.uid) {
        throw new ForbiddenError();
      }
      res.json({ order });
    }),

    listMine: asyncHandler(async (req, res) => {
      if (!req.user) {
        // 401 instead of empty list — never silently leak that the user
        // simply isn't authenticated.
        res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required' } });
        return;
      }
      const orders = await orderService.listForCustomer(req.user.uid);
      res.json({ orders });
    }),
  };
}
