/**
 * Shared Helper Utilities
 */

/**
 * Seeded pseudo-random number generator for reproducible Monte Carlo runs.
 */
export function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    return (s = s * 16807 % 2147483647) / 2147483647;
  };
}

/**
 * Clamps a number between min and max.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Maps day (1 to 31) to SVG X-coordinate (80 to 860 px).
 */
export function dayToX(day) {
  return 80 + (day - 1) * 26;
}

/**
 * Maps cost index (0 to 120) to SVG Y-coordinate (340 to 40 px).
 */
export function costToY(cost) {
  const clamped = clamp(cost, 0, 120);
  return 340 - (clamped * 2.5);
}

/**
 * Formats a currency amount with commas.
 */
export function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString();
}
