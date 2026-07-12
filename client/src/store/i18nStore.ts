// =============================================================================
// i18n Store — Zustand (language preference)
// =============================================================================

import { create } from 'zustand';
import type { LanguageCode } from '../i18n/types';

interface I18nState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const storedLanguage = (localStorage.getItem('preferred_language') as LanguageCode) || 'en';

export const useI18nStore = create<I18nState>((set) => ({
  language: storedLanguage,

  setLanguage: (lang: LanguageCode) => {
    localStorage.setItem('preferred_language', lang);
    set({ language: lang });
  },
}));
