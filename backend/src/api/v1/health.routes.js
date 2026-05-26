// Liveness + readiness. Kept separate from the rest of the API so it
// can be exposed without auth, rate limit, or CORS surprises.

import { Router } from 'express';

export function createHealthRouter() {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true, ts: new Date().toISOString() });
  });

  router.get('/readyz', (_req, res) => {
    // When a real database is wired in, ping it here and 503 on failure.
    res.status(200).json({ ok: true });
  });

  return router;
}
