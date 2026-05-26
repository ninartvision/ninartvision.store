// Opaque, URL-safe identifiers for orders/payments. Built on the platform
// crypto so we don't drag in `nanoid` for a 4-line helper.
//
// IDs are prefixed with their resource kind so they remain self-describing
// in logs and webhook payloads — `ord_…`, `pay_…`, `evt_…`, `idem_…`.

import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** @param {string} prefix @param {number} [length] */
export function makeId(prefix, length = 20) {
  return `${prefix}_${randomString(length)}`;
}

export const newOrderId = () => makeId('ord');
export const newPaymentId = () => makeId('pay');
export const newEventId = () => makeId('evt');
export const newIdempotencyKey = () => makeId('idem');
