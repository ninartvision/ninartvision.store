// Payment provider registry.
//
// The rest of the codebase asks the registry for providers by name —
// it never imports a specific provider module. That single indirection
// is what lets us add TBC and BOG later, or swap implementations for
// tests, without touching any controller / service.
//
// Registration is explicit (not magic auto-discovery) so the boot
// sequence is grep-able and the dependency graph stays static.

import { config } from '../config/index.js';
import { NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { createManualProvider } from './providers/manual.provider.js';
import { createTbcProvider } from './providers/tbc.provider.js';
import { createBogProvider } from './providers/bog.provider.js';

/**
 * @typedef {Object} PaymentProviderRegistry
 * @property {(name: string) => import('./provider.interface.js').PaymentProvider} get
 * @property {() => import('./provider.interface.js').PaymentProvider[]} list
 * @property {(name: string) => boolean} has
 */

/** @returns {PaymentProviderRegistry} */
export function createPaymentProviderRegistry() {
  /** @type {Map<string, import('./provider.interface.js').PaymentProvider>} */
  const byName = new Map();

  function register(provider) {
    if (!provider) return;
    if (!provider.enabled) {
      logger.info({ provider: provider.name }, 'payment_provider_skipped_disabled');
      return;
    }
    if (byName.has(provider.name)) {
      throw new Error(`Payment provider "${provider.name}" is already registered`);
    }
    byName.set(provider.name, provider);
    logger.info({ provider: provider.name }, 'payment_provider_registered');
  }

  // Order matters only for logging — every enabled provider ends up
  // equally addressable by name.
  register(createManualProvider(config.payments.manual));
  register(createTbcProvider(config.payments.tbc));
  register(createBogProvider(config.payments.bog));

  return {
    get(name) {
      const p = byName.get(name);
      if (!p) {
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
  };
}
