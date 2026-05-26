// Tiny in-memory sliding-window rate limiter. Good enough for a single
// process; if/when the API is run as multiple replicas behind a load
// balancer, swap the `store` for a Redis-backed implementation — the
// rest of the code keeps working unchanged.

import { RateLimitError } from '../lib/errors.js';

class MemoryStore {
  constructor() {
    /** @type {Map<string, { count: number, resetAt: number }>} */
    this._buckets = new Map();
  }

  hit(key, windowMs) {
    const now = Date.now();
    const bucket = this._buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this._buckets.set(key, fresh);
      return fresh;
    }
    bucket.count += 1;
    return bucket;
  }
}

const defaultStore = new MemoryStore();

/**
 * @param {{ windowMs: number, max: number, keyFn?: (req: import('express').Request) => string, store?: MemoryStore }} opts
 */
export function rateLimit(opts) {
  const store = opts.store ?? defaultStore;
  const keyFn = opts.keyFn ?? ((req) => `${req.ip}:${req.path}`);
  return (req, res, next) => {
    const bucket = store.hit(keyFn(req), opts.windowMs);
    res.setHeader('X-RateLimit-Limit', String(opts.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.max - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > opts.max) {
      return next(new RateLimitError());
    }
    next();
  };
}
