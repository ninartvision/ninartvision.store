// Attach a stable correlation ID to every request so a single transaction
// can be traced across our logs, the bank's webhook callback, and any
// future fulfillment side effects.

import { randomUUID } from 'node:crypto';

const HEADER = 'x-request-id';

export function requestId(req, res, next) {
  const inbound = req.get(HEADER);
  const id = typeof inbound === 'string' && inbound.length <= 128 ? inbound : randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}
