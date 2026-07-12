// =============================================================================
// Currency conversion — mock endpoint utility
// =============================================================================

import { CurrencyCode } from '../types';

// ---------------------------------------------------------------------------
// Hard-coded mock exchange rates (as of 2026-07-10)
// ---------------------------------------------------------------------------
const MOCK_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  USD: { USD: 1, EUR: 0.92 },
  EUR: { EUR: 1, USD: 1.09 },
};

/**
 * Convert an amount from one currency to another using mock rates.
 * Returns null if the conversion is unsupported.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number | null {
  const rate = MOCK_RATES[from]?.[to];
  if (rate === undefined) return null;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Format an amount to 2 decimal places.
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}
