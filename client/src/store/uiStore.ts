// =============================================================================
// UI Store — Zustand (currency preference, sidebar state)
// =============================================================================

import { create } from 'zustand';
import type { CurrencyCode } from '../types';

interface UIState {
  currency: CurrencyCode;
  sidebarOpen: boolean;

  setCurrency: (currency: CurrencyCode) => void;
  toggleCurrency: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const storedCurrency = (localStorage.getItem('preferred_currency') as CurrencyCode) || 'USD';

export const useUIStore = create<UIState>((set) => ({
  currency: storedCurrency,
  sidebarOpen: window.innerWidth >= 1024,

  setCurrency: (currency: CurrencyCode) => {
    localStorage.setItem('preferred_currency', currency);
    set({ currency });
  },

  toggleCurrency: () =>
    set((state) => {
      const next = state.currency === 'USD' ? 'EUR' : 'USD';
      localStorage.setItem('preferred_currency', next);
      return { currency: next };
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
