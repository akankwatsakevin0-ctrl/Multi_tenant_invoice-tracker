// =============================================================================
// useCurrency Hook — Convert & format amounts based on user preference
// =============================================================================

import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import type { CurrencyCode } from '../types';

// Mock exchange rates
const EXCHANGE_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  USD: { USD: 1, EUR: 0.92 },
  EUR: { EUR: 1, USD: 1.09 },
};

interface CurrencyHelpers {
  /** The user's preferred display currency (USD or EUR) */
  preferredCurrency: CurrencyCode;

  /** Convert an amount from its original currency to the user's preferred display currency */
  convert: (amount: number, fromCurrency: CurrencyCode) => number;

  /** Format an amount with currency symbol, converted to the preferred display currency */
  format: (amount: number, fromCurrency: CurrencyCode) => string;

  /** Format an amount without conversion, just with the currency symbol */
  formatOriginal: (amount: number, currency: CurrencyCode) => string;

  /** Get the exchange rate between two currencies */
  getRate: (from: CurrencyCode, to: CurrencyCode) => number;

  /** Toggle between USD and EUR */
  toggleCurrency: () => void;
}

export function useCurrency(): CurrencyHelpers {
  const preferredCurrency = useUIStore((state) => state.currency);
  const toggleCurrency = useUIStore((state) => state.toggleCurrency);

  const helpers = useMemo<CurrencyHelpers>(
    () => ({
      preferredCurrency,

      convert(amount: number, fromCurrency: CurrencyCode): number {
        if (fromCurrency === preferredCurrency) return amount;
        const rate = EXCHANGE_RATES[fromCurrency]?.[preferredCurrency];
        if (rate === undefined) return amount;
        return Math.round(amount * rate * 100) / 100;
      },

      format(amount: number, fromCurrency: CurrencyCode): string {
        const converted = this.convert(amount, fromCurrency);
        return converted.toLocaleString('en-US', {
          style: 'currency',
          currency: preferredCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },

      formatOriginal(amount: number, currency: CurrencyCode): string {
        return amount.toLocaleString('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },

      getRate(from: CurrencyCode, to: CurrencyCode): number {
        return EXCHANGE_RATES[from]?.[to] ?? 1;
      },

      toggleCurrency,
    }),
    [preferredCurrency, toggleCurrency]
  );

  return helpers;
}
