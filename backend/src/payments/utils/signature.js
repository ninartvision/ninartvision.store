// Constant-time signature verification for inbound webhooks. Both TBC
// and BOG sign their callbacks — TBC with an HMAC-SHA256 over the raw
// body, BOG with an RSA-SHA256 against a published public key. This
// module covers both styles; provider modules pick the right one.
//
// `crypto.timingSafeEqual` is what stops attackers from inferring the
// secret a byte at a time via response-time side channels.

import { createHmac, createVerify, timingSafeEqual } from 'node:crypto';
import { InvalidSignatureError } from '../../lib/errors.js';

/** @param {string} a @param {string} b */
function safeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Verify an HMAC-SHA256 webhook signature.
 * @param {{ rawBody: Buffer, secret: string, providedSignatureHex: string }} input
 */
export function verifyHmacSha256({ rawBody, secret, providedSignatureHex }) {
  if (!secret) throw new InvalidSignatureError('Webhook secret is not configured');
  if (!providedSignatureHex) throw new InvalidSignatureError('Missing signature header');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!safeEqualHex(expected, providedSignatureHex)) {
    throw new InvalidSignatureError();
  }
}

/**
 * Verify an RSA-SHA256 webhook signature using the provider's published
 * public key — BOG uses this style.
 *
 * @param {{ rawBody: Buffer, publicKeyPem: string, providedSignatureBase64: string }} input
 */
export function verifyRsaSha256({ rawBody, publicKeyPem, providedSignatureBase64 }) {
  if (!publicKeyPem) throw new InvalidSignatureError('Webhook public key is not configured');
  if (!providedSignatureBase64) throw new InvalidSignatureError('Missing signature header');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(rawBody);
  verifier.end();
  const ok = verifier.verify(publicKeyPem, providedSignatureBase64, 'base64');
  if (!ok) throw new InvalidSignatureError();
}
