// =============================================================================
// useTranslation Hook
// =============================================================================

import { useI18nStore } from '../store/i18nStore';
import { getTranslation } from '../i18n';
import type { TranslationSet } from '../i18n/types';

export function useTranslation(): TranslationSet {
  const language = useI18nStore((state) => state.language);
  return getTranslation(language);
}

export function useLanguage() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);
  return { language, setLanguage };
}
