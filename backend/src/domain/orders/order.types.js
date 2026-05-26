// JSDoc-only file. Centralises the Order shape so other modules can
// import { Order } as a type via `@typedef import`.

/**
 * @typedef {Object} OrderItem
 * @property {string}  productId
 * @property {string}  title
 * @property {number}  quantity
 * @property {number}  unitAmountMinor
 * @property {string|null} variantId
 * @property {boolean} hasFrame
 * @property {boolean} giftPackaging
 * @property {boolean} courierDelivery
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 * @property {string|null} city
 * @property {string|null} country
 */

/**
 * @typedef {'pending'|'awaiting_payment'|'paid'|'cancelled'|'refunded'|'fulfilled'} OrderStatus
 * @typedef {'GEL'|'USD'|'EUR'} Currency
 *
 * @typedef {Object} Order
 * @property {string}  id
 * @property {string|null} customerId
 * @property {OrderItem[]} items
 * @property {number}  subtotalMinor
 * @property {number}  shippingMinor
 * @property {number}  totalMinor
 * @property {Currency} currency
 * @property {OrderStatus} status
 * @property {ShippingAddress|null} shipping
 * @property {Record<string,string>} metadata
 * @property {string}  createdAt
 * @property {string}  updatedAt
 */

export {};
