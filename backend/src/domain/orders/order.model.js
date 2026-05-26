// Pure data + validation for the Order aggregate. No I/O, no Express,
// no payment provider knowledge — that way order.service can be unit
// tested without spinning up the whole app.
//
// Money is stored in MINOR UNITS (tetri for GEL, cents for USD/EUR) as
// plain integers. Never floats. Provider modules format to/from this
// canonical representation at the edges.

import { ValidationError } from '../../lib/errors.js';
import { newOrderId } from '../../lib/id.js';

/** @typedef {'GEL'|'USD'|'EUR'} Currency */
/** @typedef {'pending'|'awaiting_payment'|'paid'|'cancelled'|'refunded'|'fulfilled'} OrderStatus */

/**
 * @typedef {Object} OrderItemInput
 * @property {string}  productId
 * @property {string}  title
 * @property {number}  quantity
 * @property {number}  unitAmountMinor
 * @property {string=} variantId
 * @property {boolean=} hasFrame
 * @property {boolean=} giftPackaging
 * @property {boolean=} courierDelivery
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string}  name
 * @property {string}  email
 * @property {string}  phone
 * @property {string}  address
 * @property {string=} city
 * @property {string=} country
 */

/**
 * @typedef {Object} OrderInput
 * @property {OrderItemInput[]} items
 * @property {Currency}         currency
 * @property {number=}          shippingMinor
 * @property {ShippingAddress=} shipping
 * @property {string|null=}     customerId
 * @property {Record<string,string>=} metadata
 */

const SUPPORTED_CURRENCIES = new Set(['GEL', 'USD', 'EUR']);
const MAX_ITEMS = 50;

function assert(condition, message, details) {
  if (!condition) throw new ValidationError(message, details);
}

function normaliseItem(item, index) {
  assert(item && typeof item === 'object', `items[${index}] must be an object`);
  assert(typeof item.productId === 'string' && item.productId, `items[${index}].productId is required`);
  assert(typeof item.title === 'string' && item.title, `items[${index}].title is required`);
  assert(Number.isInteger(item.quantity) && item.quantity > 0, `items[${index}].quantity must be a positive integer`);
  assert(
    Number.isInteger(item.unitAmountMinor) && item.unitAmountMinor >= 0,
    `items[${index}].unitAmountMinor must be a non-negative integer (minor units)`,
  );
  return {
    productId: item.productId,
    title: item.title,
    quantity: item.quantity,
    unitAmountMinor: item.unitAmountMinor,
    variantId: item.variantId ?? null,
    hasFrame: Boolean(item.hasFrame),
    giftPackaging: Boolean(item.giftPackaging),
    courierDelivery: Boolean(item.courierDelivery),
  };
}

function normaliseShipping(shipping) {
  if (!shipping) return null;
  assert(typeof shipping.name === 'string' && shipping.name, 'shipping.name is required');
  assert(typeof shipping.email === 'string' && shipping.email.includes('@'), 'shipping.email is invalid');
  assert(typeof shipping.phone === 'string' && shipping.phone, 'shipping.phone is required');
  assert(typeof shipping.address === 'string' && shipping.address, 'shipping.address is required');
  return {
    name: shipping.name.trim(),
    email: shipping.email.trim().toLowerCase(),
    phone: shipping.phone.trim(),
    address: shipping.address.trim(),
    city: shipping.shipping?.city?.trim?.() || shipping.city?.trim?.() || null,
    country: shipping.country?.trim?.() || null,
  };
}

/**
 * Build a brand-new Order aggregate from validated input.
 * @param {OrderInput} input
 * @returns {import('./order.types.js').Order}
 */
export function createOrder(input) {
  assert(input && typeof input === 'object', 'order input must be an object');
  assert(Array.isArray(input.items) && input.items.length > 0, 'items[] must be a non-empty array');
  assert(input.items.length <= MAX_ITEMS, `items[] exceeds the maximum of ${MAX_ITEMS}`);
  assert(SUPPORTED_CURRENCIES.has(input.currency), `currency must be one of ${[...SUPPORTED_CURRENCIES].join(', ')}`);

  const items = input.items.map(normaliseItem);
  const subtotalMinor = items.reduce((sum, it) => sum + it.unitAmountMinor * it.quantity, 0);
  const shippingMinor = Number.isInteger(input.shippingMinor) && input.shippingMinor >= 0 ? input.shippingMinor : 0;
  const totalMinor = subtotalMinor + shippingMinor;

  const now = new Date().toISOString();
  return {
    id: newOrderId(),
    customerId: input.customerId ?? null,
    items,
    subtotalMinor,
    shippingMinor,
    totalMinor,
    currency: input.currency,
    status: /** @type {OrderStatus} */ ('pending'),
    shipping: normaliseShipping(input.shipping),
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

// Allowed status transitions. Anything outside this map throws — that's
// what stops a refunded order silently becoming "paid" again because of
// a delayed webhook retry.
const TRANSITIONS = {
  pending: new Set(['awaiting_payment', 'cancelled']),
  awaiting_payment: new Set(['paid', 'cancelled']),
  paid: new Set(['fulfilled', 'refunded']),
  fulfilled: new Set(['refunded']),
  cancelled: new Set([]),
  refunded: new Set([]),
};

/** @param {OrderStatus} from @param {OrderStatus} to */
export function canTransition(from, to) {
  return TRANSITIONS[from]?.has(to) ?? false;
}

/**
 * Returns a new order with the updated status, or throws if the
 * transition is illegal. Pure — does not persist anything.
 *
 * @param {import('./order.types.js').Order} order
 * @param {OrderStatus} next
 */
export function withStatus(order, next) {
  if (order.status === next) return order;
  if (!canTransition(order.status, next)) {
    throw new ValidationError(`Illegal order status transition: ${order.status} → ${next}`, {
      orderId: order.id,
    });
  }
  return { ...order, status: next, updatedAt: new Date().toISOString() };
}
