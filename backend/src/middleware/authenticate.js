// Verifies the Firebase ID token that the storefront's client-side
// Google sign-in already issues (see /auth.js and /auth.config.example.js
// at the repo root). When Firebase Admin isn't configured the middleware
// quietly no-ops so the API still serves public + manual flows in dev.
//
// On success it sets `req.user = { uid, email, name, picture }`.
// On failure it forwards an `UnauthorizedError`.

import { UnauthorizedError } from '../lib/errors.js';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

let _adminPromise = null;

async function getAdmin() {
  if (!config.auth.firebase.enabled) return null;
  if (_adminPromise) return _adminPromise;
  _adminPromise = (async () => {
    try {
      const mod = await import('firebase-admin');
      const admin = mod.default ?? mod;
      if (!admin.apps?.length) {
        admin.initializeApp({
          credential: admin.credential.cert(config.auth.firebase.serviceAccount),
          projectId: config.auth.firebase.projectId,
        });
      }
      return admin;
    } catch (err) {
      logger.warn({ err: err.message }, 'firebase_admin_unavailable');
      return null;
    }
  })();
  return _adminPromise;
}

function extractToken(req) {
  const header = req.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * @param {{ required?: boolean }} [opts]
 *   - required: true  → 401 when no token / invalid token
 *   - required: false → attach user if present, otherwise continue as guest
 */
export function authenticate({ required = false } = {}) {
  return async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
      if (required) return next(new UnauthorizedError());
      return next();
    }

    const admin = await getAdmin();
    if (!admin) {
      // Firebase isn't wired up. Don't pretend we verified the token.
      if (required) return next(new UnauthorizedError('Authentication is not configured'));
      return next();
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token, true);
      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        picture: decoded.picture ?? null,
      };
      next();
    } catch (err) {
      logger.warn({ err: err.message, reqId: req.id }, 'token_verification_failed');
      if (required) return next(new UnauthorizedError('Invalid or expired token'));
      next();
    }
  };
}
