// Storage abstraction for Payments. Mirrors order.repository.js — see
// that file for the rationale. The idempotency map is what stops a
// retry from the frontend (network glitch, double-click) from creating
// two charges for the same order.

/**
 * @typedef {Object} PaymentRepository
 * @property {(p: import('./payment.model.js').Payment) => Promise<import('./payment.model.js').Payment>} save
 * @property {(id: string) => Promise<import('./payment.model.js').Payment|null>} findById
 * @property {(providerRef: string) => Promise<import('./payment.model.js').Payment|null>} findByProviderRef
 * @property {(orderId: string) => Promise<import('./payment.model.js').Payment[]>} listByOrder
 * @property {(idempotencyKey: string) => Promise<import('./payment.model.js').Payment|null>} findByIdempotencyKey
 */

/** @returns {PaymentRepository} */
export function createInMemoryPaymentRepository() {
  /** @type {Map<string, import('./payment.model.js').Payment>} */
  const byId = new Map();
  /** @type {Map<string, string>} */
  const byIdem = new Map();
  /** @type {Map<string, string>} */
  const byProviderRef = new Map();

  return {
    async save(p) {
      byId.set(p.id, p);
      if (p.idempotencyKey) byIdem.set(p.idempotencyKey, p.id);
      if (p.providerRef) byProviderRef.set(p.providerRef, p.id);
      return p;
    },
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async findByProviderRef(ref) {
      const id = byProviderRef.get(ref);
      return id ? (byId.get(id) ?? null) : null;
    },
    async listByOrder(orderId) {
      const out = [];
      for (const p of byId.values()) if (p.orderId === orderId) out.push(p);
      return out;
    },
    async findByIdempotencyKey(key) {
      const id = byIdem.get(key);
      return id ? (byId.get(id) ?? null) : null;
    },
  };
}
