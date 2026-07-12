import { describe, it, expect } from 'vitest';
import { convertCurrency, formatAmount } from '../../utils/currency';

describe('convertCurrency', () => {
  it('converts USD to EUR', () => {
    const result = convertCurrency(100, 'USD', 'EUR');
    expect(result).toBe(92);
  });

  it('converts EUR to USD', () => {
    const result = convertCurrency(100, 'EUR', 'USD');
    expect(result).toBe(109);
  });

  it('returns same amount for same currency', () => {
    expect(convertCurrency(50, 'USD', 'USD')).toBe(50);
    expect(convertCurrency(50, 'EUR', 'EUR')).toBe(50);
  });

  it('rounds to 2 decimal places', () => {
    const result = convertCurrency(10.5, 'USD', 'EUR');
    expect(result).toBe(9.66);
  });

  it('returns null for unsupported currency', () => {
    expect(convertCurrency(100, 'USD', 'GBP' as any)).toBeNull();
  });

  it('handles zero', () => {
    expect(convertCurrency(0, 'USD', 'EUR')).toBe(0);
  });
});

describe('formatAmount', () => {
  it('formats integer to 2 decimal places', () => {
    expect(formatAmount(100)).toBe('100.00');
  });

  it('formats decimal to 2 decimal places', () => {
    expect(formatAmount(100.5)).toBe('100.50');
  });

  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0.00');
  });
});
