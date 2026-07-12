// =============================================================================
// i18n Index — Exports translations and types
// =============================================================================

import en from './en';
import fr from './fr';
import type { TranslationSet, LanguageCode } from './types';

export type { TranslationSet, LanguageCode };

const translations: Record<LanguageCode, TranslationSet> = {
  en,
  fr,
};

export function getTranslation(lang: LanguageCode): TranslationSet {
  return translations[lang] || translations.en;
}

export function getAvailableLanguages(): { code: LanguageCode; label: string }[] {
  return [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];
}

export default translations;
