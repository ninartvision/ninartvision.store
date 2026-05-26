// Money helpers. Internally we ALWAYS store integer minor units (tetri
// for GEL, cents for USD/EUR). These helpers exist only at the I/O
// boundaries — when talking to banks that expect a decimal string, or
// rendering for humans.

/** @param {number} minor */
export function toDecimalString(minor) {
  if (!Number.isInteger(minor)) throw new TypeError(`amount must be an integer (got ${minor})`);
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const major = Math.floor(abs / 100);
  const fraction = (abs % 100).toString().padStart(2, '0');
  return `${sign}${major}.${fraction}`;
}

/** @param {string|number} decimal */
export function fromDecimal(decimal) {
  const n = typeof decimal === 'number' ? decimal : Number.parseFloat(decimal);
  if (!Number.isFinite(n)) throw new TypeError(`amount is not a number: ${decimal}`);
  // Round to avoid floating-point drift, e.g. 19.99 * 100 === 1998.9999…
  return Math.round(n * 100);
}
