// Payment provider registry.
//
// The rest of the codebase asks the registry for providers by name —
// it never imports a specific provider module. That single indirection
// is what lets us add TBC and BOG later, or swap implementations for
// tests, without touching any controller / service.
//
// Registration is explicit (not magic auto-discovery) so the boot
// sequence is grep-able and the dependency graph stays static.
//
// Disabled providers are tracked too, but only listed via `describe()`
// (not `get()` / `list()`). That keeps the operational surface clear —
// "TBC is registered" never means "TBC will accept charges" — while
// still giving the /v1/providers endpoint enough info to tell the
// frontend "TBC is available but needs config".

import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { createManualProvider } from './providers/manual.provider.js';
import { createTbcProvider } from './providers/tbc.provider.js';
import { createBogProvider } from './providers/bog.provider.js';

/**
 * @typedef {Object} ProviderReadiness
 * @property {string} name
 * @property {boolean} enabled
 * @property {string[]} missing
 * @property {string[]} supportedCurrencies
 *
 * @typedef {Object} PaymentProviderRegistry
 * @property {(name: string) => import('./provider.interface.js').PaymentProvider} get
 * @property {() => import('./provider.interface.js').PaymentProvider[]} list
 * @property {(name: string) => boolean} has
 * @property {() => ProviderReadiness[]} describe
 */

/**
 * Build a registry from a payments-config slice. Pure factory so tests
 * can inject a fake config without touching the real env-bound singleton.
 *
 * @param {{
 *   manual: { enabled: boolean, missing: string[], supportedCurrencies: string[] } & Record<string, any>,
 *   tbc:    { enabled: boolean, missing: string[], supportedCurrencies: string[] } & Record<string, any>,
 *   bog:    { enabled: boolean, missing: string[], supportedCurrencies: string[] } & Record<string, any>,
 * }} paymentsCfg
 * @returns {PaymentProviderRegistry}
 */
export function createPaymentProviderRegistry(paymentsCfg) {
  /** @type {Map<string, import('./provider.interface.js').PaymentProvider>} */
  const byName = new Map();
  /** @type {ProviderReadiness[]} */
  const catalog = [];

  /**
   * @param {string} name
   * @param {{ enabled: boolean, missing: string[], supportedCurrencies: string[] }} cfg
   * @param {() => import('./provider.interface.js').PaymentProvider} factory
   */
  function register(name, cfg, factory) {
    catalog.push({
      name,
      enabled: Boolean(cfg.enabled),
      missing: cfg.missing ?? [],
      supportedCurrencies: cfg.supportedCurrencies ?? [],
    });
    if (!cfg.enabled) {
      logger.info(
        { provider: name, missing: cfg.missing ?? [] },
        'payment_provider_skipped_disabled',
      );
      return;
    }
    if (byName.has(name)) {
      throw new ConflictError(`Payment provider "${name}" is already registered`);
    }
    const provider = factory();
    if (provider.name !== name) {
      throw new ValidationError(
        `Provider factory for "${name}" returned an instance with name "${provider.name}"`,
      );
    }
    byName.set(name, provider);
    logger.info({ provider: name }, 'payment_provider_registered');
  }

  // Order matters only for logging — every enabled provider ends up
  // equally addressable by name.
  register('manual', paymentsCfg.manual, () => createManualProvider(paymentsCfg.manual));
  register('tbc',    paymentsCfg.tbc,    () => createTbcProvider(paymentsCfg.tbc));
  register('bog',    paymentsCfg.bog,    () => createBogProvider(paymentsCfg.bog));

  return {
    get(name) {
      const p = byName.get(name);
      if (!p) {
        // Differentiate "this provider was scaffolded but its env vars
        // aren't set yet" from "no such provider name". The former is
        // the case the operator will hit most often before bank
        // credentials arrive — make it obvious how to fix.
        const known = catalog.find((c) => c.name === name);
        if (known && !known.enabled) {
          throw new NotFoundError(
            `Payment provider "${name}" is not configured on this server. ` +
              `Missing env: ${known.missing.join(', ') || '(unknown)'}.`,
          );
        }
        throw new NotFoundError(
          `Payment provider "${name}" is not registered. ` +
            `Available: ${[...byName.keys()].join(', ') || '(none)'}.`,
        );
      }
      return p;
    },
    has(name) {
      return byName.has(name);
    },
    list() {
      return [...byName.values()];
    },
    describe() {
      return catalog.map((c) => ({ ...c }));
    },
  };
}
