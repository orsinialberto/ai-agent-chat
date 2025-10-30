import { useState, useEffect } from 'react';
import { detectBrowserLanguage, getTranslations, t as translate, SupportedLanguage, Translations } from '../utils/i18n';

/**
 * Hook for accessing translations in components
 */
export function useTranslation() {
  const [language, setLanguage] = useState<SupportedLanguage>(detectBrowserLanguage());
  const [translations, setTranslations] = useState<Translations>(getTranslations(language));

  useEffect(() => {
    setTranslations(getTranslations(language));
  }, [language]);

  const t = (key: string) => translate(key, language);

  return {
    t,
    language,
    setLanguage,
    translations
  };
}

