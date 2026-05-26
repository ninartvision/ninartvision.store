// Storage abstraction. The service layer only knows about this shape —
// swapping the in-memory implementation for Postgres / Mongo / DynamoDB
// later is a single file change. No driver dependency leaks into the
// rest of the codebase.

/**
 * @typedef {Object} OrderRepository
 * @property {(order: import('./order.types.js').Order) => Promise<import('./order.types.js').Order>} save
 * @property {(id: string) => Promise<import('./order.types.js').Order|null>} findById
 * @property {(customerId: string) => Promise<import('./order.types.js').Order[]>} listByCustomer
 */

/** @returns {OrderRepository} */
export function createInMemoryOrderRepository() {
  /** @type {Map<string, import('./order.types.js').Order>} */
  const byId = new Map();

  return {
    async save(order) {
      byId.set(order.id, order);
      return order;
    },
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async listByCustomer(customerId) {
      const out = [];
      for (const o of byId.values()) if (o.customerId === customerId) out.push(o);
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
