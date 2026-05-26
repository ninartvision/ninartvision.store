import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';

/** @param {{ ordersController: ReturnType<typeof import('./orders.controller.js').createOrdersController> }} deps */
export function createOrdersRouter({ ordersController }) {
  const router = Router();

  // Order creation is allowed for guests; authentication is parsed when
  // present so guest checkouts also work.
  router.post('/', authenticate({ required: false }), ordersController.create);

  // `/mine` MUST come before `/:id`, otherwise the bare-id matcher
  // swallows the literal "mine".
  router.get('/mine', authenticate({ required: true }), ordersController.listMine);
  router.get('/:id', authenticate({ required: false }), ordersController.getById);

  return router;
}
