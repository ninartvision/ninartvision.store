// Webhook signatures (TBC, BOG, Stripe, almost every payment provider) are
// computed over the EXACT bytes received — not the re-serialised JSON.
// Express's default `json()` parser silently throws those bytes away.
// This middleware preserves them on `req.rawBody` so signature verification
// works downstream.
//
// Mount it ONLY on webhook routes — leaving it global would double the
// memory cost of every JSON request and break the 1 MB body limit pattern.

import express from 'express';

export function rawJsonBody({ limit = '1mb' } = {}) {
  return express.json({
    limit,
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  });
}
